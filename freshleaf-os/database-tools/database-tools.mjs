import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolveTxt } from 'node:dns/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { parse } from 'dotenv';
import { MongoClient } from 'mongodb';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const SAFE_BACKUP = /^[a-zA-Z0-9_-]+_\d{4}-\d{2}-\d{2}_\d{6}_\d{3}_[a-f0-9]{8}$/;
class SafeError extends Error {}
const fail = message => { throw new SafeError(message); };

// Never log native errors: drivers/tools can include credentials in their messages.
export async function loadConfig(root = ROOT, env = process.env) {
  let source;
  try { source = await fs.readFile(path.join(root, 'backend/config/db.ts'), 'utf8'); }
  catch { fail('Khong doc duoc backend/config/db.ts. Chay trong ban sao day du cua du an.'); }
  const declarations = [...source.matchAll(/export\s+const\s+DB_NAME\s*=\s*['"]([a-zA-Z0-9_-]+)['"]\s*;/g)];
  if (declarations.length !== 1) fail('Khong xac dinh duy nhat DB_NAME tu backend/config/db.ts; can kiem tra cau hinh backend, khong tu doan.');
  const sourceDb = declarations[0][1];
  if (sourceDb.length > 63 || ['admin', 'local', 'config'].includes(sourceDb.toLowerCase())) fail('DB_NAME nguon khong hop le cho cong cu nay.');
  const merged = { ...env };
  for (const name of ['backend/.env', '.env']) {
    try {
      const values = parse(await fs.readFile(path.join(root, name)));
      for (const [key, value] of Object.entries(values)) if (merged[key] === undefined) merged[key] = value;
    } catch (error) {
      if (error.code !== 'ENOENT') fail('Khong doc duoc file moi truong; kiem tra quyen doc.');
    }
  }
  const uri = merged.MONGODB_URI?.trim();
  if (!uri) fail('Thieu MONGODB_URI. Dat bien moi truong MONGODB_URI hoac cau hinh backend/.env (xem README.md).');
  try { const client = new MongoClient(uri); await client.close(); }
  catch { fail('MONGODB_URI khong hop le. Kiem tra scheme, URL-encode mat khau va tuy chon ket noi; URI khong duoc hien thi.'); }
  return { uri, sourceDb };
}

export function validateTarget(target, sourceDb) {
  if (target.toLowerCase() === sourceDb.toLowerCase() || !/^freshleaf_restore_demo(?:_[a-z0-9]+)*$/.test(target) || Buffer.byteLength(target) > 63) {
    fail('Database dich bi chan. Chi cho phep freshleaf_restore_demo hoac freshleaf_restore_demo_<chu thuong/so>, toi da 63 byte, khac database nguon.');
  }
  return target;
}

// Remove the default database so --db and namespace mapping are unambiguous.
// Preserve the original implicit authentication database when credentials are present.
export async function toolsUri(uri, lookupTxt = resolveTxt) {
  const match = /^(mongodb(?:\+srv)?:\/\/)([^/?#]+)(?:\/([^?#]*))?(?:\?([^#]*))?$/.exec(uri);
  if (!match) fail('Dinh dang URI chua duoc ho tro an toan. Kiem tra README.md.');
  const query = new URLSearchParams(match[4] || '');
  if (match[2].includes('@') && ![...query.keys()].some(key => key.toLowerCase() === 'authsource')) {
    let authSource = decodeURIComponent(match[3] || 'admin');
    if (match[1] === 'mongodb+srv://') {
      try {
        const records = await lookupTxt(match[2].slice(match[2].lastIndexOf('@') + 1));
        if (records.length > 1) fail('DNS TXT co nhieu ban ghi; dung lai, khong doan authSource.');
        if (records.length) authSource = new URLSearchParams(records[0].join('')).get('authSource') || authSource;
      } catch (error) {
        if (error instanceof SafeError) throw error;
        if (!['ENODATA', 'ENOTFOUND'].includes(error.code)) fail('Khong doc duoc DNS TXT de bao toan authSource. Kiem tra DNS hoac khai bao authSource dung trong URI.');
      }
    }
    query.set('authSource', authSource);
  }
  const suffix = query.toString();
  return `${match[1]}${match[2]}/${suffix ? `?${suffix}` : ''}`;
}

export function findTools(executeFile = execFileSync) {
  const result = {};
  for (const name of ['mongodump', 'mongorestore']) {
    try {
      const found = executeFile('where.exe', [`${name}.exe`], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
        .trim().split(/\r?\n/).find(p => path.isAbsolute(p) && p.toLowerCase().endsWith('.exe'));
      if (!found) throw new Error();
      const version = executeFile(found, ['--version'], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      const match = /version:\s*(\d+)\.(\d+)\.(\d+)/i.exec(version);
      if (!match || Number(match[1]) < 100 || (Number(match[1]) === 100 && Number(match[2]) < 3)) {
        fail('Can MongoDB Database Tools 100.3.0+ de ho tro --config.');
      }
      result[name] = found;
    } catch { fail(`Thieu hoac khong chay duoc ${name}.exe 100.3.0+. Cai MongoDB Database Tools va them thu muc bin vao PATH (README.md).`); }
  }
  return result;
}

export async function withSecureConfig(uri, action) {
  let directory;
  try {
    directory = await fs.mkdtemp(path.join(tmpdir(), 'freshleaf-mongodb-'));
    if (process.platform === 'win32') {
      const sid = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value'],
        { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
      if (!/^S-1-\d+(?:-\d+)+$/.test(sid)) throw new Error();
      // Lock the EMPTY directory before writing the secret. Do not use a shell.
      execFileSync('icacls.exe', [directory, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`], { windowsHide: true, stdio: 'ignore' });
    } else await fs.chmod(directory, 0o700);
    const config = path.join(directory, 'connection.yml');
    // JSON strings are valid YAML double-quoted scalars; newline injection is escaped.
    await fs.writeFile(config, `uri: ${JSON.stringify(await toolsUri(uri))}\n`, { flag: 'wx', mode: 0o600 });
    return await action(config);
  } catch (error) {
    // Only our fixed messages are safe to show. Native exceptions never leave this boundary.
    if (error instanceof SafeError || error.safeToolError) throw error;
    fail('Khong tao/bao ve/xoa duoc cau hinh tam hoac thuc thi cong cu. Kiem tra quyen Windows va README.md; chi tiet bi an de bao ve URI.');
  } finally {
    if (directory) {
      try { await fs.rm(directory, { recursive: true, force: true }); }
      catch { fail('Khong xoa duoc thu muc cau hinh tam. Dong cong cu va xoa thu muc freshleaf-mongodb-* cua phien nay trong %TEMP%.'); }
    }
  }
}

export async function runTool(executable, args) {
  return new Promise((resolve, reject) => {
    // No shell interpolation, URI on argv, or forwarding of tool diagnostics to terminal/log.
    const child = spawn(executable, args, { windowsHide: true, stdio: 'ignore' });
    const stop = () => child.kill();
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
    const cleanup = () => { process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); };
    child.once('close', cleanup);
    child.once('error', () => reject(Object.assign(new Error('Khong khoi dong duoc MongoDB Database Tool.'), { safeToolError: true })));
    child.once('exit', code => code === 0 ? resolve() : reject(Object.assign(new Error(`MongoDB Tool that bai (exit ${code ?? 'signal'}). Kiem tra Atlas Network Access, quyen user, dung luong va phien ban tools. Chi tiet dau ra duoc an de bao ve bi mat.`), { safeToolError: true })));
  });
}

export async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

export async function dumpFiles(folder, sourceDb) {
  const dump = path.join(folder, 'dump');
  const dirs = await fs.readdir(dump, { withFileTypes: true });
  if (dirs.length !== 1 || dirs[0].name !== sourceDb || !dirs[0].isDirectory() || dirs[0].isSymbolicLink()) fail('Dump phai chi chua database nguon.');
  const files = await fs.readdir(path.join(dump, sourceDb), { withFileTypes: true });
  if (!files.some(file => /\.(bson|metadata\.json)$/.test(file.name))) fail('Dump rong; khong co collection de khoi phuc.');
  const output = [];
  const names = new Set(files.map(f => f.name));
  for (const file of files) {
    if (!file.isFile() || file.isSymbolicLink() || (file.name !== 'prelude.json' && !/\.(bson|metadata\.json)$/.test(file.name))) fail('Dump chua tep/duong dan khong duoc ho tro.');
    const absolute = path.join(dump, sourceDb, file.name);
    if (file.name === 'prelude.json') {
      let prelude;
      try { prelude = JSON.parse(await fs.readFile(absolute, 'utf8')); }
      catch { fail('prelude.json cua MongoDB Tools bi hong.'); }
      if (!prelude || typeof prelude.ServerVersion !== 'string' || typeof prelude.ToolVersion !== 'string' || !prelude.ServerVersion || !prelude.ToolVersion) {
        fail('prelude.json thieu thong tin phien ban MongoDB/Tools hop le.');
      }
    } else if (file.name.endsWith('.metadata.json')) {
      let metadata;
      try { metadata = JSON.parse(await fs.readFile(absolute, 'utf8')); } catch { fail('Metadata JSON bi hong.'); }
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) fail('Metadata JSON khong hop le.');
      if (!metadata.options?.viewOn && !names.has(file.name.replace(/\.metadata\.json$/, '.bson'))) fail('Metadata thieu BSON tuong ung.');
    } else if (!names.has(file.name.replace(/\.bson$/, '.metadata.json'))) fail('BSON thieu metadata/indexes.');
    output.push({ name: file.name, size: (await fs.stat(absolute)).size, sha256: await hashFile(absolute) });
  }
  return output.sort((a,b) => a.name.localeCompare(b.name));
}

export async function verifyBackup(folder, sourceDb) {
  let manifest;
  try {
    const stat = await fs.lstat(folder);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error();
    for (const name of ['manifest.json', 'dump']) if ((await fs.lstat(path.join(folder, name))).isSymbolicLink()) throw new Error();
    manifest = JSON.parse(await fs.readFile(path.join(folder, 'manifest.json'), 'utf8'));
  } catch { fail('Backup khong ton tai, chua hoan tat hoac manifest/duong dan khong hop le.'); }
  if (manifest.version !== 1 || manifest.complete !== true || manifest.sourceDb !== sourceDb || !Array.isArray(manifest.files)) fail('Manifest khong hop le hoac database nguon khong khop cau hinh backend.');
  const files = await dumpFiles(folder, sourceDb);
  if (JSON.stringify(files) !== JSON.stringify(manifest.files)) fail('Backup da thay doi/bi hong: SHA-256, kich thuoc hoac danh sach file khong khop.');
  return manifest;
}

export async function assertTargetAbsent(uri, target, Client = MongoClient) {
  const client = new Client(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  try {
    await client.connect();
    // Fail closed if the account cannot list ALL databases, even those it cannot read.
    const result = await client.db('admin').command({ listDatabases: 1, nameOnly: true, authorizedDatabases: false, filter: { name: target } });
    if (!Array.isArray(result.databases)) fail('Khong xac minh duoc database dich.');
    if (result.databases.length) fail('Database demo da ton tai. Dung lai de tranh tron du lieu; chon ten demo moi, khong xoa database cu.');
  } catch (error) {
    if (error.message?.startsWith('Database demo da ton tai')) throw error;
    fail('Khong xac minh duoc database dich chua ton tai. Kiem tra ket noi Atlas va quyen listDatabases tren cluster; restore bi chan.');
  } finally { await client.close().catch(() => {}); }
}

export function backupName(sourceDb, now = new Date()) {
  // Timestamp is local Windows time; random suffix avoids collisions even within one millisecond.
  const z = n => String(n).padStart(2, '0');
  return `${sourceDb}_${now.getFullYear()}-${z(now.getMonth()+1)}-${z(now.getDate())}_${z(now.getHours())}${z(now.getMinutes())}${z(now.getSeconds())}_${String(now.getMilliseconds()).padStart(3,'0')}_${createHash('sha256').update(randomUUID()).digest('hex').slice(0,8)}`;
}

export async function backup({ config, tools, base = HERE, secure = withSecureConfig, execute = runTool, log = console.log }) {
  const directory = path.join(base, 'backups', backupName(config.sourceDb));
  await fs.mkdir(path.dirname(directory), { recursive: true });
  await fs.mkdir(directory); // Never overwrite any existing backup.
  log(`Dang sao luu database ${config.sourceDb}. Vui long cho; URI va dau ra tools duoc an.`);
  try {
    await secure(config.uri, file => execute(tools.mongodump, ['--config', file, '--db', config.sourceDb, '--out', path.join(directory, 'dump')]));
    const files = await dumpFiles(directory, config.sourceDb);
    const manifest = { version: 1, complete: true, sourceDb: config.sourceDb, createdAt: new Date().toISOString(), files };
    await fs.writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    log(`BACKUP THANH CONG: ${directory}`);
    return directory;
  } catch (error) {
    const reason = error instanceof SafeError || error.safeToolError ? error.message : 'Loi doc/ghi file backup; kiem tra quyen va dung luong o dia.';
    fail(`Nguyen nhan: ${reason}
Backup that bai; KHONG co manifest hoan tat, khong dung de restore. Du lieu dang do duoc giu tai: ${directory}. Kiem tra ket noi/quyen/dung luong va chay lai de tao backup moi.`);
  }
}

export async function listBackups(base = HERE) {
  try { return (await fs.readdir(path.join(base, 'backups'), { withFileTypes: true })).filter(d => d.isDirectory() && !d.isSymbolicLink() && SAFE_BACKUP.test(d.name)).map(d => d.name).sort().reverse(); }
  catch (error) { if (error.code === 'ENOENT') return []; fail('Khong doc duoc thu muc backups.'); }
}

export async function restore({ config, tools, base = HERE, ask, secure = withSecureConfig, execute = runTool, absent = assertTargetAbsent, log = console.log }) {
  const names = await listBackups(base);
  if (!names.length) fail('Chua co backup trong database-tools/backups/. Hay chay backup.bat truoc.');
  log('Danh sach backup (can manifest hoan tat va SHA-256 hop le):');
  names.forEach((name, i) => log(`${i + 1}. ${name}`));
  const choice = (await ask('Chon so backup (Enter de huy): ')).trim();
  if (!choice) { log('Da huy. Khong ghi database.'); return; }
  if (!/^[1-9]\d*$/.test(choice) || Number(choice) > names.length) fail('Lua chon khong hop le.');
  const directory = path.join(base, 'backups', names[Number(choice)-1]);
  await verifyBackup(directory, config.sourceDb);
  const target = validateTarget((await ask('Database dich [freshleaf_restore_demo]: ')).trim() || 'freshleaf_restore_demo', config.sourceDb);
  await absent(config.uri, target);
  log(`Nguon backup: ${config.sourceDb}; dich: ${target}. Khong dung --drop. Database nguon khong bi ghi.`);
  if ((await ask(`Nhap chinh xac RESTORE ${target} de xac nhan: `)).trim() !== `RESTORE ${target}`) { log('Da huy. Khong ghi database.'); return; }
  const locks = path.join(base, '.locks');
  await fs.mkdir(locks, { recursive: true });
  const lock = path.join(locks, `${target}.lock`);
  try { await fs.mkdir(lock); } catch { fail('Dich dang bi khoa boi phien restore khac/bi gian doan. Kiem tra README.md.'); }
  try {
    await verifyBackup(directory, config.sourceDb);
    await absent(config.uri, target); // Recheck AFTER the human confirmation.
    await secure(config.uri, file => execute(tools.mongorestore, [
      '--config', file, '--dir', path.join(directory, 'dump'),
      '--nsInclude', `${config.sourceDb}.*`, '--nsFrom', `${config.sourceDb}.*`, '--nsTo', `${target}.*`, '--stopOnError',
    ]));
    log(`RESTORE THANH CONG vao database: ${target}. Kiem tra documents va indexes bang MongoDB Compass.`);
    return target;
  } catch (error) {
    const reason = error instanceof SafeError || error.safeToolError ? error.message : 'Loi doc/ghi file hoac thuc thi restore.';
    fail(`Nguyen nhan: ${reason}
Restore dung/that bai. Neu da bat dau, ${target} co the co du lieu dang do; KHONG chay lai vao cung ten. Kiem tra Compass va chon database demo moi. Database nguon khong bi xoa.`);
  } finally { await fs.rmdir(lock); }
}

export async function main(mode) {
  if (Number(process.versions.node.split('.')[0]) < 22) fail('Can Node.js 22+ (du an da su dung Node.js).');
  if (!['backup', 'restore'].includes(mode)) fail('Hay chay backup.bat hoac restore.bat.');
  const tools = findTools();
  const config = await loadConfig();
  if (mode === 'backup') return backup({ config, tools });
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try { return await restore({ config, tools, ask: question => terminal.question(question) }); }
  finally { terminal.close(); }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main(process.argv[2]).catch(error => {
    console.error('[LOI] ' + (error instanceof SafeError ? error.message : 'Khong hoan tat thao tac. Kiem tra README.md; chi tiet loi duoc an de bao ve thong tin ket noi.'));
    process.exitCode = 1;
  });
}
