# Backup / Restore MongoDB FreshLeaf trên Windows 10/11

Bộ công cụ phục vụ demo đồ án NoSQL, dùng **mongodump** và **mongorestore** thật. Hai file `.bat` là điểm chạy cho Windows; `database-tools.mjs` xử lý cấu hình, bảo vệ bí mật, xác minh backup và chặn đích không an toàn. Không sửa backend/frontend/schema.

## 1. Cấu trúc

```text
freshleaf-os/database-tools/
  backup.bat
  restore.bat
  database-tools.mjs
  README.md
  TEST-RESULTS.md
  tests/database-tools.test.mjs
  backups/.gitkeep
```

Backup được tạo **bên cạnh script**, không phụ thuộc thư mục hiện tại của terminal:

```text
backups/freshleaf_2026-10-25_180000_123_a1b2c3d4/
  dump/freshleaf/
    products.bson
    products.metadata.json
    prelude.json (thông tin phiên bản, với Tools mới)
    ... các collection khác ...
  manifest.json
```

Thời gian lấy theo đồng hồ Windows; mili giây và hậu tố ngẫu nhiên tránh trùng tên. Không xóa backup cũ. `manifest.json` chỉ được tạo khi `mongodump` thoát mã 0 và dữ liệu/metadata kiểm tra đạt; chứa tên nguồn, thời gian UTC, danh sách file, kích thước và SHA-256, không chứa URI. Folder thiếu manifest là backup dở dang, không thể restore. Đừng sửa file bên trong backup. Hash phát hiện hỏng/thay đổi ngoài ý muốn; không phải chữ ký chống kẻ cố ý sửa cả dữ liệu lẫn manifest.

## 2. Cài công cụ

