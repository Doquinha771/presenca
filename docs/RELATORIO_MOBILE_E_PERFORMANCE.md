# Relatório técnico de interface e desempenho — Presença+ 5.0

## Escopo do pacote

- Interface móvel independente da apresentação desktop: barra inferior, menu lateral em gaveta, cartões responsivos, formulários e caixas de diálogo ajustados para toque.
- Central de importação com leitura local CSV/XLSX, conferência prévia, validação de cabeçalhos, limites de arquivo e lote.
- Módulos `import-ui.js` e `spreadsheet.js` carregados sob demanda, apenas na área de importação.
- Animações simples de opacidade/translação que respeitam `prefers-reduced-motion`.
- Controle de acesso aplicado no backend da importação e não somente no JavaScript.

## Resultados que podem ser afirmados

- 21 testes automatizados Node foram aprovados na execução local deste pacote.
- 33 verificações em Chromium com DOM local e rede Supabase simulada foram aprovadas, incluindo navegação em 390 px e 1366 px, ausência de rolagem horizontal nas rotas verificadas, importação CSV e leitura XLSX de exemplo.
- Esses testes de DOM desabilitam a CSP para embutir os scripts e substituir as dependências externas por dublês. Não são testes end-to-end do GitHub Pages ou do Supabase real.
- Não foi possível obter um relatório válido Lighthouse/PageSpeed do URL publicado, porque o acesso público ao site e à API PageSpeed foi bloqueado no ambiente. Nenhuma pontuação foi atribuída ao mobile ou ao desktop.
- A migração SQL `sql/06_importacao_institucional.sql` está incluída no projeto, mas não foi executada nem testada contra o PostgreSQL de produção nesta entrega.

## Limitações e riscos operacionais

- A central de importação só poderá gravar dados quando a migração SQL da versão 5.0 estiver presente no banco de destino.
- A criação de contas após a importação de matrículas continua individual, para evitar a distribuição indevida de credenciais.
- O leitor XLSX aceita planilhas tabulares comuns da primeira aba. Não executa fórmulas, macros, conexões externas ou arquivos legados `.xls`.
- Para ocorrências históricas, os alunos precisam ter conta vinculada, matrícula validada e acesso ativo. O servidor preserva o horário original e não altera contagens de períodos anteriores.
- Uma falha em lote interrompe as próximas linhas; os lotes já confirmados permanecem registrados e uma repetição não deverá duplicar ocorrências com o mesmo identificador.

## Medição de performance necessária

Medir a versão publicada, com login e sem login, usando Lighthouse mobile e desktop em múltiplas execuções. Registrar mediana e métricas de FCP, LCP, CLS, TBT e INP em dispositivos reais. Não utilizar 100/100 como afirmação sem relatório verificável da mesma versão.
