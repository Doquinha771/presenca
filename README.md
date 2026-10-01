<div align="center">

<img src="assets/logo.png" alt="Identidade visual do Presença+" width="72" />

# Presença+

**Portal web de acompanhamento escolar e gestão de registros de atraso.**

[![Versão](https://img.shields.io/badge/vers%C3%A3o-5.3.8-205f50)](./docs/ALTERACOES.md)
[![Plataforma](https://img.shields.io/badge/plataforma-Web-396c82)](./index.html)
[![Banco](https://img.shields.io/badge/dados-Supabase-3c7659)](https://supabase.com/)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-institucional%20restrita-6c7075)](./LICENSE)

[**Acessar o portal**](https://doquinha771.github.io/presenca/) · [**Termos de Uso**](./termos.html) · [**Privacidade**](./privacidade.html)

</div>

## Sobre

O **Presença+** é uma aplicação web de apoio à rotina escolar. Organiza matrículas,
registra atrasos, acompanha ocorrências e disponibiliza aos alunos uma consulta
individual de seus próprios dados. A gestão e a conferência de registros cabem à
equipe institucional autorizada.

O **Presença+** foi desenvolvido por estudantes do **3º ano A da E.E. Amador e Catharina Saporito Augusto**, com apoio da equipe escolar, para resolver uma necessidade concreta da rotina da instituição.

É uma iniciativa de **inovação tecnológica no ambiente escolar** e uma ferramenta de apoio à rotina da escola. Não substitui os sistemas, os canais nem as decisões oficiais da Secretaria da Educação do Estado de São Paulo. O apoio à iniciativa não dispensa as regras de tratamento de dados pessoais dos estudantes.

## Funcionalidades

| Área | Recursos |
| --- | --- |
| Aluno | Acesso por conta individual, consulta de atrasos, histórico e comunicados. |
| Secretaria | Gestão de matrículas autorizadas, cadastro e registros de atraso. |
| Direção | Administração de permissões, ajustes justificados, períodos, calendário letivo e auditoria. |
| Ano letivo | Agendamento da virada, renovação com aprovação ou reprovação, conclusão e transferência, com histórico preservado. |
| Identidade | Solicitações pendentes de alunos, convites institucionais, confirmação de e-mail e provisionamento de contas pela secretaria. |
| Privacidade | Documentos públicos, controles de acesso no banco e solicitação de revisão de registros. |
| Mobile | Navegação inferior dedicada, menu de funções, cartões de histórico e formulários responsivos. |
| Relatórios | Resumo agregado e exportações Excel (.xlsx) de alunos, histórico e matrículas com filtros de turma, série e período, mediante autorização institucional. |

## Arquitetura

```text
Navegador (desktop / celular)
         |
         v
GitHub Pages (HTML + CSS + JavaScript)
         |
         v
Supabase Auth + Edge Functions + PostgreSQL
         |
         v
Políticas RLS / funções com validação de autorização
```

O resumo agregado é gerado a partir do painel. Listas e históricos identificáveis usam exclusivamente `portal_export`, função do Supabase com verificação de perfil institucional, paginação e registro de solicitação em auditoria. As planilhas são montadas no navegador autorizado; não há importador de planilhas. Confira `docs/EXPORTACOES.md` para a migração necessária.

A interface estática não contém senhas administrativas ou chaves de serviço.
`config.js` armazena somente a URL e a chave **publicável** do projeto Supabase.
Na nova matrícula, a Secretaria registra os dados escolares e o aluno cria sua própria conta e senha, confirmando o e-mail escolar. Matrículas já vinculadas a uma conta usam a recuperação de senha do Supabase Auth. O banco vincula automaticamente um cadastro ao registro escolar quando RA e e-mail institucional correspondem. Pré-cadastros sem matrícula aparecem como fichas à equipe, sem conceder acesso a dados escolares. A Edge Function `provision-student` permanece apenas como compatibilidade para procedimentos anteriores e não é chamada pelo novo cadastro. Operações no PostgreSQL dependem das políticas de acesso e das funções institucionais. Não há backend local ou armazenamento offline de registros.

## Estrutura do projeto

```text
.
├── index.html                    # Aplicação web
├── termos.html                   # Termos de Uso e Responsabilidades
├── privacidade.html              # Política de Privacidade
├── LICENSE                       # Licença institucional restrita
├── config.js                     # Configuração pública do Supabase
├── assets/                       # CSS, JavaScript, exportador sob demanda e identidade visual
├── sql/                          # Esquema e migrações do banco
├── supabase/functions/           # Provisionamento autorizado de alunos
├── docs/                         # Validação e diretrizes de implantação
└── tests/                        # Testes automatizados
```

## Perfis e acesso

- **Aluno:** consulta exclusivamente os próprios registros após a autorização
  de matrícula e as etapas de autenticação aplicáveis.
- **Secretaria:** administra matrículas e operações permitidas ao cargo.
- **Direção:** administra permissões, justificativas e configurações.

O aluno sem matrícula autorizada pode solicitar uma conta, mas permanece sem acesso aos registros escolares até a conferência institucional. A Secretaria registra a matrícula oficial e o aluno cria a própria conta e senha, usando seu e-mail escolar confirmado. Se a conta já existir, utiliza a recuperação de senha. O pré-cadastro espontâneo permanece pendente até a Secretaria verificar os dados oficiais. Durante a virada do ano, um aluno anteriormente matriculado pode acessar a mesma conta e seu histórico, embora as funções que dependem da matrícula atual só sejam liberadas após a renovação. Não use RA ou data de nascimento como senha inicial.

## Proteção de dados e uso institucional

O Presença+ poderá tratar nome, RA, e-mail escolar, turma, nascimento para
conferência de matrícula, registros de atraso e histórico de alterações.
A caixa de leitura no cadastro é uma etapa informativa da interface e **não**
representa consentimento genérico, contrato com o poder público ou registro
auditável de aceitação no banco.
As páginas de Termos e Privacidade são textos informativos de uso do portal.
A publicação não demonstra, por si só, adoção pelo poder público, certificação
de conformidade nem a existência de um instrumento de tratamento de dados.

**Governança de dados:** a atuação da equipe estudantil no código e na manutenção não concede acesso ilimitado a registros escolares. As decisões sobre finalidades, permissões e conservação seguem as atribuições dos responsáveis pelo tratamento; devem observar as bases legais, a segurança e os direitos dos titulares. Demonstrações e materiais públicos utilizam dados fictícios, sintéticos ou adequadamente anonimizados. O armazenamento internacional em nuvem exige salvaguardas previstas na LGPD. Consulte [Termos](./termos.html),
[Privacidade](./privacidade.html) e o
[checklist institucional](./docs/AVALIACAO_INSTITUCIONAL.md).

A autoria estudantil e o apoio da secretaria não autorizam a publicação de dados reais de alunos. Os registros escolares não devem ser armazenados no repositório do GitHub ou
em arquivos públicos do site. A disponibilização do código-fonte **não** torna
públicos nem licenciáveis os dados da instituição.

O fluxo de renovação anual e suas ressalvas estão documentados em `docs/VIRADA_ANO_LETIVO_20260923.md`. A mudança de versão não encerra o calendário atual automaticamente.

## Continuidade do Supabase Free

O repositório possui um workflow agendado que gera três consultas mínimas por dia no RPC `project_keepalive`. O RPC não lê nem modifica dados escolares e utiliza apenas a chave publicável já presente no cliente. A rotina existe como proteção adicional contra pausa automática por baixa atividade no plano Free; o uso real do portal continua sendo a principal atividade do banco. O workflow também pode ser executado manualmente pelo GitHub Actions.

A rotina não substitui monitoramento nem garante disponibilidade permanente do plano gratuito. Se o workflow agendado for desativado pelo GitHub ou se o projeto ultrapassar outras limitações do plano, a equipe deve verificar o painel do Supabase.

## Qualidade e testes

O repositório contém verificações automatizadas de validação de dados, acesso, integridade do frontend e documentos institucionais. Consulte `docs/VALIDACAO.md` para os critérios de homologação. A suíte SQL
utiliza banco PostgreSQL descartável. Testes locais não comprovam o
funcionamento de autenticação real ou a adequação jurídica de uma implantação.

## Estado do projeto

| Item | Situação |
| --- | --- |
| Versão do projeto | 5.3.1 (virada anual + keepalive do Supabase), requer as migrações 07, 09, 10 e 11 conforme o estado do banco |
| Plataforma | Web responsiva / GitHub Pages |
| Banco e autenticação | Supabase |
| Natureza do serviço | Projeto estudantil de apoio à rotina escolar, com apoio da equipe da unidade e sem condição de sistema oficial da rede estadual |
| Termos e política | Documentos 2.1 integrados ao site, com atribuições da equipe escolar e do grupo de estudantes |

## Licença

Distribuição conforme a **[Licença Institucional Restrita](./LICENSE)**.
A existência de um repositório público não concede, por si só, licença de
código aberto, permissão para tratamento de dados escolares nem endosso por
instituições públicas. Direitos e licenças de componentes de terceiros
permanecem aplicáveis.


## Relatórios escolares e impressão

A equipe institucional pode gerar o **resumo agregado** ou uma **lista de alunos**, **histórico por turma ou série** e **relação de matrículas** em Excel. Listas individuais podem conter nome e RA; matrículas também incluem e-mail institucional. Senhas, datas de nascimento e justificativas individuais não são exportadas. Filtros são executados pelo Supabase; o arquivo é montado no navegador e não é salvo no Storage. É necessário o RPC da migração `sql/07_exportacoes_institucionais.sql`.

Contagens por turma são dados agregados, mas podem permitir inferências em grupos muito pequenos. Os relatórios destinam-se apenas ao uso interno e não devem ser publicados sem avaliação de privacidade.

## Desempenho e acessibilidade

A navegação móvel e o desktop compartilham a linguagem visual da página Visão geral, com dimensionamento específico para cada dispositivo. O gerador XLSX é carregado somente quando o usuário institucional exporta um relatório. A interface oferece alvos de toque ampliados, foco visível, estados de carregamento e suporte à preferência por movimento reduzido. As pontuações Lighthouse variam conforme dispositivo, conexão, autenticação e conteúdo; não há garantia de pontuação fixa.


## Interface 5.3.8
A interface desktop foi refeita a partir da referência visual fornecida: navegação lateral azul, pesquisa no topo da visão geral, indicadores compactos, gráfico, resumo por turma, comunicados e ações rápidas, preservando os fluxos de Alunos, Matrículas e Séries/Turmas.
