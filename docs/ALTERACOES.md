# Relatório de alterações — 4.0.0

## Auditoria do arquivo recebido

A base enviada continha HTML/CSS/JavaScript, logo, configuração publicável do Supabase, dois scripts SQL, README e metadados Git. Não havia Flask, FastAPI, SQLite, instaladores ou serviços LAN no código entregue. Por isso, não foi necessário remover backend local existente; a nova versão mantém a arquitetura exclusivamente web. Metadados `.git` não entram no ZIP de distribuição.

Foram identificados: listagem limitada a 1.000 perfis e 200 ocorrências; contadores calculados no frontend para o dashboard; leitura desnecessária de nascimento; cadastro por domínio de e-mail sem matrícula autorizada; falta de idempotência; perdão confundido com nova chance; ausência de desfazimento e correção por ocorrência; dependência de módulo externo sem tratamento de falha inicial.

O esquema efetivo do Supabase não foi acessado: a conexão disponível listou zero projetos. A migração toma como referência o `01_portal.sql` recebido. Não houve alteração nem exclusão de dados remotos.

## Interface

Reconstrução institucional com fundo claro, verde discreto, tipografia do sistema, navegação lateral, acesso de aluno separado visualmente do institucional, cartões, tabelas responsivas, modais, indicadores de conexão e tema escuro. Logo original preservado. Busca da Secretaria tem suporte a setas, Enter e seleção por toque.

A identidade de julho foi interpretada a partir dos requisitos fornecidos. Nenhum código ou captura da versão de julho estava anexado; não é possível afirmar que o resultado reproduz fielmente aquela interface.

## Regras e dados

- Matrículas autorizadas com RA, nome, e-mail, nascimento e turma.
- Perfis existentes preservados, com validação institucional pendente para novos registros.
- Quinto atraso bloqueia novos registros comuns; nova chance soma um ao limite.
- Perdão e anulação preservam original, responsável e justificativa.
- Desfazimento de dois minutos somente pelo operador.
- Lock por estudante, chave idempotente e janela de proteção de dois minutos para duplicação.
- Encerramentos usam bloqueio compatível com registros simultâneos.
- Contadores antigos preservados como saldo consolidado; histórico total consultado separadamente.
- Tabelas novas usam UUID. Eventos, auditorias e agendamentos legados conservam chaves bigint e ganham UUID público para não quebrar os vínculos existentes.
- Paginação de 25 registros para histórico, alunos, matrículas, equipe, auditoria e privacidade; exportação percorre as páginas filtradas.
- Cadastro de turmas, correção de dados escolares, arquivo, equipe, comunicados, regras e privacidade.

## Preservações

Confirmação e recuperação de e-mail, convite de funcionário, suspensão/reativação, arquivo/restauração, encerramento individual/coletivo e agendamentos foram preservados ou reconstruídos. A opção antiga de registrar diretamente um atraso como justificado foi substituída pelo registro normal seguido de decisão da Direção sobre perdão; isso evita que a Secretaria contorne a regra de limite.

Não há exclusão automática de dados, credenciais administrativas embutidas, autorização via armazenamento local ou fila offline. O único armazenamento próprio do navegador é a preferência de tema; a sessão é gerenciada pelo Supabase Auth.

## Limitações conhecidas

1. Migração e testes completos de banco/navegador não executados neste ambiente; veja VALIDACAO.md.
2. Matrícula autorizada ainda não vinculada a conta Auth não recebe atraso. O aluno precisa completar o cadastro e confirmar o e-mail antes de entrar no fluxo atual, pois a base original vincula estudantes a `auth.users`.
3. Históricos anteriores ao saldo consolidado não têm sua participação no período inferida automaticamente. Correções nesses registros não alteram o saldo sem revisão institucional.
4. Pesquisa por início de nome ou RA, sem busca aproximada ou por palavras no meio do nome.
5. Exportação CSV, sem XLSX/PDF. O pedido não exigia esses formatos adicionais.
6. Invites autorizam o cadastro; não enviam mensagem de convite automaticamente. O Supabase envia confirmação e recuperação de senha conforme configuração do projeto.
7. Política institucional de privacidade e limites de autenticação dependem da configuração pela escola/Supabase. A UI não declara conformidade jurídica automática.
8. Nenhum arquivo é enviado ao Storage; esse recurso não era necessário às funções implementadas.
9. Sem restauração automática do frontend antigo: RPCs antigas de registro são revogadas. Reverter exige revisão do SQL, não apenas trocar o HTML.


## Presença+ 4.1.0 — Cadastro institucional e economia de espaço

- A tela de entrada diferencia explicitamente aluno e instituição; o cadastro autônomo exibe os passos de validação escolar.
- O registro de alunos pela equipe agora devolve o identificador da matrícula. A criação de contas já confirmadas exige uma Edge Function autorizada, que gera senha temporária forte e mostra o segredo somente ao funcionário autenticado.
- Cadastros autônomos passam a aguardar a vinculação com matrícula feita pela escola. Nenhum dado autodeclarado concede cargo institucional ou autoriza acesso escolar.
- A migração `sql/04_v4_1.sql` mantém os registros anteriores, protege tabelas pela RLS e evita armazenar textos redundantes em novas auditorias de rotina. O tamanho real depende da quantidade de alunos, uso, índices e Auth.
- **Implantação parcial:** banco remoto atualizado. O deploy automático da Edge Function foi bloqueado pela integração; precisa ser feito antes de publicar a nova interface do GitHub Pages.
