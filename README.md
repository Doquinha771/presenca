# Presença+

Gestão escolar de atrasos, com Portal do Aluno, Secretaria e Direção. Versão 4.0.0 para GitHub Pages e Supabase.

**Estado: implementação entregue para homologação. A migração não foi executada no seu Supabase e os testes completos de banco e navegador ainda precisam passar. Não tratar esta entrega como produção validada.**

## Funções

```text
Autenticação Supabase com confirmação de e-mail e recuperação de senha
Matrícula autorizada antes do cadastro de alunos
Perfis Aluno, Secretaria e Direção, verificados no servidor
Registro rápido com busca, seleção por teclado e retorno ao campo de pesquisa
Limite inicial de cinco atrasos e novas chances individuais de uma unidade
Perdão e correção por ocorrência, sem apagar o registro original
Desfazimento pelo operador em até dois minutos
Proteção contra repetição de requisições e registros simultâneos
Dashboard com dia, semana, mês, evolução e indicadores por turma
Histórico paginado, filtros e exportação CSV
Gestão de matrículas, séries, turmas, funcionários e comunicados
Arquivo escolar, encerramento de períodos e agendamentos
Auditoria, solicitações de privacidade e incidentes
Interface adaptável, navegação lateral e tema escuro
```

## Atualizar uma instalação existente

1. Faça um backup pelo procedimento de exportação do banco adotado pela escola. Nenhum backup do banco remoto está incluído neste ZIP.
2. Rode `sql/00_preflight.sql` no SQL Editor e confirme que a estrutura corresponde à versão anterior do Portal. Guarde as contagens retornadas. Este projeto foi auditado a partir do ZIP, não a partir do banco em produção.
3. Em homologação, aplique **somente `sql/03_v4.sql`** se `sql/01_portal.sql` já foi aplicado anteriormente. Não execute novamente o script 01 em uma instalação existente.
4. Confira `select * from public.portal_migrations;`. Deve existir a versão `4.0.0`. A migração é transacional e executada uma vez; se já foi aplicada, não repita.
5. Execute os testes, valide os três perfis e só então faça o mesmo procedimento de migração no banco de produção.
6. Publique o frontend 4.0 após o SQL. Combine uma janela curta de atualização: as RPCs antigas de registro foram desativadas para impedir o uso das regras antigas.
7. Na Direção, confira os alunos antigos e use **Alunos → Gerenciar → Validar matrícula**. Os acessos e históricos anteriores são preservados; novos registros exigem validação institucional.

Se o banco tiver outro esquema ou alterações fora dos scripts enviados, não tente recriá-lo. Compare o resultado do preflight e adapte a migração antes de aplicá-la. Nenhuma tabela escolar é removida por `03_v4.sql`.

## Primeira instalação em banco vazio

1. Execute `sql/01_portal.sql` uma vez.
2. Execute `sql/03_v4.sql` uma vez.
3. No SQL Editor, autorize o endereço real do primeiro responsável:

```sql
insert into public.staff_invites(email, role)
values ('SUBSTITUA-PELO-EMAIL-REAL', 'admin');
```

4. No portal, escolha **Acesso institucional → Criar conta**, use o endereço autorizado, crie sua senha e confirme o e-mail.
5. Cadastre séries/turmas e autorize as matrículas. Funcionários adicionais são autorizados pela tela Equipe.

Não há senha administrativa padrão. Contas com e-mail `.invalid` não recebem confirmação ou recuperação; para o fluxo normal, use uma caixa de e-mail real. Não é preciso colocar chave administrativa no frontend.

## Configuração do Supabase

O arquivo `config.js` preserva o projeto `svidahhpqozfaletpcbq` e a chave publicável enviada no arquivo original. A presença dessa configuração não comprova que o banco já recebeu a migração.

No painel do Supabase:

- Habilite confirmação de e-mail e mantenha autenticação anônima desabilitada.
- Configure Site URL e Redirect URLs com o endereço exato do GitHub Pages, incluindo o repositório e a barra final. Exemplo: `https://doquinha771.github.io/presenca/` se esse for o repositório publicado.
- Configure o envio de e-mails para usuários reais e os limites de requisições do Supabase Auth. O aplicativo não implementa um limitador fictício no navegador.
- Mantenha somente o schema `public` exposto na Data API; **não exponha `private`**.
- Para os encerramentos automáticos, execute `sql/02_agendamento_opcional.sql` após a migração 4.0. Sem o agendador, encerramentos imediatos funcionam e agendamentos aguardam execução.
- Revise os avisos dos Security Advisors após a migração e teste as permissões em homologação.

Se mudar o projeto, atualize a URL e a chave publicável em `config.js` e o domínio permitido por `connect-src` no `index.html`. Nunca use chave secreta ou `service_role` nesses arquivos.

## Publicar no GitHub Pages

