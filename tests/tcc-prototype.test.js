import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const terms=fs.readFileSync(new URL('../termos.html',import.meta.url),'utf8');
const privacy=fs.readFileSync(new URL('../privacidade.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../assets/tcc-prototype.css',import.meta.url),'utf8');

test('identificação TCC aparece no portal principal',()=>{
  assert.match(index,/tcc-prototype\.css/);
  assert.match(index,/tcc-watermark--tcc[^>]*>TCC</);
  assert.match(index,/tcc-watermark--room[^>]*>3º A</);
  assert.match(index,/Protótipo acadêmico/);
});

test('documentos legais também carregam a identificação acadêmica',()=>{
  for(const html of [terms,privacy]){
    assert.match(html,/tcc-prototype\.css/);
    assert.match(html,/class="tcc-project-stamp"/);
  }
});

test('marca d agua não captura interação do usuário',()=>{
  assert.match(css,/\.tcc-watermark-layer\{[^}]*pointer-events:none/s);
  assert.match(css,/\.tcc-project-stamp\{[^}]*pointer-events:none/s);
});

test('selo respeita navegação móvel',()=>{
  assert.match(css,/@media\(max-width:779px\)[\s\S]*bottom:calc\(86px \+ env\(safe-area-inset-bottom\)\)/);
});


test('identidade TCC também faz parte do conteúdo legal e das diretrizes',()=>{
  for(const html of [terms,privacy]){
    assert.match(html,/id="contexto-tcc"/);
    assert.match(html,/TCC · 3º A · Protótipo acadêmico/);
  }
  const guidelines=fs.readFileSync(new URL('../docs/DIRETRIZES_TCC_E_PRIVACIDADE_20260929.md',import.meta.url),'utf8');
  assert.match(guidelines,/protótipo acadêmico/i);
  assert.match(guidelines,/dados fictícios, sintéticos ou adequadamente anonimizados/i);
});
