# 📦 Claude Artifacts Downloader

Ferramenta para download em massa de artefatos do Claude AI com três implementações diferentes: script de console, bookmarklet e extensão do Chrome.

## 🚀 Funcionalidades

- **Download em massa** de todos os artefatos de uma conversa
- **Detecção automática** de tipos de arquivo (código, SVG, HTML, markdown)
- **Suporte a múltiplas linguagens** de programação
- **Export em ZIP** com metadados
- **Inclusão opcional** do texto da conversa
- **Timestamps** nos nomes de arquivo
- **Interface amigável** para extensão do Chrome

## 📋 Métodos de Uso

### 1. 🖥️ Script de Console (Recomendado para uso esporádico)

**Como usar:**
1. Abra uma conversa no Claude AI
2. Pressione `F12` para abrir o DevTools
3. Vá para a aba **Console**
4. Cole o código do arquivo `claude_artifacts_downloader.js`
5. Execute `downloadAllArtifacts(true)` para ZIP ou `downloadAllArtifacts(false)` para arquivos individuais

**Vantagens:**
- Funcionalidade completa com ZIP
- Inclui texto da conversa
- Metadados detalhados

### 2. 🔗 Bookmarklet (Uso rápido)

**Como configurar:**
1. Copie o código minificado do arquivo `claude_bookmarklet.js`
2. Crie um novo bookmark no seu navegador
3. Cole o código no campo URL do bookmark
4. Salve com nome "Download Claude Artifacts"

**Como usar:**
- Clique no bookmark quando estiver em uma conversa Claude
- Arquivos são baixados automaticamente

**Limitações:**
- Apenas download de arquivos individuais
- Sem funcionalidade ZIP

### 3. 🧩 Extensão do Chrome (Melhor experiência)

**Como instalar:**
1. Abra `chrome://extensions/`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta do projeto
5. A extensão aparecerá na barra de ferramentas

**Como usar:**
1. Navegue para uma conversa no Claude AI
2. Clique no ícone da extensão
3. Configure as opções desejadas:
   - ✅ Incluir texto da conversa
   - ✅ Download como ZIP
   - ✅ Adicionar timestamp
4. Clique em "Download All Artifacts"

**Vantagens:**
- Interface gráfica intuitiva
- Todas as funcionalidades disponíveis
- Fácil configuração de opções

## 📁 Tipos de Arquivo Suportados

A ferramenta detecta automaticamente e salva os seguintes tipos:

| Tipo | Extensões Suportadas |
|------|---------------------|
| **Código** | `.js`, `.ts`, `.py`, `.java`, `.cpp`, `.c`, `.cs`, `.php`, `.rb`, `.go`, `.rs`, `.sh`, `.sql`, `.yml`, `.json`, `.xml`, `.css`, `.html` |
| **Markup** | `.md`, `.html` |
| **Gráficos** | `.svg` |
| **Dados** | `.json` |
| **Outros** | `.txt` |

## 🗂️ Estrutura dos Arquivos Baixados

### Download em ZIP
```
claude-artifacts.zip
├── artifact_1.js
├── artifact_2.py
├── artifact_3.svg
├── conversation.md      # Texto da conversa (opcional)
└── metadata.json       # Metadados dos artefatos
```

### Arquivo metadata.json
```json
{
  "extractedAt": "2024-01-15T10:30:00.000Z",
  "totalArtifacts": 3,
  "artifacts": [
    {
      "title": "calculator_app",
      "type": "application/vnd.ant.code",
      "language": "javascript"
    }
  ]
}
```

## ⚙️ Configurações

### Script de Console
```javascript
const CONFIG = {
    downloadDelay: 1000,              // Delay entre downloads (ms)
    zipFilename: 'claude-artifacts.zip',
    includeConversation: true,        // Incluir texto da conversa
};
```

### Extensão do Chrome
- **Incluir conversa**: Adiciona arquivo `conversation.md` com histórico
- **Download como ZIP**: Agrupa todos os arquivos em um ZIP
- **Timestamp**: Adiciona data/hora aos nomes dos arquivos

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
ArtefactsDownloader/
├── claude_artifacts_downloader.js  # Script principal para console
├── claude_bookmarklet.js           # Versão bookmarklet
├── claude_extension.json           # Extensão Chrome completa
├── CLAUDE.md                       # Documentação para Claude Code
└── README.md                       # Este arquivo
```

### Principais Funções
- `extractArtifacts()`: Extrai artefatos da página usando seletores DOM
- `getCodeExtension()`: Mapeia linguagens para extensões de arquivo
- `downloadAsZip()`: Cria e baixa arquivo ZIP com JSZip
- `downloadIndividualFiles()`: Baixa arquivos separadamente
- `extractConversationText()`: Extrai texto da conversa em markdown

## 🎯 Seletores DOM Utilizados

| Elemento | Seletor | Função |
|----------|---------|--------|
| Artefatos | `[data-testid="artifact"]` | Container principal |
| Título | `[data-testid="artifact-title"]` | Nome do artefato |
| Código | `pre code` | Blocos de código |
| Conversa | `[data-testid="conversation-turn"]` | Mensagens |
| Linguagem | `.language-*` | Detecção da linguagem |

## 🛠️ Dependências

- **JSZip**: Carregado dinamicamente do CDN para criação de arquivos ZIP
- **Chrome Extensions API**: Para a versão extensão
- **DOM APIs**: Para extração de conteúdo da página

## 📝 Limitações

- Funciona apenas em páginas do Claude AI (`claude.ai/*`)
- Alguns iframes podem ter restrições CORS
- Bookmarklet não suporta ZIP devido às limitações de segurança
- Requer JavaScript habilitado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é open source. Use livremente para fins educacionais e pessoais.

## ⚠️ Aviso Legal

Esta ferramenta é desenvolvida de forma independente e não é oficialmente afiliada ao Claude AI ou Anthropic. Use com responsabilidade e respeite os termos de serviço do Claude AI.

---

**Versão**: 1.0.0  
**Compatibilidade**: Chrome, Firefox, Edge  
**Última atualização**: Janeiro 2024