import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/history-layout.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('histórico institucional exibe filtros completos e tabela com sete colunas',()=>{
 for(const marker of ['renderStaffHistory(rows)','id="historyFilters"','id="fromDate"','id="toDate"','id="historyClass"','id="historyStatus"','history-filter-submit','open-reports','historyResultsTitle','historyRows','history-results-foot']) assert.ok(app.includes(marker),marker);
 for(const header of ['Data','Aluno','Turma','Situação','Observação','Responsável','Ações']) assert.ok(app.includes(`<th scope="col">${header}</th>`),header);
});
test('aluno mantém histórico próprio; botões existentes continuam com ações do sistema',()=>{
 assert.match(app,/studentView\(\)\?renderStudentHistory\(rows\):renderStaffHistory\(rows\)/);
 assert.match(app,/data-action="history-actions"/);
 for(const action of ["'undo'","'correct'","'forgive'","'all-history'","'clear-history-filters'"]) assert.ok(app.includes(action));
 assert.match(app,/start=n\?state.offset\+1:0/);
});
test('folha específica é carregada depois da casca e trabalha por faixa de resolução',()=>{
 assert.ok(html.indexOf('assets/history-layout.css')>html.indexOf('assets/ergonomia.css'));
 for(const width of ['max-width:1460px','max-width:1120px','max-width:779px','max-width:390px']) assert.ok(css.includes(width),width);
 assert.match(css,/history-page #view>\.history-filter-panel/);
 assert.match(css,/history-page #view>\.history-results-panel/);
 assert.match(css,/history-menu-btn/);
});
