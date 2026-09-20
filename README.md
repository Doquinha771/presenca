# Presença+ | Portal Escolar

Portal web estático, responsivo e independente, com Supabase Auth + PostgreSQL + Row Level Security. Inspirado em padrões de portais institucionais, **não é um serviço oficial do governo**.

## Estrutura pronta para GitHub Pages

```
index.html                 Página inicial (na raiz do repositório)
config.js                  URL e chave PUBLICÁVEL do projeto Supabase
assets/app.css             Interface e responsividade
assets/app.js              Aplicação web (sem Flask, FastAPI ou servidor local)
assets/logo.png            Logotipo da versão fornecida
sql/01_portal.sql          Banco, autenticação, RLS e funções transacionais
sql/02_agendamento_opcional.sql  Ativação opcional de resets automáticos via pg_cron
.nojekyll                  Publicação estática sem processamento Jekyll
```

## Implantação do projeto `svidahhpqozfaletpcbq`

**Banco Supabase instalado em 19/09/2026:** as cinco tabelas, políticas RLS, gatilhos de cadastro, funções do portal e agendamento automático foram criados diretamente no projeto informado. A conexão pública da interface também foi configurada. **Não execute novamente** `sql/01_portal.sql` nem `sql/02_agendamento_opcional.sql` neste mesmo projeto; eles estão incluídos para documentação e para instalações novas, não como atualizações idempotentes.

### Passos restantes para disponibilizar o portal