Coloque `index.html`, `config.js`, `.nojekyll` e `assets/` na raiz do repositório. Não coloque uma pasta externa contendo esses arquivos sem ajustar a origem do Pages.

Em **Settings → Pages**, escolha **Deploy from a branch → main → /(root)**. Alternativamente, publique apenas os arquivos estáticos pelo processo de Pages já adotado pelo repositório. O workflow incluído executa testes, não publica nem altera seu Supabase.

As URLs de navegação usam `#/history`, `#/students` etc. Os arquivos usam caminhos relativos, funcionando em `/presenca/` e no domínio raiz. Atualizar a página mantém a rota. Não há servidor Python, Node, SQLite, LAN ou serviço local para operar a aplicação.

O SDK Supabase está fixado em `2.57.0` via CDN. Falha da CDN ou da rede mostra uma mensagem de erro e opção de tentar novamente. O aplicativo é online: não registra nem armazena dados escolares offline.

## Uso diário

**Direção:** cadastrar turmas → autorizar matrículas → validar alunos anteriores → autorizar funcionários. O aluno cria a conta usando o e-mail, RA e nascimento que correspondem à matrícula autorizada. Nome e turma oficiais são copiados do cadastro da escola, não dos metadados enviados pelo aluno.

**Secretaria:** digitar o início do nome ou RA → escolher o aluno → registrar. Setas e Enter também funcionam. Após sucesso, a pesquisa recebe foco. O botão Desfazer exige justificativa e só vale por dois minutos para o operador do registro. Depois disso, a Direção corrige pelo Histórico.

**Direção, no Histórico:** Perdoar exclui a ocorrência da contagem atual quando ela pertence ao período conhecido; Corrigir/anular marca uma ocorrência incorreta; ambas mantêm o original e registram a justificativa. Nova chance fica no gerenciamento do aluno e aumenta o limite em exatamente uma unidade.

**Aluno:** consulta identificação, contagem, limite, histórico, perdões e comunicados próprios. Não registra atrasos, altera turma ou concede permissões.

## Contadores de versões anteriores

O sistema anterior podia zerar contadores sem marcar o período das ocorrências. A migração preserva o contador existente como saldo consolidado (`baseline_count`) e registra o início da nova contagem (`count_from`). Não tenta deduzir quais ocorrências antigas haviam sido zeradas.

Perdão ou anulação de uma ocorrência anterior ao início conhecido altera o histórico, mas não reduz esse saldo consolidado automaticamente. A operação informa essa situação. Após conferência institucional, a Direção pode iniciar um novo período individual ou coletivo; o histórico fica preservado. Não existe perda silenciosa de contadores na migração.

## Desenvolvimento e testes

A aplicação não requer build. Node, PostgreSQL e navegador são ferramentas de desenvolvimento/testes, não serviços de produção.

```sh
npm test
npm run check
```

Os sete testes unitários passaram nesta entrega. O workflow `.github/workflows/verify.yml` também prepara um PostgreSQL descartável, aplica os scripts, testa regras/permissões e concorrência e executa testes de navegador com respostas simuladas da API.

Para testes de interface em máquina de desenvolvimento:

```sh
npm install --no-save --package-lock=false playwright@1.58.2
npx playwright install chromium
npm run test:browser
```

`tests/browser.mjs` inicia um servidor efêmero apenas durante a verificação, simula a API e encerra ao terminar. Isso não é backend do produto. Nunca publique `tests/browser-fixture.mjs` como SDK da aplicação.

Para validar SQL, utilize um banco descartável PostgreSQL 16 chamado `presenca_test`, configure as variáveis `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` e `PGDATABASE` no ambiente do processo e execute:

```sh
psql -v ON_ERROR_STOP=1 -f tests/bootstrap.sql
psql -v ON_ERROR_STOP=1 -f sql/01_portal.sql
psql -v ON_ERROR_STOP=1 -f sql/03_v4.sql
psql -v ON_ERROR_STOP=1 -f tests/database.sql
node tests/concurrency.mjs
```

**Nunca execute `tests/bootstrap.sql` ou `tests/concurrency.mjs` no banco escolar.** O bootstrap substitui apenas as interfaces mínimas de Auth em um banco de teste vazio; não simula entrega de e-mail, tokens ou o serviço Supabase Auth completo. Concorrência cria dados fictícios persistentes somente no banco descartável.

Consulte `docs/VALIDACAO.md`, `docs/PERMISSOES.md` e `docs/ALTERACOES.md` para resultados, cobertura e limitações.

## Estado do projeto

Versão 4.0.0, exclusivamente web, configurada para GitHub Pages e Supabase. Código e migração preparados; implantação remota não realizada. Autenticação real, envio de e-mail, compatibilidade com o esquema remoto, testes transacionais e revisão visual precisam ser homologados antes da liberação escolar.
