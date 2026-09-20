import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mapSpreadsheet,readSpreadsheet} from '../assets/spreadsheet.js';
test('turmas exigem colunas e rejeitam duplicidades na planilha',()=>{
 const r=mapSpreadsheet([['Série','Turma'],['3º ano','A'],['3º ano','A'],['3º ano','B']],'classes');
 assert.equal(r.accepted.length,2);assert.equal(r.rejected.length,1);
});
test('matrícula valida RA, data, nome e não importa senha',()=>{
 const r=mapSpreadsheet([['RA','Nome','Nascimento','Série','Turma','Senha'],['0000111','Aluno de Exemplo','27/12/2007','3º ano','A','segredo'],['bad','Pessoa','03/09/2008','3º','A','senha']],'enrollments');
 assert.equal(r.accepted.length,1);assert.equal(r.accepted[0].birth,'2007-12-27');assert.equal(r.accepted[0].email,'0000111@al.educacao.sp.gov.br');assert.equal('Senha' in r.accepted[0],false);
});
test('atrasos preservam data, validam horário e normalizam justificação',()=>{
 const r=mapSpreadsheet([['RA','Data','Hora','Observação','Justificado'],['0000111','20/09/2026','07:35','Entrada pelo portão','sim'],['0000111','32/09/2026','07:00','','não']],'lateness');
 assert.equal(r.accepted.length,1);assert.equal(r.rejected.length,1);assert.equal(r.accepted[0].justified,true);
});
test('CSV aceita ponto-e-vírgula, texto entre aspas e quebra de linha',async()=>{
 const file={name:'lista.csv',size:70,text:async()=> 'Série;Turma\n"3º; ano";A\n3º ano;B\n'};
 const rows=await readSpreadsheet(file);assert.equal(rows.length,3);assert.equal(rows[1][0],'3º; ano');
});
test('não há importação por credencial de serviço no cliente; servidor requer autorização e lote',()=>{
 const ui=fs.readFileSync(new URL('../assets/import-ui.js',import.meta.url),'utf8');
 const sql=fs.readFileSync(new URL('../sql/06_importacao_institucional.sql',import.meta.url),'utf8');
 assert.doesNotMatch(ui,/sb_secret_|service_role/i);
 for(const pattern of [/private.require_portal\(\)/,/me.role<>'admin'/,/jsonb_array_length\(p_rows\) NOT BETWEEN 1 AND 25/,/REVOKE ALL ON FUNCTION public.portal_import_batch/,/ON CONFLICT\(request_id\) DO NOTHING/])assert.match(sql,pattern);
});
