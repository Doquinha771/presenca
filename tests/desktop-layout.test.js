import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/desktop-overview-fix.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
test('correção desktop é carregada depois das folhas antigas',()=>{
 assert.ok(html.indexOf('portal-layout.css')<html.indexOf('desktop-overview-fix.css'));
 assert.match(css,/desktop-overview-mode \.page-header \{/);
 assert.match(css,/grid-template-areas: 'copy utility side'/);
 assert.match(css,/grid-template-rows: 176px/);
});
test('pesquisa e ícones têm alinhamento horizontal, perfil e data não se invertem',()=>{
 assert.match(css,/\.global-search \.search-shell \{[\s\S]*?flex-direction:row/);
 assert.match(css,/\.page-side \.profile-glance \{[\s\S]*?order:0/);
 assert.match(css,/\.page-side \.status-glance \{[\s\S]*?order:1/);
 assert.match(css,/\.page-header > \.toolbar \{[\s\S]*?position:absolute/);
});
test('banner é gradiente local sem imagem e painel mobile permanece fora do override principal',()=>{
 assert.match(css,/background:linear-gradient\(115deg,#0a4c42/);
 assert.ok(!css.includes('url('));
 assert.match(css,/@media \(min-width: 1000px\)/);
 assert.match(app,/classList\.toggle\('desktop-overview-mode',staff\(\)&&state\.page==='overview'\)/);
});
