# Relatório técnico — Presença+ 5.1

A interface responsiva mantém menu lateral no desktop e navegação inferior no celular. Importação de arquivos removida: não há leitor CSV/XLSX, prévia, formulário de upload nem RPC de importação disponível nesta versão.

O módulo de exportação XLSX é carregado sob demanda exclusivamente na área de relatórios para a equipe institucional. Os dados já chegam agregados pela RPC existente `portal_read('dashboard')`, evitando consultas paginadas a históricos individuais, duplicação de dados e envio de planilhas ao servidor. O arquivo exportado contém totais institucionais, agregados por turma e tendência de 14 dias; não inclui dados pessoais diretos.

O módulo gera planilhas OOXML no navegador, sem dependência adicional. Orientação de impressão A4 em paisagem já está no arquivo. Exportação e visualização são restritas a perfis institucionais na interface e mantêm os controles de acesso do backend existente.

Os testes automatizados usam dados fictícios. O ambiente de navegação bloqueou a abertura do servidor de homologação; por isso, não há novo resultado end-to-end de navegador nesta entrega. A pontuação Lighthouse do site publicado não foi medida; não declarar 100/100 sem medição verificável.
