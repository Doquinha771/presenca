// Renderização isolada da central de importação: carregada apenas ao abrir esta tela.
import {readSpreadsheet,mapSpreadsheet,previewCell} from './spreadsheet.js';
import {esc} from './utils.js';
const TITLES={classes:'Turmas',enrollments:'Matrículas',lateness:'Histórico de atrasos'};
const SCHEMAS={
 classes:'Série;Turma\n3º ano;A',
 enrollments:'RA;Nome;Nascimento;Série;Turma\n0000111;Aluno de exemplo;27/12/2007;3º ano;A',
 lateness:'RA;Data;Hora;Observação;Justificado\n0000111;20/09/2026;07:35;Chegada registrada;Não'
};
export function importMarkup(){return `<section class="panel import-hero"><div class="import-heading"><div><span class="eyebrow">CONTROLE ESCOLAR</span><h2>Planilhas sem retrabalho</h2><p>Importe .xlsx ou .csv, confira as linhas e confirme antes de salvar. Os arquivos são lidos no dispositivo; somente os registros aprovados chegam ao banco escolar.</p></div><div class="import-symbol" aria-hidden="true">⇧</div></div></section>
<section class="panel"><form id="importForm"><div class="import-grid"><label>O que deseja importar?<select id="importKind" name="kind"><option value="classes">Turmas e salas</option><option value="enrollments">Alunos e matrículas</option><option value="lateness">Histórico de atrasos</option></select></label><label>Arquivo Excel ou CSV<input id="importFile" type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required></label></div><p id="importHelp" class="muted" aria-live="polite"></p><div class="toolbar"><button id="importPreview" class="primary" type="submit">Conferir planilha</button><button id="importTemplate" class="outline" type="button">Baixar modelo CSV</button></div></form><div id="importResults" aria-live="polite"></div></section>`;}
const names={classes:['Série','Turma'],enrollments:['RA','Aluno','Nascimento','Série','Turma'],lateness:['RA','Data','Hora','Observação','Justificado']};
export function attachImporter({isAdmin,classes,rpc,notify,onComplete}){
 const form=document.getElementById('importForm');if(!form)return;
 const file=document.getElementById('importFile'),kind=document.getElementById('importKind'),results=document.getElementById('importResults'),help=document.getElementById('importHelp');
 let parsed=null,working=false;
 const updateHelp=()=>{
  const k=kind.value;
  help.textContent=k==='classes'?'Série + turma (ex.: 3º ano, A). A importação de turmas é reservada à Direção.':k==='enrollments'?'RA, nome, nascimento, série e turma. Importe as turmas primeiro. Contas de acesso são criadas individualmente após a conferência da matrícula.':'RA, data e hora da ocorrência. Somente alunos com conta e matrícula autorizadas; apenas Direção. Os lançamentos alteram a contagem do período quando aplicável.';
  parsed=null;results.replaceChildren();
 };
 kind.onchange=updateHelp;updateHelp();
 const model=document.getElementById('importTemplate');model.onclick=()=>{
  const name='presenca-modelo-'+kind.value+'.csv',body='\uFEFF'+SCHEMAS[kind.value].replaceAll('\n','\r\n');
  const url=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),500);
 };
 form.onsubmit=async e=>{
  e.preventDefault();if(working)return;
  parsed=null;results.replaceChildren();const selected=file.files?.[0];if(!selected)return;
  working=true;document.getElementById('importPreview').disabled=true;
  try{
   if(!isAdmin&&kind.value!=='enrollments')throw Error('Esta modalidade de importação é reservada à Direção.');
   const rows=await readSpreadsheet(selected);
   const prepared=mapSpreadsheet(rows,kind.value);
   if(prepared.accepted.length===0)throw Error('Nenhuma linha válida. Confira os cabeçalhos e os dados do arquivo.');
   const status=document.createElement('p');status.className='import-summary';status.textContent=`${prepared.accepted.length} linha(s) válidas · ${prepared.rejected.length} rejeitada(s). Nenhum dado foi salvo ainda.`;
   results.append(status);
   const preview=document.createElement('div');preview.className='table-scroll import-preview';
   const t=document.createElement('table'),thead=document.createElement('thead'),tbody=document.createElement('tbody');
   const labels=names[kind.value];thead.innerHTML='<tr><th scope="col">Linha</th>'+labels.map(n=>`<th scope="col">${esc(n)}</th>`).join('')+'</tr>';
   const keys=kind.value==='classes'?['grade','name']:kind.value==='enrollments'?['ra','name','birth','grade','class']:['ra','date','time','reason','justified'];
   for(const row of prepared.accepted.slice(0,10)){
    const tr=document.createElement('tr');const cells=[row.line,...keys.map(k=>k==='justified'?(row.justified?'Sim':'Não'):previewCell(row[k]))];
    for(const cell of cells){const td=document.createElement('td');td.textContent=String(cell);tr.append(td);}tbody.append(tr);
   }t.append(thead,tbody);preview.append(t);results.append(preview);
   if(prepared.accepted.length>10){const extra=document.createElement('p');extra.className='muted';extra.textContent=`Prévia das primeiras 10 de ${prepared.accepted.length} linhas. Todas as linhas válidas serão processadas.`;results.append(extra);}
   if(prepared.rejected.length){const issues=document.createElement('div');issues.className='import-issues';issues.textContent='Linhas ignoradas: '+prepared.rejected.slice(0,20).map(x=>`${x.line} (${x.reason})`).join('; ')+(prepared.rejected.length>20?'…':'');results.append(issues);}
   const confirm=document.createElement('label');confirm.className='check';const box=document.createElement('input');box.type='checkbox';box.id='confirmImport';const text=document.createElement('span');text.textContent='Conferi os dados, possuo autorização institucional para tratá-los e estou ciente de que importações de atrasos válidos podem alterar os contadores escolares.';confirm.append(box,text);
   const execute=document.createElement('button');execute.className='primary';execute.type='button';execute.textContent='Importar linhas conferidas';execute.disabled=true;box.onchange=()=>execute.disabled=!box.checked;results.append(confirm,execute);
   parsed={kind:kind.value,rows:prepared.accepted};
   execute.onclick=async()=>{
    if(working||!box.checked||!parsed)return;
    working=true;execute.disabled=true;kind.disabled=true;file.disabled=true;
    let added=0,skipped=0,processed=0;
    try{
     for(let i=0;i<parsed.rows.length;i+=25){
      const subset=parsed.rows.slice(i,i+25);
      const payload=[];
      for(const row of subset){
       const v={...row};if(parsed.kind==='lateness')v.request=await importUUID(row);
       payload.push(v);
      }
      const outcome=await rpc('portal_import_batch',{p_kind:parsed.kind,p_rows:payload});
      added+=Number(outcome.added||0);skipped+=Number(outcome.skipped||0);processed+=subset.length;
      status.textContent=`Processadas ${processed}/${parsed.rows.length} linhas · ${added} novos · ${skipped} repetidos.`;
     }
     parsed=null;results.querySelector('.import-preview')?.remove();confirm.remove();execute.remove();
     status.textContent=`Importação finalizada: ${added} registro(s) criado(s), ${skipped} já existente(s). ${prepared.rejected.length} linha(s) inválida(s) não foram enviadas.`;
     notify('Importação concluída. Revise os registros em suas respectivas áreas.');
     onComplete?.();
    }catch(err){
     status.textContent=`Importação interrompida após ${processed} linha(s): ${added} novos, ${skipped} repetidos. Nenhuma linha do lote que falhou foi confirmada.`;
     const fail=document.createElement('p');fail.className='message error';fail.textContent=String(err.message||'Falha ao importar.');results.append(fail);
     execute.disabled=false;
    }finally{working=false;kind.disabled=false;file.disabled=false;}
   };
  }catch(err){const fail=document.createElement('p');fail.className='message error';fail.textContent=String(err.message||'Arquivo não reconhecido.');results.append(fail);}
  finally{working=false;document.getElementById('importPreview').disabled=false;}
 };
}
async function importUUID(row){
 const text=['presenca-v5-historico',row.ra,row.date,row.time,row.reason,row.justified].join('|');
 const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
 hash[6]=(hash[6]&15)|80;hash[8]=(hash[8]&63)|128;
 const hex=[...hash.slice(0,16)].map(x=>x.toString(16).padStart(2,'0')).join('');
 return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20,32)].join('-');
}
