# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto
Este é o **ArtefactsDownloader** - uma ferramenta para download em massa de artefatos do Claude AI. O projeto consiste em três arquivos JavaScript que implementam diferentes formas de extrair e baixar artefatos de conversas do Claude:

1. **Script de Console** (`claude_artifacts_downloader.js`) - Para execução manual no console do navegador
2. **Bookmarklet** (`claude_bookmarklet.js`) - Para uso como bookmark no navegador
3. **Extensão do Chrome** (`claude_extension.json`) - Extensão completa com interface popup

## Arquitetura

### Núcleo Funcional
Todos os três arquivos compartilham a mesma lógica principal:

- **`extractArtifacts()`**: Localiza elementos DOM com `[data-testid="artifact"]` e extrai conteúdo
- **`getCodeExtension()`**: Mapeia linguagens de programação para extensões de arquivo
- **Detecção de Tipos**: Identifica automaticamente código, SVG, HTML, markdown baseado no DOM
- **Download**: Suporta download individual ou em ZIP (quando JSZip disponível)

### Seletores DOM Principais
- `[data-testid="artifact"]` - Container principal do artefato
- `[data-testid="artifact-title"]` - Título do artefato
- `pre code` - Blocos de código
- Classes `language-*` - Identificação da linguagem de programação

### Fluxo de Dados
1. Escaneamento da página para encontrar artefatos
2. Extração de metadados (título, tipo, linguagem)
3. Sanitização de nomes de arquivo
4. Geração de arquivos com extensões apropriadas
5. Download via blob URLs

## Comandos de Desenvolvimento
Este projeto não possui comandos de build, teste ou lint tradicionais por ser composto apenas de arquivos JavaScript standalone que executam no browser. Para desenvolvimento:

- Teste no console: Execute `claude_artifacts_downloader.js` diretamente no DevTools
- Teste bookmarklet: Cole o código minificado como URL de bookmark
- Teste extensão: Carregue `claude_extension.json` como extensão não empacotada no Chrome

## Notas Importantes
- **Ambiente de Execução**: Browser (Chrome/Firefox) nas páginas claude.ai/*
- **Dependências**: JSZip (carregado dinamicamente via CDN quando necessário)
- **Segurança**: Scripts verificam origem claude.ai e tratam erros CORS
- **Formato de Saída**: Arquivos individuais ou ZIP com metadados JSON