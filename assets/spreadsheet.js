// Leitor local de CSV e do subconjunto tabular OOXML (.xlsx).
// Nenhum arquivo é enviado para um serviço de conversão.
const MAX_FILE = 4 * 1024 * 1024;
const MAX_INFLATED = 6 * 1024 * 1024;
const MAX_ROWS = 2001;
const MAX_COLS = 24;
const decoder = new TextDecoder('utf-8',{fatal:true});
const normal = value => String(value ?? '').trim();
const canonical = s => normal(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function parseCSV(text){
 const lines=text.replace(/^\uFEFF/,'');
 const first=lines.split(/\r?\n/,1)[0];
 const delimiter=[';',',','\t'].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
 const rows=[];let cells=[],field='',quoted=false;
 for(let i=0;i<lines.length;i++){
  const c=lines[i];
  if(c==='"'){
   if(quoted&&lines[i+1]==='"'){field+='"';i++;}else quoted=!quoted;
  }else if(c===delimiter&&!quoted){cells.push(field);field='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&lines[i+1]==='\n')i++;cells.push(field);if(cells.some(v=>normal(v)))rows.push(cells);cells=[];field='';if(rows.length>MAX_ROWS)throw Error('A planilha excede 2.000 linhas. Divida o arquivo.');}
  else field+=c;
  if(field.length>2000)throw Error('Campo de planilha maior que o permitido.');
 }
 if(quoted)throw Error('CSV com aspas não fechadas.');
 cells.push(field);if(cells.some(v=>normal(v)))rows.push(cells);
 return rows;
}
const u16=(v,i)=>v.getUint16(i,true),u32=(v,i)=>v.getUint32(i,true);
function archiveEntries(buffer){
 const v=new DataView(buffer),bytes=new Uint8Array(buffer);let end=-1;
 for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-66000);i--){if(u32(v,i)===0x06054b50){end=i;break;}}
 if(end<0)throw Error('Arquivo XLSX inválido: diretório ZIP não encontrado.');
 const count=u16(v,end+10),start=u32(v,end+16);
 if(count>300||start>=v.byteLength)throw Error('Planilha contém partes demais.');
 let offset=start;const out=new Map();
 for(let n=0;n<count;n++){
  if(offset+46>v.byteLength||u32(v,offset)!==0x02014b50)throw Error('Estrutura XLSX inválida.');
  const method=u16(v,offset+10),size=u32(v,offset+20),inflated=u32(v,offset+24);
  const len=u16(v,offset+28),extra=u16(v,offset+30),comment=u16(v,offset+32),local=u32(v,offset+42);
  if(offset+46+len+extra+comment>v.byteLength)throw Error('Arquivo XLSX incompleto.');
  const name=decoder.decode(bytes.subarray(offset+46,offset+46+len));
  if(name.startsWith('xl/')&&inflated>MAX_INFLATED)throw Error('Planilha descompactada muito grande.');
  out.set(name,{method,size,inflated,local});offset+=46+len+extra+comment;
 }
 return {v,bytes,out};
}
async function zipText(zip,name){
 const entry=zip.out.get(name);if(!entry)return '';
 const {v,bytes}=zip,{local,method,size,inflated}=entry;
 if(local+30>v.byteLength||u32(v,local)!==0x04034b50)throw Error('Conteúdo XLSX inválido.');
 const start=local+30+u16(v,local+26)+u16(v,local+28);
 if(start+size>v.byteLength)throw Error('Conteúdo XLSX truncado.');
 const packed=bytes.slice(start,start+size);
 if(method===0)return decoder.decode(packed);
 if(method!==8||typeof DecompressionStream!=='function')throw Error('Este navegador não suporta a importação XLSX; exporte a planilha como CSV.');
 const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 const uncompressed=await new Response(stream).arrayBuffer();
 if(uncompressed.byteLength>MAX_INFLATED||uncompressed.byteLength>Math.max(1000,inflated+1000))throw Error('Planilha descompactada excede o tamanho permitido.');
 return decoder.decode(uncompressed);
}
const children=(element,localName)=>Array.from(element?.childNodes||[]).filter(n=>n.nodeType===1&&n.localName===localName);
const first=(element,localName)=>children(element,localName)[0];
function parseXml(s){const d=new DOMParser().parseFromString(s,'application/xml');if(d.querySelector('parsererror'))throw Error('XML da planilha inválido.');return d;}
const textOf=(el,tag)=>first(el,tag)?.textContent||'';
function cellIndex(ref){const col=(ref.match(/^[A-Z]+/i)||[''])[0].toUpperCase();let n=0;for(const ch of col)n=n*26+ch.charCodeAt(0)-64;return n-1;}
async function parseXlsx(buffer){
 const zip=archiveEntries(buffer);
 const sharedDoc=await zipText(zip,'xl/sharedStrings.xml');
 const shared=sharedDoc?children(parseXml(sharedDoc).documentElement,'si').map(si=>Array.from(si.getElementsByTagName('t')).map(el=>el.textContent||'').join('')):[];
 // Lê a primeira planilha tabular presente no pacote, sem processar macros ou links.
 const sheets=[...zip.out.keys()].filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a,b)=>Number(a.match(/\d+/g).at(-1))-Number(b.match(/\d+/g).at(-1)));
 if(!sheets.length)throw Error('Nenhuma aba tabular encontrada no XLSX.');
 const sheet=await zipText(zip,sheets[0]);const xml=parseXml(sheet),data=xml.getElementsByTagName('sheetData')[0];
 if(!data)throw Error('Planilha sem células tabulares.');
 const rows=[];
 for(const row of children(data,'row')){
  if(rows.length>=MAX_ROWS)throw Error('A planilha excede 2.000 linhas.');
  const cells=[];
  for(const cell of children(row,'c')){
   if(first(cell,'f'))throw Error('A planilha contém fórmulas. Converta as fórmulas em valores antes de importar.');
   const pos=cellIndex(cell.getAttribute('r')||'');if(pos<0||pos>=MAX_COLS)continue;
   const type=cell.getAttribute('t');let value=textOf(cell,'v');
   if(type==='s')value=shared[Number(value)]??'';
   else if(type==='inlineStr')value=Array.from(cell.getElementsByTagName('t')).map(t=>t.textContent||'').join('');
   else if(type==='b')value=value==='1'?'Sim':'Não';
   cells[pos]=value;
  }
  if(cells.some(v=>normal(v)))rows.push(Array.from({length:Math.min(MAX_COLS,cells.length)},(_,i)=>cells[i]??''));
 }
 return rows;
}
export async function readSpreadsheet(file){
 if(!file||file.size>MAX_FILE)throw Error('Escolha um arquivo de até 4 MB.');
 const ext=file.name.toLowerCase().split('.').at(-1);
 let rows;
 if(ext==='csv'){rows=parseCSV(await file.text());}
 else if(ext==='xlsx'){rows=await parseXlsx(await file.arrayBuffer());}
 else throw Error('Use .xlsx ou .csv. Arquivos .xls, .xlsm e planilhas com macros não são aceitos.');
 if(rows.length<2)throw Error('A planilha precisa ter cabeçalho e pelo menos uma linha de dados.');
 if(rows.length>MAX_ROWS)throw Error('Arquivo com mais de 2.000 linhas.');
 if(rows[0].length>MAX_COLS)throw Error('Arquivo com colunas demais.');
 return rows;
}
const HEADER={
 classes:{grade:['serie','ano','etapa','grade'],name:['turma','sala','classe','class']},
 enrollments:{ra:['ra','registroaluno','matricula'],name:['nome','nomecompleto','aluno'],birth:['nascimento','datadenascimento','datanasc','birthdate'],grade:['serie','ano','etapa','grade'],class:['turma','sala','classe']},
 lateness:{ra:['ra','registroaluno','matricula'],date:['data','diadoatraso','dataatraso','dia'],time:['hora','horario','horadochegada'],reason:['observacao','motivo','justificativa','descricao','reason'],justified:['justificado','justificada','situacao']}
};
const required={classes:['grade','name'],enrollments:['ra','name','birth','grade','class'],lateness:['ra','date']};
export function mapSpreadsheet(rows,kind){
 const spec=HEADER[kind];if(!spec)throw Error('Tipo de importação não reconhecido.');
 const titles=rows[0].map(canonical),indexes={};
 for(const [key,alternatives] of Object.entries(spec)){
  indexes[key]=titles.findIndex(t=>alternatives.includes(t));
  if(required[kind].includes(key)&&indexes[key]<0)throw Error('Coluna obrigatória ausente: '+alternatives[0]+'.');
 }
 const accepted=[],rejected=[],unique=new Set();
 rows.slice(1).forEach((cells,i)=>{
  const row=Object.fromEntries(Object.entries(indexes).map(([key,index])=>[key,index<0?'':normal(cells[index])]));
  try{
   if(kind==='classes'){
    if(!row.grade||!row.name||row.grade.length>70||row.name.length>20)throw Error('Série ou turma inválida.');
   }else if(kind==='enrollments'){
    row.ra=row.ra.toLowerCase();
    if(!/^[0-9]{7,16}(sp)?$/.test(row.ra)||row.name.length<3||row.name.length>120)throw Error('RA ou nome inválido.');
    row.email=row.ra+'@al.educacao.sp.gov.br';row.birth=schoolDate(row.birth);
    if(!row.grade||!row.class)throw Error('Série ou turma ausente.');
   }else{
    row.ra=row.ra.toLowerCase();if(!/^[0-9]{7,16}(sp)?$/.test(row.ra))throw Error('RA inválido.');
    row.date=schoolDate(row.date);
    if(!row.time)row.time='07:00';
    if(/^\d{1,2}:\d{2}(?::\d{2})?$/.test(row.time)){const parts=row.time.split(':');row.time=parts[0].padStart(2,'0')+':'+parts[1];}
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.time))throw Error('Horário inválido.');
    if(row.reason.length>500)throw Error('Observação excede 500 caracteres.');
    row.justified=/^(sim|s|true|1|justificado)$/i.test(row.justified);
   }
   const key=kind==='classes'?canonical(row.grade)+'/'+canonical(row.name):kind==='enrollments'?row.ra:row.ra+'/'+row.date+'/'+row.time+'/'+row.reason;
   if(unique.has(key))throw Error('Linha repetida nesta planilha.');unique.add(key);
   accepted.push({...row,line:i+2});
  }catch(e){rejected.push({line:i+2,reason:e.message});}
 });
 return {accepted,rejected};
}
function schoolDate(value){
 let s=normal(value),match=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 if(match)s=`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;
 else if(/^\d{4,5}(\.\d+)?$/.test(s)){
  const n=Number(s);if(n<1||n>90000)throw Error('Data inválida.');
  const d=new Date(Date.UTC(1899,11,30)+Math.floor(n)*86400000);s=d.toISOString().slice(0,10);
 }
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Data inválida.');
 const d=new Date(s+'T12:00:00Z');if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==s)throw Error('Data impossível.');
 return s;
}
export function previewCell(value){return normal(value).slice(0,160);}