1. Em [Authentication > Providers](https://supabase.com/dashboard/project/svidahhpqozfaletpcbq/auth/providers), confirme que o provedor de e-mail está habilitado, que **Confirm email** está ativado e que o cadastro anônimo está desativado. Configure SMTP institucional, proteção contra senhas vazadas e limites de autenticação quando disponíveis. **Estas configurações do Auth não foram alteradas pela integração.** O envio aos e-mails RA depende da capacidade de entrega do provedor configurado.
2. Publique `index.html`, `config.js`, `assets/`, `sql/`, `.nojekyll` e `README.md` na raiz do seu repositório GitHub, no branch `main`. Em **Settings > Pages**, selecione **Deploy from a branch > main > /(root)**. Não publique o ZIP da versão legada, banco `.db`, `.env`, logs com informações pessoais ou senhas. **O GitHub Pages ainda não foi publicado por esta entrega.**
3. Depois de obter seu endereço HTTPS público, acesse [Authentication > URL Configuration](https://supabase.com/dashboard/project/svidahhpqozfaletpcbq/auth/url-configuration), coloque a URL exata do GitHub Pages como **Site URL** e adicione-a em **Redirect URLs** (com a barra final, se usada). Exemplo: `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`. Não use curingas amplos para domínio de produção.
4. **Conta administradora inicial:** cadastre-se com uma conta de e-mail RA válida, confirme o e-mail e copie seu UUID em **Authentication > Users**. Como administrador autorizado do Supabase, execute no SQL Editor, substituindo pelo UUID real de uma pessoa autorizada:

   ```sql
   update public.profiles
      set role = 'admin'
    where id = 'UUID-REAL-DO-ADMIN'::uuid and verified = true;
   ```

   Se o administrador não tiver e-mail RA, um responsável pelo banco pode cadastrar **um convite inicial** no SQL Editor, usando o endereço real e institucional da pessoa autorizada, e orientá-la a selecionar **Cadastrar > Sou integrante da equipe**. O convite precisa estar cadastrado antes da inscrição, e a confirmação do e-mail continua obrigatória:

   ```sql
   insert into public.staff_invites (email, role)
   values ('EMAIL_REAL_DO_ADMIN@DOMINIO_INSTITUCIONAL', 'admin');
   ```

   **Não existe conta nem senha administrativa padrão.** Não crie convites de administrador para endereços que você não controla. A integração não promoveu ninguém automaticamente.
5. Abra o portal publicado, confirme um cadastro de teste com e-mail escolar e verifique o login e os diferentes níveis de acesso com contas autorizadas. O banco está vazio e **ainda não houve teste de e-mail real, autenticação completa nem publicação no GitHub Pages.**

O arquivo `config.js` contém exclusivamente a chave **publicável** do projeto informado. Chaves `sb_secret_` e `service_role` nunca devem ser colocadas no navegador. A URL JWKS é um endpoint público de verificação de assinaturas JWT; a biblioteca de autenticação do frontend não precisa configurá-la manualmente.

O encerramento automático já está ativado via `pg_cron`, com verificação horária. Não é necessário executar o script opcional de agendamento neste projeto. O banco não precisa de servidor local nem de aplicativo rodando continuamente.

**Nota de domínio escolar:** apenas confirmar um endereço `@al.educacao.sp.gov.br` prova a posse da caixa de e-mail, não comprova nome, série nem vínculo ativo com a matrícula. Antes de usar o serviço com dados reais, defina um procedimento de validação cadastral com a escola e obtenha autorização institucional.

## Funções e permissões

| Função | Pode visualizar | Pode executar |
| --- | --- | --- |
| Aluno | Próprio cadastro e seus atrasos | Cadastro, login, recuperação de senha |
| Secretaria / portaria | Base discente verificada e histórico | Registrar atraso justificado ou não |
| Administrador | Base discente, histórico, equipe, auditoria e resets | Tudo acima + nova chance, reset individual/geral, arquivar/restaurar, autorizar equipe, alterar cargos |

Um aluno nunca pode escolher a própria função ou alterar seus contadores pelo JavaScript. Os registros são feitos com identidade obtida da sessão no PostgreSQL, não por um campo `ra_operador` enviado pelo cliente. Contadores são atualizados no mesmo commit do histórico com bloqueio de linha para evitar concorrência. Arquivar um aluno preserva os registros, sem apagar a linha original.

## Segurança e limitações

- RLS habilitado em todas as tabelas do schema público; grants somente de leitura aos usuários autenticados. Nenhuma gravação direta do navegador em tabelas; somente funções SQL com verificações explícitas de perfil, confirmação de e-mail e atividade.
- Convites da equipe usam e-mail exato, prazo de 14 dias e uso único, criados apenas por administrador autenticado. Admin inicial precisa ser promovido manualmente no SQL Editor por usuário autorizado.
- Funções privilegiadas usam `search_path` vazio, acesso explícito a tabelas e validação de parâmetros. O agendador fica em schema privado e não é invocável pela API pública.
- Auditoria grava ações e identificadores, evitando incluir e-mails e datas de nascimento nos detalhes. Não apresenta qualquer garantia legal de retenção e não deve ser apagada sem política definida pela instituição.
- O serviço depende da disponibilidade do GitHub Pages, Supabase e e-mail. **GitHub Pages não permite configurar livremente cabeçalhos HTTP de segurança**: a política CSP desta versão é em `<meta>`, sem equivalência com cabeçalhos de resposta como HSTS e `frame-ancestors`.
- O frontend carrega `@supabase/supabase-js@2.57.0` pelo CDN jsDelivr, com versão fixada. Recomenda-se processo de atualização e revisão periódica das dependências. Não há backend próprio, mas o Supabase é um serviço remoto essencial.
- A autenticação usa e-mail e senha, com confirmação por e-mail se o Supabase estiver configurado conforme o passo 4. Para ambiente real, a escola deve decidir se autenticação multifator é exigida para cargos administrativos.
- **O aviso de privacidade é um rascunho técnico**. A instituição deve definir controlador, encarregado, base legal, política de retenção e autorização antes de usar dados reais de estudantes, inclusive menores de idade.

## Dados do aplicativo antigo

O ZIP recebido incluía `data/banco_central.db` com registros de alunos, histórico, operadores e logs. Nenhum dado pessoal desse banco foi colocado no pacote web nem no repositório. **O pacote não migra automaticamente os dados legados**: as senhas do sistema local não viram credenciais Supabase Auth, e é necessário associar cada matrícula a uma identidade autenticada e confirmada antes de importar o histórico de forma segura. Planeje uma importação controlada no SQL Editor com autorização da escola e backup, fora do GitHub público.

## Como verificar antes de produção

1. Tente abrir `profiles` e `attendance_events` sem login pelo REST: deve receber erro de permissão ou não obter linhas.
2. Com aluno A autenticado, tente consultar aluno B e chamar `record_lateness`, `student_action`, `create_staff_invite` e `reset_period_now`: as operações devem ser negadas.
3. Com conta da secretaria, confira se pode registrar atraso e se não pode arquivar, resetar ou criar convites.
4. Com administrador, teste registro simultâneo para o mesmo aluno, histórico, arquivo/restauração, nova chance e encerramento do período.
5. Abra o site em celular e computador, inclua o domínio correto no Auth e confirme login/recuperação. Verifique o **Security Advisor** do Supabase e corrija cada alerta aplicável.

## Estado

Configuração web apontando para `svidahhpqozfaletpcbq`. Banco remoto: **5 tabelas com RLS e 9 funções públicas do portal instaladas**, restrição de execução aplicada à função auxiliar `public.rls_auto_enable()`, agendador `presenca_period_reset` ativado. O banco permanece sem alunos e sem equipe cadastrados. GitHub Pages, SMTP, confirmações de e-mail e criação do primeiro administrador dependem das ações acima. Nenhum dado sensível do SQLite antigo foi incluído no pacote ou migrado para o Supabase.
