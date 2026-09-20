<div align="center">

<img src="assets/logo.png" alt="Identidade visual do Presença+" width="72" />

# Presença+

**Portal web de acompanhamento escolar e gestão de registros de atraso.**

[![Versão](https://img.shields.io/badge/vers%C3%A3o-4.1.2-205f50)](./docs/ALTERACOES.md)
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

O projeto é **independente** e não deve ser apresentado como sistema oficial da
Secretaria da Educação. Sua adoção com dados reais requer aprovação institucional,
procedimentos de segurança, governança de dados e avaliação jurídica prévias.

## Funcionalidades

| Área | Recursos |
| --- | --- |
| Aluno | Acesso por conta individual, consulta de atrasos, histórico e comunicados. |
| Secretaria | Gestão de matrículas autorizadas, cadastro e registros de atraso. |
| Direção | Administração de permissões, ajustes justificados, períodos e auditoria. |
| Identidade | Solicitações pendentes de alunos, convites institucionais, confirmação de e-mail e provisionamento de contas pela secretaria. |
| Privacidade | Documentos públicos, controles de acesso no banco e solicitação de revisão de registros. |

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

A interface estática não contém senhas administrativas ou chaves de serviço.
`config.js` armazena somente a URL e a chave **publicável** do projeto Supabase.
A criação automática de contas de alunos matriculados é processada na Edge Function
`provision-student`, cujo acesso exige autenticação e verificação do cargo no
banco. Operações no PostgreSQL dependem das políticas de acesso e das funções
institucionais. Não há backend local ou armazenamento offline de registros.

## Estrutura do projeto

```text
.
├── index.html                    # Aplicação web
├── termos.html                   # Termos de Uso e Responsabilidades
├── privacidade.html              # Política de Privacidade
├── LICENSE                       # Licença institucional restrita
├── config.js                     # Configuração pública do Supabase
├── assets/                       # CSS, JavaScript e identidade visual
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

O aluno sem matrícula autorizada pode solicitar uma conta, mas permanece sem acesso aos registros escolares até a conferência institucional. O aluno matriculado pela secretaria pode receber uma conta provisionada pela
função administrativa. O responsável institucional deve entregar a senha
provisória por canal individual e orientar sua alteração. Solicitações
espontâneas dependem de validação institucional. Nunca use o RA ou a data de
nascimento como senha inicial.

## Proteção de dados e uso institucional

O Presença+ poderá tratar nome, RA, e-mail escolar, turma, nascimento para
conferência de matrícula, registros de atraso e histórico de alterações.
A caixa de leitura no cadastro é uma etapa informativa da interface e **não**
representa consentimento genérico, contrato com o poder público ou registro
auditável de aceitação no banco.
As políticas do site são **minutas para avaliação**, não prova de autorização
oficial, certificação de conformidade ou substituto para o contrato de
tratamento de dados eventualmente exigido pela autoridade educacional.

**Antes do uso com dados reais:** identifique o controlador e os eventuais
operadores; documente a base legal e a finalidade; confira a necessidade de
cada campo; estabeleça retenção, canais de atendimento e resposta a incidentes;
revise RLS, permissões e os contratos de nuvem; avalie a transferência
internacional de dados. Consulte [Termos](./termos.html),
[Privacidade](./privacidade.html) e o
[checklist institucional](./docs/AVALIACAO_INSTITUCIONAL.md).

Os registros escolares não devem ser armazenados no repositório do GitHub ou
em arquivos públicos do site. A disponibilização do código-fonte **não** torna
públicos nem licenciáveis os dados da instituição.

## Qualidade e testes

O repositório contém verificações automatizadas de validação de dados, acesso, integridade do frontend e documentos institucionais. Consulte `docs/VALIDACAO.md` para os critérios de homologação. A suíte SQL
utiliza banco PostgreSQL descartável. Testes locais não comprovam o
funcionamento de autenticação real ou a adequação jurídica de uma implantação.

## Estado do projeto

| Item | Situação |
| --- | --- |
| Versão do projeto | 4.1.2, com documentação jurídica 1.0 |
| Plataforma | Web responsiva / GitHub Pages |
| Banco e autenticação | Supabase (projeto institucional a ser validado) |
| Implantação institucional | Depende de aprovação formal e validação jurídica e técnica |
| Termos e política | Minutas integradas ao site, aguardando identificação dos responsáveis e canais oficiais |

## Licença

Distribuição conforme a **[Licença Institucional Restrita](./LICENSE)**.
A existência de um repositório público não concede, por si só, licença de
código aberto, permissão para tratamento de dados escolares nem endosso por
instituições públicas. Direitos e licenças de componentes de terceiros
permanecem aplicáveis.
