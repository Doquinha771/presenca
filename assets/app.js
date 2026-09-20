import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SCHOOL_NAME } from '../config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm';

const $ = (id) => document.getElementById(id);
const SCHOOL_EMAIL = /^[0-9]{7,16}(sp)?@al\.educacao\.sp\.gov\.br$/i;
const configured = /^sb_publishable_[a-zA-Z0-9_-]+$/.test(SUPABASE_PUBLISHABLE_KEY)
  && SUPABASE_URL === 'https://svidahhpqozfaletpcbq.supabase.co';
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
}) : null;
let authMode = 'login';
let profile = null;
let students = [];
let teammates = [];
let historyRows = [];
let resets = [];
let auditRows = [];
let page = 'overview';
let loading = false;
let recovering = /(?:[?#&])type=recovery(?:[&#]|$)/.test(window.location.href);

function message(txt, kind = '', target = 'authMessage') {
  const node = $(target);
  node.hidden = false;
  node.className = 'message' + (kind ? ` ${kind}` : '');
  node.textContent = txt;
}
function errorText(error) {
  const code = String(error?.code || '');
  if (code === '23505') return 'Já existe um cadastro com esse identificador.';
  if (code === '42501') return 'Seu perfil não tem permissão para realizar esta ação.';
  if (code === 'PGRST202') return 'O banco ainda não recebeu o SQL desta versão. Consulte o README.';
  if (error?.message?.includes('Failed to fetch')) return 'Não foi possível conectar ao Supabase. Confira a conexão e a configuração.';
  return String(error?.message || 'A operação não pôde ser concluída.');
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function dateBR(value) {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(+date) ? '—' : new Intl.DateTimeFormat('pt-BR', value.length > 10 ? {dateStyle:'short',timeStyle:'short'} : {dateStyle:'short'}).format(date);
}
const isStaff = () => ['secretaria','admin'].includes(profile?.role);
const isAdmin = () => profile?.role === 'admin';
const roleName = role => ({aluno:'Aluno',secretaria:'Secretaria / portaria',admin:'Administrador'}[role] || 'Conta');
const filteredStudents = () => students.filter(x => x.role === 'aluno' && !x.archived_at);
const activeStudents = () => filteredStudents().filter(x => x.active && x.verified);
const studentById = id => students.find(s => s.id === id);

function setAuthMode(next) {
  authMode = next;
  $('authView').hidden = false;
  $('dashboard').hidden = true;
  const signup = next === 'signup';
  const recover = next === 'recover';
  const reset = next === 'resetPassword';
  $('signupFields').hidden = !signup;
  $('passwordFields').hidden = recover;
  $('emailLabel').hidden = reset;
  $('email').hidden = reset;
  $('email').required = !reset;
  $('password').required = !recover;
  $('password').autocomplete = signup || reset ? 'new-password' : 'current-password';
  $('authTitle').textContent = reset ? 'Definir nova senha' : signup ? 'Criar cadastro' : recover ? 'Recuperar acesso' : 'Entre com sua conta';
  $('authSubtitle').textContent = reset ? 'Escolha uma nova senha com pelo menos 10 caracteres.' : signup ? 'Alunos usam e-mail RA da Educação SP; integrantes da equipe precisam de convite.' : recover ? 'Enviaremos um link para o e-mail cadastrado.' : 'Use seu e-mail escolar ou o e-mail autorizado da equipe.';
  $('authSubmit').textContent = reset ? 'Salvar nova senha' : signup ? 'Cadastrar e confirmar e-mail' : recover ? 'Enviar link de recuperação' : 'Entrar no portal';
  $('authMessage').hidden = true;
  document.querySelectorAll('[data-auth]').forEach(btn => btn.classList.toggle('selected', btn.dataset.auth === next));
  if (!configured) message('Integração pendente: preencha SUPABASE_PUBLISHABLE_KEY em config.js e aplique sql/01_portal.sql no projeto Supabase. Nunca use chave secreta.','error');
}

async function handleAuth(event) {
  event.preventDefault();
  if (!supabase || loading) { if (!supabase) setAuthMode(authMode); return; }
  const email = $('email').value.trim().toLowerCase();
  const password = $('password').value;
  const btn = $('authSubmit');
  btn.disabled = true;
  try {
    if (authMode === 'resetPassword') {
      if (password.length < 10) throw new Error('Use pelo menos 10 caracteres na senha.');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      message('Senha atualizada. Você já pode entrar com sua conta.', 'success');
      await supabase.auth.signOut();
      recovering = false;
      setAuthMode('login');
      message('Senha alterada. Faça login com a nova senha.', 'success');
      return;
    }
    if (authMode === 'recover') {
      const {error} = await supabase.auth.resetPasswordForEmail(email,{ redirectTo: new URL('./', window.location.href).href });
      if (error) throw error;
      message('Se o e-mail estiver cadastrado, você receberá instruções de recuperação.', 'success');
      return;
    }
    if (authMode === 'signup') {
      if (password.length < 10) throw new Error('A senha deve ter ao menos 10 caracteres.');
      if (!$('consent').checked) throw new Error('Leia e aceite o aviso de privacidade para continuar.');
      const staff = $('staffSignup').checked;
      if (!staff && !SCHOOL_EMAIL.test(email)) throw new Error('Use seu RA no formato 0000111@al.educacao.sp.gov.br.');
      const name = $('fullName').value.trim();
      const grade = $('grade').value;
      const birth = $('birthDate').value;
      if (name.length < 3 || name.length > 120) throw new Error('Informe seu nome completo.');
      if (!staff && (!grade || !birth || birth > new Date().toISOString().slice(0,10))) throw new Error('Informe série e data de nascimento válidas.');
      const { error } = await supabase.auth.signUp({ email,password, options: {
        emailRedirectTo: new URL('./',window.location.href).href,
        data:{full_name:name,grade:staff?null:grade,birth_date:staff?null:birth}
      }});
      if (error) throw error;
      message('Cadastro solicitado. Confira a caixa de entrada e confirme o e-mail antes de entrar. Se já existir uma conta, use Entrar ou Recuperar.','success');
      return;
    }
    const {error} = await supabase.auth.signInWithPassword({email,password});
    if (error) throw error;
    await loadPortal();
  } catch (e) { message(errorText(e),'error'); }
  finally {btn.disabled=false;}
}

async function loadPortal() {
  if (!supabase || loading || recovering) return;
  loading = true;
  try {
    const {data:auth,error:authError} = await supabase.auth.getUser();
    if (authError || !auth.user) { await showLoggedOut(); return; }
    const {data:p,error} = await supabase.from('profiles').select('id,ra,full_name,grade,birth_date,role,verified,active,late_count,unjustified_count,late_limit,blocked,archived_at,archive_reason,created_at').eq('id',auth.user.id).single();
    if (error || !p) throw error || new Error('Perfil não encontrado. Aplique o SQL da versão web no Supabase.');
    if (!p.verified || !p.active) {
      await supabase.auth.signOut();
      await showLoggedOut();
      message('Conta não confirmada, suspensa ou em revisão. Confirme o e-mail ou procure a secretaria.','error');
      return;
    }
    if (recovering) return;
    profile=p;
    $('authView').hidden=true;
    $('dashboard').hidden=false;
    $('logoutBtn').hidden=false;
    $('sideName').textContent=p.full_name;
    $('sideRole').textContent=roleName(p.role);
    $('avatar').textContent=p.full_name[0]?.toUpperCase() || 'P';
    $('schoolLabel').textContent=SCHOOL_NAME;
    $('footerSchool').textContent=SCHOOL_NAME;
    document.querySelectorAll('.staff-only').forEach(x => x.hidden=!isStaff());
    document.querySelectorAll('.admin-only').forEach(x => x.hidden=!isAdmin());
    await refreshData();
    go('overview');
  } catch(e) {
    profile=null;
    $('dashboard').hidden=true;
    $('authView').hidden=false;
    message('Falha ao abrir o portal: '+errorText(e),'error');
  } finally {loading=false;}
}
async function showLoggedOut() {
  profile=null;
  $('logoutBtn').hidden=true;
  setAuthMode('login');
}
async function query(table, columns, config=()=>{}) {
  let req=supabase.from(table).select(columns);
  req=config(req);
  const {data,error}=await req;
  if(error) throw error;
  return data || [];
}
async function refreshData() {
  if (!profile) return;
  if (isStaff()) {
    students=await query('profiles','id,ra,full_name,grade,birth_date,role,verified,active,late_count,unjustified_count,late_limit,blocked,archived_at,archive_reason,created_at',q=>q.order('full_name').limit(1000));
    if (students.length === 1000) message('A listagem atingiu 1.000 perfis. Use paginação para uma rede escolar maior; os resultados abaixo podem estar incompletos.','error','flash');
  } else {students=[profile];}
  historyRows=await query('attendance_events','id,student_id,occurred_at,justified,reason,operator_id',q=>q.order('occurred_at',{ascending:false}).limit(200));
  if (isAdmin()) {
    [resets,auditRows]=await Promise.all([
      query('period_resets','id,scheduled_for,created_at,executed_at,cancelled_at',q=>q.order('scheduled_for',{ascending:false}).limit(100)),
      query('audit_events','id,created_at,actor_id,action,subject_id,detail',q=>q.order('created_at',{ascending:false}).limit(100))
    ]);
    teammates=students.filter(x=>x.role!=='aluno');
  } else {resets=[];auditRows=[];teammates=[];}
  renderAll();
}
function go(name) {
  const allowed=['overview','history',...(isStaff()?['students','entry']:[]),...(isAdmin()?['archive','team','period','audit']:[])];
  if(!allowed.includes(name)) name='overview';
  page=name;
  document.querySelectorAll('.page').forEach(node=>node.hidden=node.id!==`page-${name}`);
  document.querySelectorAll('.nav').forEach(node=>node.classList.toggle('active',node.dataset.page===name));
  const labels={overview:['Visão geral','Acompanhe os dados disponíveis para sua conta.'],students:['Alunos','Consulte a base discente autorizada.'],entry:['Registrar atraso','Registre uma ocorrência com identificação do operador.'],history:['Histórico','Consulte as ocorrências registradas.'],archive:['Arquivo escolar','Histórico preservado dos alunos arquivados.'],team:['Equipe e convites','Gerencie as permissões dos integrantes.'],period:['Período letivo','Administre os encerramentos do período.'],audit:['Auditoria','Consulte o registro de operações administrativas.']};
  $('pageTitle').textContent=labels[name][0];$('pageDesc').textContent=labels[name][1];
  if(name==='history') renderHistory();
}
function renderAll() {
  const target=isStaff()?filteredStudents():[profile];
  const total=target.length;
  const late=target.reduce((acc,p)=>acc+p.late_count,0);
  const warning=target.filter(p=>!p.blocked && p.unjustified_count >= Math.max(1,p.late_limit-2)).length;
  $('metricStudents').textContent=total;
  $('metricLate').textContent=late;
  $('metricWarning').textContent=warning;
  $('metricBlocked').textContent=target.filter(p=>p.blocked).length;
  $('welcomeName').textContent=`Olá, ${profile.full_name.split(' ')[0]}`;
  $('welcomeText').textContent=isStaff()?'Acesse os serviços administrativos disponíveis para seu perfil.':'Consulte seus registros pessoais de frequência escolar.';
  $('overviewInfo').textContent=isStaff() ? `Sua função: ${roleName(profile.role)}. Apenas ações autorizadas para sua função são disponibilizadas.` : `RA: ${profile.ra || '—'} • Série: ${profile.grade || '—'} • Data de nascimento: ${dateBR(profile.birth_date)}. Os registros estão disponíveis na aba Histórico.`;
  const list=activeStudents();
  for(const id of ['entryStudent','historyStudent']){
    const select=$(id); const prior=select.value;
    select.replaceChildren();
    const top=new Option(id==='entryStudent'?'Selecione um aluno':'Todos os alunos','');
    select.add(top);
    for(const s of list) select.add(new Option(`${s.full_name} • ${s.ra || ''}`,s.id));
    select.value=Array.from(select.options).some(o=>o.value===prior)?prior:'';
  }
  renderStudents();renderHistory();renderArchive();renderTeam();renderPeriods();renderAudit();
}
function table(headers, rows, empty='Nenhum registro encontrado.') {
  if(!rows.length) return `<p class="empty">${esc(empty)}</p>`;
  return `<table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}
function status(s) {
  return s.blocked ? '<span class="pill block">Bloqueado</span>' : s.unjustified_count >= Math.max(1,s.late_limit-2) ? '<span class="pill warn">Em atenção</span>' : '<span class="pill">Regular</span>';
}
function renderStudents() {
  if(!isStaff()) return;
  const term=$('studentSearch').value.toLocaleLowerCase('pt-BR').trim();
  const rows=filteredStudents().filter(s=>`${s.full_name} ${s.ra} ${s.grade}`.toLocaleLowerCase('pt-BR').includes(term)).map(s=>`<tr><td><span class="table-name">${esc(s.full_name)}</span><span class="table-sub">RA: ${esc(s.ra)}</span></td><td>${esc(s.grade)}</td><td>${s.late_count} (${s.unjustified_count} não justific.)</td><td>${status(s)}</td><td>${isAdmin()?`<button type="button" class="outline" data-student-action="forgive" data-student="${esc(s.id)}">Nova chance</button><button type="button" class="outline" data-student-action="reset" data-student="${esc(s.id)}">Resetar</button><button type="button" class="danger-outline" data-student-action="archive" data-student="${esc(s.id)}">Arquivar</button>`:'Consulte o histórico'}</td></tr>`);
  $('studentTable').innerHTML=table(['Aluno','Série','Atrasos','Situação','Ações'],rows);
}
function renderHistory() {
  const selection=isStaff()?$('historyStudent').value:profile?.id;
  const rows=historyRows.filter(r=>!selection||r.student_id===selection).map(r=>`<tr><td>${esc(dateBR(r.occurred_at))}</td>${isStaff()?`<td>${esc(studentById(r.student_id)?.full_name || 'Aluno')}</td>`:''}<td>${r.justified?'<span class="pill">Justificado</span>':'<span class="pill warn">Não justificado</span>'}</td><td>${esc(r.reason || '—')}</td></tr>`);
  $('historyTable').innerHTML=table(['Data',...(isStaff()?['Aluno']:[]),'Situação','Observação'],rows);
  $('historyCaption').textContent='Últimos 200 registros disponíveis para sua função';
}
function renderArchive() {
  if(!isAdmin())return;
  const rows=students.filter(s=>s.role==='aluno'&&s.archived_at).map(s=>`<tr><td>${esc(s.full_name)}<span class="table-sub">${esc(s.ra)}</span></td><td>${esc(s.grade)}</td><td>${dateBR(s.archived_at)}</td><td>${esc(s.archive_reason||'—')}</td><td><button type="button" class="outline" data-student-action="restore" data-student="${esc(s.id)}">Restaurar</button></td></tr>`);
  $('archiveTable').innerHTML=table(['Aluno','Série','Arquivado em','Motivo','Ação'],rows);
}
function renderTeam() {
  if(!isAdmin())return;
  const rows=teammates.map(s=>`<tr><td>${esc(s.full_name)}</td><td>${esc(roleName(s.role))}</td><td>${s.active?'<span class="pill">Ativo</span>':'<span class="pill block">Suspenso</span>'}</td><td>${s.id===profile.id?'Sua conta':`<button type="button" class="outline" data-team-action="role" data-team="${esc(s.id)}">Alterar função</button><button type="button" class="${s.active?'danger-outline':'outline'}" data-team-action="toggle" data-team="${esc(s.id)}">${s.active?'Suspender':'Reativar'}</button>`}</td></tr>`);
  $('teamTable').innerHTML=table(['Integrante','Função','Situação','Gerenciar'],rows,'Ainda não há outros integrantes.');
}
function renderPeriods() {
  if(!isAdmin())return;
  const rows=resets.map(r=>`<tr><td>${dateBR(r.scheduled_for)}</td><td>${r.executed_at?'<span class="pill">Executado</span>':r.cancelled_at?'<span class="pill block">Cancelado</span>':'<span class="pill warn">Pendente</span>'}</td><td>${!r.executed_at&&!r.cancelled_at?`<button type="button" class="danger-outline" data-cancel-reset="${esc(r.id)}">Cancelar</button>`:'—'}</td></tr>`);
  $('periodTable').innerHTML=table(['Data','Situação','Ação'],rows);
}
function renderAudit() {
  if(!isAdmin())return;
  const rows=auditRows.map(r=>`<tr><td>${esc(dateBR(r.created_at))}</td><td>${esc(r.action)}</td><td>${esc(teammates.find(t=>t.id===r.actor_id)?.full_name || 'Sistema')}</td><td>${esc(r.detail || '—')}</td></tr>`);
  $('auditTable').innerHTML=table(['Data','Operação','Responsável','Detalhe'],rows);
}
async function runRPC(name,args,success) {
  if(!supabase||!profile)throw new Error('Entre na sua conta para continuar.');
  const {error}=await supabase.rpc(name,args);
  if(error) throw error;
  await refreshData();
  message(success,'success','flash');
}
async function safeRun(fn) {
  try {await fn();} catch(e) {message(errorText(e),'error','flash');}
}

$('authForm').addEventListener('submit',handleAuth);
document.querySelectorAll('[data-auth]').forEach(x=>x.addEventListener('click',()=>setAuthMode(x.dataset.auth)));
$('openPrivacy').addEventListener('click',()=> $('privacyDialog').showModal());
$('themeBtn').addEventListener('click',()=>document.body.classList.toggle('high-contrast'));
$('logoutBtn').addEventListener('click',async()=>{
  if(supabase){const {error}=await supabase.auth.signOut();if(error){message(errorText(error),'error','flash');return;}}
  await showLoggedOut();
});
$('sidebarNav').addEventListener('click',e=>{const btn=e.target.closest('button[data-page]');if(btn&&!btn.hidden)go(btn.dataset.page);});
$('refreshBtn').addEventListener('click',()=>safeRun(async()=>{await refreshData();message('Informações atualizadas.','success','flash');}));
$('studentSearch').addEventListener('input',renderStudents);
$('historyStudent').addEventListener('change',renderHistory);
$('entryForm').addEventListener('submit',e=>{e.preventDefault();if(!isStaff())return;const id=$('entryStudent').value;if(!id){message('Selecione um aluno.','error','flash');return;}const justified=$('entryJustified').checked;const reason=$('entryReason').value.trim();if(!window.confirm('Confirmar o registro de atraso deste aluno?'))return;safeRun(async()=>{await runRPC('record_lateness',{p_student:id,p_justified:justified,p_reason:reason},'Atraso registrado com sucesso.');e.target.reset();});});
$('studentTable').addEventListener('click',e=>handleStudentButton(e));
$('archiveTable').addEventListener('click',e=>handleStudentButton(e));
function handleStudentButton(event){const btn=event.target.closest('button[data-student-action]');if(!btn||!isAdmin())return;const id=btn.dataset.student;const action=btn.dataset.studentAction;const student=studentById(id);if(!student)return;
  const labels={forgive:'Conceder nova chance',reset:'Resetar contadores',archive:'Arquivar aluno',restore:'Restaurar aluno'};
  let reason='Nova chance autorizada pela administração';
  if(action!=='forgive'){reason=window.prompt(`${labels[action]}: ${student.full_name}. Informe o motivo (mínimo 5 caracteres):`,'');if(reason===null)return;if(reason.trim().length<5){message('Informe um motivo com pelo menos 5 caracteres.','error','flash');return;}}
  if(!window.confirm(`${labels[action]} para ${student.full_name}?`))return;
  safeRun(()=>runRPC('student_action',{p_student:id,p_action:action,p_reason:reason.trim()},'Operação concluída e auditada.'));
}
$('inviteForm').addEventListener('submit',e=>{e.preventDefault();if(!isAdmin())return;const email=$('inviteEmail').value.trim().toLowerCase();const role=$('inviteRole').value;if(!window.confirm(`Autorizar cadastro de ${email} como ${roleName(role)}?`))return;safeRun(async()=>{await runRPC('create_staff_invite',{p_email:email,p_role:role},'Cadastro pré-aprovado. Oriente o integrante a abrir o portal e selecionar Cadastrar / Sou integrante da equipe.');e.target.reset();});});
$('teamTable').addEventListener('click',e=>{const btn=e.target.closest('button[data-team-action]');if(!btn||!isAdmin())return;const user=teammates.find(x=>x.id===btn.dataset.team);if(!user||user.id===profile.id)return;const kind=btn.dataset.teamAction;const role=kind==='role'?(user.role==='admin'?'secretaria':'admin'):user.role;const active=kind==='toggle'?!user.active:user.active;if(!window.confirm(`${kind==='role'?'Alterar a função':'Alterar o status'} de ${user.full_name} para ${roleName(role)} / ${active?'ativo':'suspenso'}?`))return;safeRun(()=>runRPC('change_staff_role',{p_user:user.id,p_role:role,p_active:active},'Permissão atualizada.'));});
$('periodForm').addEventListener('submit',e=>{e.preventDefault();if(!isAdmin())return;const date=$('periodDate').value;if(!window.confirm(`Agendar encerramento de período para ${dateBR(date)}?`))return;safeRun(async()=>{await runRPC('schedule_period_reset',{p_date:date},'Encerramento agendado. A execução automática depende do agendador SQL estar ativado.');e.target.reset();});});
$('resetNow').addEventListener('click',()=>{if(!isAdmin()||!window.confirm('Encerrar o período agora? Todos os contadores de alunos ativos serão zerados, preservando o histórico.'))return;safeRun(()=>runRPC('reset_period_now',{},'Período encerrado. O histórico foi preservado.'));});
$('periodTable').addEventListener('click',e=>{const btn=e.target.closest('button[data-cancel-reset]');if(!btn||!isAdmin()||!window.confirm('Cancelar este agendamento?'))return;safeRun(()=>runRPC('cancel_period_reset',{p_id:Number(btn.dataset.cancelReset)},'Agendamento cancelado.'));});

setAuthMode('login');
if(supabase){
  supabase.auth.onAuthStateChange((event)=>{
    if(event==='PASSWORD_RECOVERY') { recovering=true; setAuthMode('resetPassword'); }
    if(event==='SIGNED_OUT'&&profile) void showLoggedOut();
  });
  if(recovering) setAuthMode('resetPassword');
  else void loadPortal();
}