1. Cài Node.js **22+**. Dự án đã dùng Node, không thêm dependency mới. Nếu máy mới chưa có dependency, tại thư mục gốc dự án chạy `npm install`.
2. Tải **MongoDB Database Tools** bản Windows x86_64 từ [MongoDB Download Center](https://www.mongodb.com/try/download/database-tools). Dùng bản phù hợp phiên bản MongoDB trên Atlas; tối thiểu 100.3.0 để có `--config`.
3. Cài MSI hoặc giải nén ZIP, thêm thư mục `bin` vào biến môi trường PATH của Windows. Ví dụ: `C:\Program Files\MongoDB\Tools\100\bin`.
4. Đóng/mở lại PowerShell hoặc CMD rồi kiểm tra:

```powershell
node --version
mongodump --version
mongorestore --version
```

MongoDB Compass và MongoDB Server không thay thế Database Tools. Không cần cài `mongosh`: bước kiểm tra database dùng MongoDB driver đã có trong dự án.

## 3. Cấu hình Atlas và bí mật

### Kết nối

Công cụ đọc `MONGODB_URI` theo thứ tự giống backend, giá trị có trước được giữ:

1. Biến môi trường của tiến trình đang chạy.
2. File `backend/.env` tính từ gốc dự án.
3. File `.env` ở gốc dự án.

Dùng cấu hình hiện có của dự án. Nếu cần nhập URI cho riêng phiên PowerShell mà không lưu vào lịch sử lệnh:

```powershell
$secureUri = Read-Host 'MongoDB Atlas URI' -AsSecureString
$env:MONGODB_URI = [System.Net.NetworkCredential]::new('', $secureUri).Password
Remove-Variable secureUri
# chạy backup.bat / restore.bat như hướng dẫn phía dưới
# Khi hoàn tất phiên demo:
Remove-Item Env:MONGODB_URI
```

Cách này không in URI; biến môi trường vẫn là bí mật trong bộ nhớ tiến trình. Hoặc chỉnh `backend/.env` bằng editor cá nhân. Không dán URI thật vào terminal, README, ảnh chụp, chat, file `.bat` hay Git. Các file `.env*` và backup đã được `.gitignore` loại trừ. Không bật echo/debug/xem toàn bộ environment trong lúc demo. Đặt mật khẩu đã URL-encode khi ký tự đặc biệt nằm trong URI. Không tự sửa URI bằng thay thế chuỗi tên database.

**Database nguồn hiện tại là `freshleaf`**, được đọc từ khai báo `export const DB_NAME = 'freshleaf';` trong `backend/config/db.ts`. Backend dùng `dbName` tường minh, nên database trong path URI có thể khác và không được dùng để đoán nguồn. Nếu không xác định duy nhất được hằng này, script dừng. Công cụ bỏ database mặc định trong URI dành cho Database Tools và giữ đúng `authSource`, kể cả giá trị do DNS TXT của SRV/Atlas cung cấp.

### Atlas Network Access / Database Access

- Trong Atlas, cho phép IP máy demo trong **Network Access**. Kiểm tra cluster đang hoạt động và kết nối được từ máy Windows; giữ TLS bật.
- **Database Access**: dùng database user (khác tài khoản đăng nhập trang Atlas).
- Backup cần quyền đọc/list collections/list indexes trên database nguồn. Role `read` trên `freshleaf` thường phù hợp cho database ứng dụng này.
- Restore cần quyền tạo collection, ghi dữ liệu và tạo indexes **chỉ trên tên database demo được chọn**; role `readWrite` trên database demo thường đủ cho collection/index thông thường. Khi chọn tên demo mới, cần cấp quyền cho chính tên mới đó trước khi chạy.
- Kiểm tra đích cần quyền cluster action **`listDatabases`**. Cấu hình custom role phù hợp hoặc nhờ chủ Atlas cấp quyền này. Script dùng `authorizedDatabases: false`: nếu không có quyền xem toàn bộ tên database, script dừng, không coi database bị ẩn là chưa tồn tại. Không cần cấp `atlasAdmin` chỉ để chạy demo.
- Nếu có collection đặc biệt, mã hóa, time-series hoặc quyền đặc thù, xác minh thêm tính tương thích và quyền bằng tài liệu MongoDB trước demo. Công cụ không thay đổi schema hay tự mở rộng quyền.

### Cách truyền URI cho Tools

Không đặt URI trên command line. Script tạo thư mục ngẫu nhiên `%TEMP%\freshleaf-mongodb-*`, bỏ quyền kế thừa và chỉ cấp Full Control cho SID Windows hiện tại bằng `icacls`, **trước khi ghi bí mật**. File YAML tạm được truyền qua `--config`; được xóa trong `finally` khi kết thúc/thất bại. Không tạo log chứa đầu ra gốc của tools vì chúng có thể chứa URI. Nếu không thiết lập được ACL, script dừng.

`Ctrl+C` trong lúc tool chạy sẽ dừng tiến trình con và đi qua dọn cấu hình; restore đang chạy có thể để lại database demo dở dang. Nếu máy mất điện hoặc bị Task Manager kill cứng, `finally` không thể chạy: sau khi chắc chắn không có phiên tools nào còn chạy, kiểm tra và xóa **đúng thư mục tạm của phiên đó**. Không chạy lệnh xóa hàng loạt thư mục tạm của người khác. ACL giới hạn user hiện tại, không bảo vệ khỏi admin/mã độc chạy cùng tài khoản. Backup chứa dữ liệu khách hàng: giữ trên ổ riêng được bảo vệ/BitLocker, không đưa vào Git hoặc chia sẻ công khai.

## 4. Chạy backup

Mở PowerShell tại gốc dự án:

```powershell
.\freshleaf-os\database-tools\backup.bat
$LASTEXITCODE
```

Hoặc CMD:

```bat
freshleaf-os\database-tools\backup.bat
```

Script kiểm tra cả hai MongoDB Tools, đọc cấu hình, xác định nguồn rồi tạo backup mới. `mongodump --db freshleaf --out ...` xuất BSON của toàn bộ collections được hỗ trợ và JSON metadata/index definitions; không dùng `--collection`, không thay dữ liệu bằng JSON export. Thành công hiển thị `BACKUP THANH CONG` và đường dẫn. Mã thoát khác 0 là thất bại; không được dùng folder dở dang để restore. Các file `.bat` không nhận tùy chọn tùy ý để tránh vô hiệu hóa các chốt an toàn.

Để backup nhất quán cho buổi demo, tạm ngừng **các thao tác ghi của người dùng** trước khi chạy, rồi chạy lại ứng dụng sau khi backup xong theo quy trình của nhóm. Script không tự dừng backend và không khóa database. Dump theo database này không phải snapshot point-in-time khi ứng dụng vẫn ghi liên tục; không tuyên bố hỗ trợ oplog/PITR hoặc thay thế Atlas managed backup. Index được lưu dưới dạng định nghĩa và được xây dựng lại khi restore, không phải sao chép các trang index vật lý. Không backup toàn cluster/users/roles hệ thống.

## 5. Chạy restore an toàn

```powershell
.\freshleaf-os\database-tools\restore.bat
$LASTEXITCODE
```

1. Chọn số backup trong danh sách. Enter để hủy. Folder dở dang có thể xuất hiện nhưng sẽ bị từ chối do thiếu manifest; không tự xóa chúng.
2. Script xác minh manifest, SHA-256, file BSON/metadata tương ứng và chỉ một database nguồn. Backup ngoài bộ công cụ này cần được kiểm tra riêng, không được tự tạo manifest để bỏ qua xác minh.
3. Nhập database đích. Enter dùng **`freshleaf_restore_demo`**.
4. Nếu đích đã tồn tại, kể cả collection rỗng, script dừng. Chạy lại và chọn tên mới, ví dụ `freshleaf_restore_demo_20261025_02`.
5. Chỉ chấp nhận `freshleaf_restore_demo` hoặc hậu tố gồm các nhóm chữ thường/số ngăn bằng `_`, tối đa 63 byte và không trùng tên nguồn (so sánh không phân biệt hoa thường). `freshleaf`, `admin`, `production`, wildcard và ký tự đường dẫn đều bị chặn.
6. Sau khi kiểm tra đích không tồn tại, phải gõ chính xác:

```text
RESTORE freshleaf_restore_demo
```

Nếu chọn tên khác, câu xác nhận phải chứa tên đó. Mọi câu khác hủy restore. Không có chế độ auto-confirm.

7. Script lấy khóa cục bộ theo tên demo, kiểm tra lại backup và đích sau xác nhận, rồi chạy với namespace mapping:

```text
mongorestore --config <file-tam> --dir <backup>/dump
  --nsInclude freshleaf.*
  --nsFrom freshleaf.*
  --nsTo freshleaf_restore_demo.*
  --stopOnError
```

Đây là minh họa tham số, không phải lệnh để copy vào CMD theo nhiều dòng. Script truyền từng đối số trực tiếp, không qua shell. **Không có `--drop`**, không xóa collection, không restore vào database nguồn. URI mặc định không tự quyết định namespace. Chỉ khi tool thoát mã 0 mới hiển thị `RESTORE THANH CONG vao database: ...`.

### Không trộn dữ liệu và giới hạn đồng thời

Giữ database demo hoàn toàn dành riêng cho phiên restore; không để ứng dụng, Compass hay công cụ khác tạo/ghi database đó trong lúc kiểm tra/chạy. Script kiểm tra tồn tại hai lần và chặn các phiên của bộ công cụ dùng cùng thư mục bằng `.locks`. MongoDB không có thao tác nguyên tử “restore toàn database chỉ nếu tên chưa tồn tại”; khóa cục bộ không điều phối công cụ bên ngoài/máy khác. Nếu cần bảo đảm giữa nhiều người/máy, phải dành riêng tên và quyền đích trước buổi demo. Không chạy nhiều restore cùng collection.

Nếu restore lỗi giữa chừng, **không chạy lại vào cùng tên**: đích có thể đã có dữ liệu, còn nguồn không bị xóa. Dùng Compass kiểm tra và chọn database demo mới. Script không tự rollback hoặc xóa dữ liệu. Nếu báo khóa tồn tại sau crash, xác minh không còn tiến trình restore dùng tên đó trước khi tự gỡ đúng folder `.locks/<ten-demo>.lock`. Không gỡ khóa của phiên đang chạy.

## 6. Kiểm tra bằng MongoDB Compass

1. Mở Compass và kết nối cùng Atlas cluster bằng cấu hình cá nhân; không chụp URI/mật khẩu.
2. Refresh danh sách databases. Xác nhận `freshleaf` vẫn còn nguyên và có database demo mới.
3. So sánh danh sách collections giữa nguồn ở **thời điểm backup** và database demo. View có thể hiển thị riêng; kiểm tra cả view nếu có.
4. Mở từng collection, so sánh số documents và một số `_id`/trường dữ liệu đại diện. Nếu nguồn có ghi mới sau backup thì so sánh theo thời điểm backup, không yêu cầu hai tổng hiện tại luôn bằng nhau.
5. Mở tab **Indexes**: kiểm tra `_id_`, tên index, key pattern, unique, partialFilterExpression, TTL nếu có. Metadata lưu các định nghĩa này; `mongorestore` xây dựng lại index.
6. Kiểm tra **Validation / collection options**, views nếu database có sử dụng. Không sửa schema để làm số liệu khớp.
7. Trong database nguồn, kiểm tra dữ liệu/collections vẫn nguyên. Không bấm Drop Database, Delete Collection hoặc Reset.
8. Ghi nhận tên database demo, thời gian backup, số collections/documents/indexes vào biên bản demo. Không đưa dữ liệu cá nhân vào ảnh minh chứng công khai.

## 7. Lỗi thường gặp

| Thông báo / hiện tượng | Xử lý |
| --- | --- |
| Thiếu Node/dependency | Cài Node 22+; chạy `npm install` ở gốc dự án. Không cài thư viện riêng trong database-tools. |
| Không tìm thấy mongodump/mongorestore | Cài Database Tools 100.3+ và thêm `bin` vào PATH, mở terminal mới. |
| Thiếu MONGODB_URI | Cấu hình môi trường hoặc `backend/.env`; không để biến môi trường rỗng che file `.env`. |
| Không xác định DB_NAME | Đối chiếu `backend/config/db.ts`; script không đoán database từ URI. |
| DNS TXT / SRV thất bại | Kiểm tra DNS/VPN/mạng. Dùng URI Atlas chính xác; có thể khai báo `authSource` tường minh đúng theo cấu hình Atlas. Không tắt TLS để xử lý. |
| Tools thất bại / timeout / auth | Kiểm tra IP allowlist, cluster, user/password URL-encode, quyền, dung lượng ổ, phiên bản Tools. Không bật log nguyên URI hoặc gửi raw URI để nhờ hỗ trợ. |
| Không xác minh được database đích | Cần kết nối và cluster action `listDatabases`; không bỏ kiểm tra hoặc dùng authorizedDatabases=true để lách quyền. |
| Chưa có backup / thiếu manifest | Chạy backup thành công trước. Backup dở dang không được restore. |
| SHA-256 / metadata không khớp | Dữ liệu có thể hỏng/thay đổi. Dùng backup nguyên vẹn khác; không sửa manifest để ép restore. |
| Demo database đã tồn tại | Chọn tên demo mới, cấp quyền cho tên mới nếu cần. Không xóa hoặc dùng --drop. |
| Restore lỗi giữa chừng | Kiểm tra demo bằng Compass, chọn tên khác cho lần sau; không trộn dữ liệu bằng cách chạy lại. |
| Không bảo vệ/xóa được cấu hình tạm | Kiểm tra quyền thư mục TEMP và icacls. Chạy bằng chính tài khoản Windows có quyền; script không yêu cầu tắt bảo mật. |
| Cửa sổ BAT đóng ngay | Chạy từ PowerShell/CMD để xem thông báo và `$LASTEXITCODE`/`echo %ERRORLEVEL%`. |

Đầu ra gốc của tools bị ẩn có chủ đích để không lộ kết nối. Script không lưu log raw. Mã thoát thành công/thất bại vẫn được kiểm tra; dùng checklist trên và Compass để xác minh. Không báo “thành công” chỉ vì folder được tạo.

## 8. Quy trình demo trước giảng viên

1. Chuẩn bị Tools, dependency, Atlas allowlist và user có quyền nguồn/demo/listDatabases. Không chia sẻ mật khẩu.
2. Mở Compass chứng minh nguồn `freshleaf`, collections/documents/indexes trước demo.
3. Tạm ngừng thao tác ghi của người dùng và chạy `backup.bat`. Ghi đường dẫn thành công; mở folder cho thấy BSON, metadata và manifest.
4. Chạy `restore.bat`, chọn backup, Enter dùng `freshleaf_restore_demo` nếu chưa tồn tại, nhập câu xác nhận.
5. Refresh Compass, so sánh collections, documents, `_id`, indexes và validation giữa backup và demo.
6. Chạy restore cùng đích lần nữa để minh họa chốt chặn tồn tại. Sau đó chọn tên demo mới nếu cần, không xóa đích cũ.
7. Minh họa unit tests chặn `freshleaf` mà **không cần thử ghi vào nguồn thật**. Không dùng production làm mục tiêu thực nghiệm.
8. Kết thúc: xóa biến môi trường trong terminal nếu đã đặt; cất backup ở nơi được bảo vệ. Không xóa database sau demo bằng script này.

## 9. Chạy kiểm thử không tác động Atlas

Tại gốc dự án:

```powershell
node --check .\freshleaf-os\database-tools\database-tools.mjs
node --test .\freshleaf-os\database-tools\tests\database-tools.test.mjs
```

Tests dùng URI giả `example.invalid`, mô phỏng dump/restore/driver, tạo fixture cục bộ rồi dọn trong `tests/.tmp`. Không đọc URI thật, không kết nối Atlas và không chạy dump/restore thật. Có kiểm tra executable Node để giả mã thoát, ACL Windows với bí mật giả, và chạy `.bat` trong đường dẫn có dấu cách bằng helper giả. Chạy trên Windows với quyền thư mục TEMP bình thường; sandbox bị giới hạn có thể chặn kiểm tra ACL/dọn TEMP. Không bỏ ACL trong mã production để làm test qua.

Kết quả đã thực hiện và giới hạn chưa kiểm tra: xem [TEST-RESULTS.md](TEST-RESULTS.md).

## 10. Tài liệu chính thức

- [Cài MongoDB Database Tools trên Windows](https://www.mongodb.com/docs/database-tools/installation/installation-windows/)
- [mongodump: BSON, metadata và --config](https://www.mongodb.com/docs/database-tools/mongodump/)
- [mongorestore: namespace mapping và restore indexes](https://www.mongodb.com/docs/database-tools/mongorestore/)
- [listDatabases và authorizedDatabases](https://www.mongodb.com/docs/manual/reference/command/listDatabases/)
- [Định dạng connection string và SRV](https://www.mongodb.com/docs/manual/reference/connection-string/)

### Bản sửa tương thích Tools 100.19.1

Tools mới tạo thêm prelude.json chứa ServerVersion/ToolVersion. Bộ kiểm tra chấp nhận, xác minh JSON và lưu SHA-256 của file này. Trước đây script từ chối file đó và báo thất bại dù đã có BSON/metadata; đã bổ sung regression tests. Khi gặp lại lỗi, các thông báo nội bộ an toàn sẽ được giữ lại sau dòng Nguyen nhan; không hiển thị lỗi gốc có thể chứa URI. Không tự thêm manifest cho bản cũ thiếu bằng chứng mã thoát. Hãy tạo backup mới.
