<div align="center">

<img src="assets/logo.png" alt="Identidade visual do Presença+" width="72" />

# Presença+

**Portal web de acompanhamento escolar e gestão de registros de atraso.**

[![Versão](https://img.shields.io/badge/vers%C3%A3o-5.0.0-205f50)](./docs/ALTERACOES.md)
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

O **Presença+** foi desenvolvido por um **grupo de estudantes do 3º ano A da E.E. Amador e Catharina Saporito Augusto**, no contexto do Trabalho de Conclusão de Curso (TCC) do curso técnico de Desenvolvimento de Sistemas. O projeto conta com o apoio da secretaria escolar e a participação da comunidade educacional, com foco em resolver uma necessidade concreta da instituição.

É uma iniciativa de **inovação tecnológica no ambiente escolar** e uma ferramenta de apoio à rotina da escola. Não substitui os sistemas, os canais nem as decisões oficiais da Secretaria da Educação do Estado de São Paulo. O apoio à iniciativa não dispensa as regras de tratamento de dados pessoais dos estudantes.

## Funcionalidades

| Área | Recursos |
| --- | --- |
| Aluno | Acesso por conta individual, consulta de atrasos, histórico e comunicados. |
| Secretaria | Gestão de matrículas autorizadas, cadastro e registros de atraso. |
| Direção | Administração de permissões, ajustes justificados, períodos e auditoria. |
| Identidade | Solicitações pendentes de alunos, convites institucionais, confirmação de e-mail e provisionamento de contas pela secretaria. |
| Privacidade | Documentos públicos, controles de acesso no banco e solicitação de revisão de registros. |
| Mobile | Navegação inferior dedicada, menu de funções, cartões de histórico e formulários responsivos. |
| Relatórios | Exportação Excel (.xlsx) com indicadores e atrasos consolidados por turma e por dia, sem identificadores individuais. |

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

A exportação Excel é gerada apenas no dispositivo do profissional autenticado, a partir de totais agregados disponibilizados pelo painel institucional. O arquivo não contém nomes, RA, e-mail, data de nascimento ou justificativas individuais. Não há importador de planilhas.

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
As páginas de Termos e Privacidade são textos informativos de uso do portal.
A publicação não demonstra, por si só, adoção pelo poder público, certificação
de conformidade nem a existência de um instrumento de tratamento de dados.

**Governança de dados:** a atuação da equipe estudantil no código e na manutenção não concede acesso ilimitado a registros escolares. As decisões sobre finalidades, permissões e conservação seguem as atribuições dos responsáveis pelo tratamento; devem observar as bases legais, a segurança e os direitos dos titulares. A apresentação do TCC utiliza dados fictícios, sintéticos ou adequadamente anonimizados. O armazenamento internacional em nuvem exige salvaguardas previstas na LGPD. Consulte [Termos](./termos.html),
[Privacidade](./privacidade.html) e o
[checklist institucional](./docs/AVALIACAO_INSTITUCIONAL.md).

O trabalho acadêmico e o apoio da secretaria não autorizam a publicação de dados reais de alunos. Os registros escolares não devem ser armazenados no repositório do GitHub ou
em arquivos públicos do site. A disponibilização do código-fonte **não** torna
públicos nem licenciáveis os dados da instituição.

## Qualidade e testes

O repositório contém verificações automatizadas de validação de dados, acesso, integridade do frontend e documentos institucionais. Consulte `docs/VALIDACAO.md` para os critérios de homologação. A suíte SQL
utiliza banco PostgreSQL descartável. Testes locais não comprovam o
funcionamento de autenticação real ou a adequação jurídica de uma implantação.

## Estado do projeto

| Item | Situação |
| --- | --- |
| Versão do projeto | 5.1.0 (interface e relatórios), banco compatível com 4.1.2 |
| Plataforma | Web responsiva / GitHub Pages |
| Banco e autenticação | Supabase |
| Natureza do serviço | Projeto estudantil coletivo de TCC, com apoio da secretaria escolar, sem condição de sistema oficial da rede estadual |
| Termos e política | Documentos 2.1 integrados ao site, com atribuições da equipe escolar e do grupo de estudantes |

## Licença

Distribuição conforme a **[Licença Institucional Restrita](./LICENSE)**.
A existência de um repositório público não concede, por si só, licença de
código aberto, permissão para tratamento de dados escolares nem endosso por
instituições públicas. Direitos e licenças de componentes de terceiros
permanecem aplicáveis.


## Relatórios escolares e impressão

A equipe institucional pode gerar um arquivo Excel (`.xlsx`) de uso interno com totais de atrasos de hoje, da semana e do mês, quantidades consolidadas por turma no mês corrente e tendência dos últimos 14 dias. A exportação não inclui informações de alunos individualmente identificáveis nem contém senhas, RA, e-mails, datas de nascimento ou observações. O arquivo é gerado no navegador e não é armazenado no Supabase.

Contagens por turma são dados agregados, mas podem permitir inferências em grupos muito pequenos. Os relatórios destinam-se apenas ao uso interno e não devem ser publicados sem avaliação de privacidade.

## Desempenho e acessibilidade

A navegação móvel tem apresentação independente da interface de desktop. O gerador XLSX é carregado somente quando o usuário institucional exporta um relatório. A interface oferece alvos de toque ampliados, foco visível, estados de carregamento e suporte à preferência por movimento reduzido. As pontuações Lighthouse variam conforme dispositivo, conexão, autenticação e conteúdo; não há garantia de pontuação fixa.
