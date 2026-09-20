/* Um erro no módulo ou na CDN precisa ser visível, nunca uma página branca. */
const fail = (message) => {
 document.getElementById('boot').hidden = true;
 document.getElementById('fatal').hidden = false;
 document.getElementById('fatalText').textContent = message;
};
document.getElementById('reload').onclick = () => location.reload();
const timer = setTimeout(() => fail('O carregamento demorou mais que o esperado. Confira a conexão e tente novamente.'), 18000);
import('./app.js').then(() => { clearTimeout(timer); document.getElementById('boot').hidden = true; document.getElementById('fatal').hidden = true; }).catch(() => {clearTimeout(timer); fail('Falha ao carregar o portal. Confira a conexão e o acesso ao provedor de autenticação.');});
