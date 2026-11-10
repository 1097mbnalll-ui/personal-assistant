const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONS',m.text().slice(0,200))});
await p.route(/googleapis|gstatic/,r=>r.abort());
const t=Date.now();await p.goto('file://'+process.argv[2],{waitUntil:'commit',timeout:0});
await p.waitForFunction(()=>document.body&&(document.body.hasAttribute('data-ok')||document.body.hasAttribute('data-err')),null,{timeout:800000});
console.log(await p.evaluate(()=>document.body.getAttribute('data-ok')||'ERR '+document.body.getAttribute('data-err')),(Date.now()-t)/1000+'s');
await b.close()})();
