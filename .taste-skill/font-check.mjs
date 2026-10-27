import { Browser } from 'file:///C:/Users/Quys/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const browser = await Browser.launch();
try {
 const page = await browser.newPage({width:1440,height:900});
 for (const route of ['/', '/menu', '/login', '/register', '/track', '/admin']) {
  await page.goto('http://127.0.0.1:3002'+route);
  const metrics = await page.eval(async () => {
   await document.fonts.ready;
   const headings=[...document.querySelectorAll('h1,h2,h3')].filter(h=>h.getBoundingClientRect().width>0);
   return {loaded:document.fonts.check('700 20px "Be Vietnam Pro"','Thực đơn Đăng nhập Nguyễn'), headings:headings.slice(0,4).map(h=>({text:h.textContent,font:getComputedStyle(h).fontFamily})),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  console.log(JSON.stringify({route,...metrics}));
  if(!metrics.loaded||metrics.overflow||metrics.headings.some(h=>h.font.includes('Outfit'))) throw new Error('Font/layout check failed');
 }
 await page.goto('http://127.0.0.1:3002/menu');
 await page.screenshot({path:'.taste-skill/font-menu-desktop.jpg'});
 await page.setViewport({width:375,height:812,mobile:true});
 await page.goto('http://127.0.0.1:3002/login');
 await page.screenshot({path:'.taste-skill/font-login-mobile.jpg'});
 console.log('Unhandled browser exceptions: '+page.consoleErrors.length);
} finally { await browser.close(); }
