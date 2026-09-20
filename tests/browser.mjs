import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fixture} from './browser-fixture.mjs';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules','playwright')));}
const root=path.resolve(new URL('..',import.meta.url).pathname);
const server=http.createServer(async(req,res)=>{try{const relative=decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/^\/presenca\//,'/');const file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative));if(!file.startsWith(root+path.sep))throw Error();const body=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/presenca/`;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});let checks=0;const errors=[];
async function setup(role='admin',width=1366,signedOut=false){const context=await browser.newContext({viewport:{width,height:900}});await context.addInitScript(({role,signedOut})=>{window.__testRole=role;window.__signedOut=signedOut;},{role,signedOut});await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'text/javascript',body:fixture}));const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator(signedOut?'#authView':'#dashboard').waitFor({state:'visible'});return {context,page};}
try{
 const {context,page}=await setup();
 for(const name of ['overview','entry','students','history','enrollments','classes','team','adjustments','announcements','archive','period','audit','privacy','reports']){await page.goto(base+'#/'+name);await page.waitForFunction(n=>document.querySelector('#nav a.active')?.dataset.page===n,name);await page.waitForFunction(()=>!document.getElementById('view').hasAttribute('aria-busy'));assert.equal(await page.locator('#view').getByText('Não foi possível carregar os dados',{exact:true}).count(),0);checks++;}
 await page.goto(base+'#/reports');
 await page.locator('[data-action="export-report"]').waitFor();
 const downloadPromise=page.waitForEvent('download');
 await page.locator('[data-action="export-report"]').click();
 const download=await downloadPromise;
 assert.match(download.suggestedFilename(),/\.xlsx$/);
 const exported=await fs.readFile(await download.path());
 assert.equal(exported.subarray(0,4).toString('hex'),'504b0304');
 assert.equal(await page.evaluate(()=>window.__calls.some(x=>x.name==='portal_import_batch')),false);
 checks++;
 await page.goto(base+'#/history');await page.waitForFunction(()=>document.querySelector('table'));assert.equal(await page.locator('#view img').count(),0);assert.match(await page.locator('#view').innerText(),/<img src=x/);checks++;
 await page.goto(base+'#/entry');await page.locator('#entrySearch').fill('João');await page.locator('[data-pick="0"]').waitFor();await page.locator('#entrySearch').press('ArrowDown');await page.locator('#entrySearch').press('Enter');await page.locator('#recordBtn').press('Enter');await page.getByText('Atraso registrado.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__calls.filter(c=>c.args.p_action==='record').length),1);assert.equal(await page.locator('#entrySearch').inputValue(),'');checks++;
 await page.goto(base+'#/students');await page.locator('[data-action="student-manage"]').click();await page.locator('#modal [data-action="chance"]').click();await page.locator('#modal textarea').fill('Responsável compareceu à escola.');await page.locator('#modal button[type=submit]').click();await page.waitForFunction(()=>window.__calls.some(c=>c.args.p_action==='chance'));checks++;
 await page.goto(base+'#/overview');await page.waitForFunction(()=>document.querySelector('.metrics'));await page.screenshot({path:path.join(root,'tests/desktop.png'),fullPage:true});
 await page.evaluate(()=>window.__fail=true);await page.locator('#refresh').click();await page.getByText(/Falha de conexão/).waitFor();checks++;
 await context.close();
 for(const role of ['aluno','secretaria','admin']){const {context,page}=await setup(role,390);for(const route of role==='admin'?['overview','students','history','period','reports']:role==='secretaria'?['entry','history','reports']:['overview','history','announcements']){await page.goto(base+'#/'+route);await page.locator('#dashboard').waitFor({state:'visible'});await page.waitForFunction(n=>document.querySelector('#nav a.active')?.dataset.page===n,route);await page.waitForFunction(()=>!document.querySelector('#view').hasAttribute('aria-busy'));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),role+'/'+route+' overflow');checks++;}if(role==='aluno'){await page.goto(base+'#/reports');await page.waitForFunction(()=>document.querySelector('#nav a.active')?.dataset.page==='overview');assert.equal(await page.locator('#nav [data-page=reports]').count(),0);checks++;await page.goto(base+'#/team');await page.waitForFunction(()=>document.querySelector('#nav a.active')?.dataset.page==='overview');assert.equal(await page.locator('#nav [data-page="team"]').count(),0);checks++;}if(role==='admin'){await page.goto(base+'#/overview');await page.waitForFunction(()=>document.querySelector('.metrics'));await page.screenshot({path:path.join(root,'tests/mobile.png'),fullPage:true});}await page.reload();await page.locator('#dashboard').waitFor();checks++;await context.setOffline(true);await page.locator('#connection').waitFor({state:'visible'});checks++;await context.close();}
 {const {context,page}=await setup('aluno',390,true);await page.locator('[data-auth="signup"]').click();await page.locator('[name="name"]').fill('João Pedro');await page.locator('[name="ra"]').fill('0000111');await page.locator('[name="grade"]').fill('3º A');await page.locator('[name="birth"]').fill('2007-12-27');await page.locator('[name="email"]').fill('0000111@al.educacao.sp.gov.br');await page.locator('[name="password"]').fill('Teste-123456');await page.locator('[name="consent"]').check();await page.locator('#authSubmit').click();await page.waitForFunction(()=>window.__signup);assert.equal(await page.evaluate(()=>window.__signup.options.data.ra),'0000111');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(root,'tests/login.png'),fullPage:true});checks++;await context.close();}
 assert.deepEqual(errors,[]);console.log(`${checks} verificações de navegador passaram (rede Supabase simulada).`);
}finally{await browser.close();server.close();}
