import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createReportWorkbook} from '../assets/report-xlsx.js';

const fake={today:6,week:18,month:43,
 classes:[{grade:'3º ano • A',students:30,total:21,full_name:'NOME_NAO_EXPORTAR',ra:'RA_NAO_EXPORTAR'},
          {grade:'3º ano • B',students:27,total:22}],
 trend:[{day:'2026-09-20',total:6},{day:'2026-09-19',total:4}],
 user:{name:'SEGREDO_NAO_EXPORTAR',email:'DADO_PESSOAL_NAO_EXPORTAR'},reason:'MOTIVO_NAO_EXPORTAR'};

async function files(blob){const data=Buffer.from(await blob.arrayBuffer()),results=new Map();
 for(let i=0;i+30<data.length;){if(data.readUInt32LE(i)!==0x04034b50)break;
 const len=data.readUInt16LE(i+26),extra=data.readUInt16LE(i+28),size=data.readUInt32LE(i+18);
 const start=i+30+len+extra;const name=data.subarray(i+30,i+30+len).toString('utf8');
 results.set(name,data.subarray(start,start+size).toString('utf8'));i=start+size;}
 return results;}

test('gera XLSX OOXML com 3 abas de dados agregados e configuração de impressão',async()=>{
 const workbook=createReportWorkbook(fake,new Date('2026-09-20T12:00:00-03:00'));
 assert.equal(workbook.type,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
 const list=await files(workbook);
 assert.equal(list.size,8);
 assert.match(list.get('xl/workbook.xml'),/Por turma/);
 assert.match(list.get('xl/workbook.xml'),/Últimos 14 dias/);
 assert.match(list.get('xl/worksheets/sheet2.xml'),/3º ano • A/);
 assert.match(list.get('xl/worksheets/sheet2.xml'),/<v>21<\/v>/);
 assert.match(list.get('xl/worksheets/sheet1.xml'),/Atrasos registrados neste mês/);
 for(const content of list.values())if(content.startsWith('<?xml'))assert.match(content,/^<\?xml/);
 for(const xml of [list.get('xl/worksheets/sheet1.xml'),list.get('xl/worksheets/sheet2.xml'),list.get('xl/worksheets/sheet3.xml')])assert.match(xml,/<pageSetup[^>]+paperSize="9"[^>]+orientation="landscape"/);
});

test('não exporta dados individuais nem permite injeção de fórmulas em turmas',async()=>{
 const data={...fake,classes:[{grade:'=HYPERLINK("https://exemplo.invalid")',total:5,ra:'SEGREDO_RA'}]};
 const list=await files(createReportWorkbook(data));const joined=[...list.values()].join('\n');
 for(const secret of ['NOME_NAO_EXPORTAR','RA_NAO_EXPORTAR','SEGREDO_NAO_EXPORTAR','DADO_PESSOAL_NAO_EXPORTAR','MOTIVO_NAO_EXPORTAR','SEGREDO_RA'])assert.ok(!joined.includes(secret),secret);
 assert.match(list.get('xl/worksheets/sheet2.xml'),/t="inlineStr"/);
 assert.doesNotMatch(list.get('xl/worksheets/sheet2.xml'),/<f\b/);
 assert.match(list.get('xl/worksheets/sheet2.xml'),/HYPERLINK/);
});

test('site só expõe relatório à equipe e não mantém interface de importação ou exportação nominal',()=>{
 const source=fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const fragment of ['import-ui.js','spreadsheet.js','portal_import_batch','open-import','Exportar CSV','Importar Excel','importData'])assert.equal(source.includes(fragment),false,fragment);
 assert.match(source,/if\(a==='export-report'\)\{if\(!staff\(\)/);
 assert.match(source,/reports:\['Relatórios Excel'/);
 assert.doesNotMatch(index,/type="file"/);
 assert.equal(fs.existsSync(new URL('../assets/import-ui.js',import.meta.url)),false);
 assert.equal(fs.existsSync(new URL('../assets/spreadsheet.js',import.meta.url)),false);
});
