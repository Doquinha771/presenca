export const SCHOOL_EMAIL=/^[0-9]{7,16}(sp)?@al\.educacao\.sp\.gov\.br$/i;
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const dateBR=v=>v?new Intl.DateTimeFormat('pt-BR',v.length>10?{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}:{dateStyle:'short'}).format(new Date(v.length===10?v+'T12:00:00':v)):'—';
export const csvCell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
export function errorText(e){if(e?.code==='42501')return 'Seu acesso não permite esta operação. Atualize a sessão ou procure a Direção.';if(e?.code==='23505')return 'Já existe um registro com esse RA, e-mail ou identificação.';if(e?.code==='PGRST202')return 'O banco precisa da migração 4.0. Consulte as instruções de implantação.';if(/fetch|network|timeout/i.test(e?.message||''))return 'Falha de conexão. Confira a internet. Em caso de dúvida, consulte o histórico antes de repetir.';return e?.message||'Não foi possível concluir a operação.';}
export const roleName=r=>({aluno:'Aluno',secretaria:'Secretaria',admin:'Direção'}[r]||'Conta');
