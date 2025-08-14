// Script para Download em Massa de Artefatos do Claude
// Execute este script no console do navegador (F12 → Console)

(function() {
    'use strict';
    
    // Configurações
    const CONFIG = {
        downloadDelay: 1000, // Delay entre downloads (ms)
        zipFilename: 'claude-artifacts.zip',
        includeConversation: true, // Incluir texto da conversa
        formats: {
            'application/vnd.ant.code': 'getCodeExtension',
            'text/markdown': '.md',
            'text/html': '.html',
            'image/svg+xml': '.svg',
            'application/json': '.json'
        }
    };
    
    // Função para determinar extensão de arquivo baseada na linguagem
    function getCodeExtension(language) {
        const extensions = {
            'javascript': '.js',
            'typescript': '.ts',
            'python': '.py',
            'java': '.java',
            'cpp': '.cpp',
            'c': '.c',
            'csharp': '.cs',
            'php': '.php',
            'ruby': '.rb',
            'go': '.go',
            'rust': '.rs',
            'bash': '.sh',
            'sql': '.sql',
            'yaml': '.yml',
            'json': '.json',
            'xml': '.xml',
            'css': '.css',
            'html': '.html',
            'dockerfile': '.dockerfile',
            'plaintext': '.txt'
        };
        return extensions[language?.toLowerCase()] || '.txt';
    }
    
    // Função para extrair artefatos da página
    function extractArtifacts() {
        const artifacts = [];
        
        // Buscar todos os elementos de artefatos
        const artifactElements = document.querySelectorAll('[data-testid="artifact"]');
        
        artifactElements.forEach((element, index) => {
            try {
                // Extrair título do artefato
                const titleElement = element.querySelector('[data-testid="artifact-title"]') || 
                                   element.querySelector('.artifact-title') ||
                                   element.querySelector('h3, h2, h1');
                const title = titleElement?.textContent?.trim() || `Artifact_${index + 1}`;
                
                // Extrair conteúdo
                const contentElement = element.querySelector('pre code') || 
                                     element.querySelector('pre') ||
                                     element.querySelector('.artifact-content') ||
                                     element.querySelector('iframe')?.contentDocument?.body;
                
                if (!contentElement) return;
                
                let content = '';
                let mimeType = 'text/plain';
                let language = '';
                
                // Determinar tipo de conteúdo
                if (contentElement.tagName === 'CODE') {
                    content = contentElement.textContent;
                    // Tentar extrair linguagem das classes
                    const classNames = contentElement.className;
                    const langMatch = classNames.match(/language-(\w+)/);
                    language = langMatch ? langMatch[1] : 'plaintext';
                    mimeType = 'application/vnd.ant.code';
                } else if (element.querySelector('svg')) {
                    // SVG artifact
                    const svgElement = element.querySelector('svg');
                    content = svgElement.outerHTML;
                    mimeType = 'image/svg+xml';
                } else if (element.querySelector('iframe')) {
                    // HTML artifact
                    const iframe = element.querySelector('iframe');
                    try {
                        content = iframe.contentDocument.documentElement.outerHTML;
                        mimeType = 'text/html';
                    } catch (e) {
                        console.warn('Cannot access iframe content due to CORS:', e);
                        content = '<!-- Content not accessible due to CORS restrictions -->';
                    }
                } else {
                    // Texto genérico
                    content = contentElement.textContent || contentElement.innerHTML;
                    mimeType = 'text/markdown';
                }
                
                if (content.trim()) {
                    artifacts.push({
                        title: sanitizeFilename(title),
                        content: content,
                        mimeType: mimeType,
                        language: language,
                        index: index + 1
                    });
                }
            } catch (error) {
                console.error(`Erro ao processar artefato ${index + 1}:`, error);
            }
        });
        
        return artifacts;
    }
    
    // Função para sanitizar nome de arquivo
    function sanitizeFilename(filename) {
        return filename
            .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '_')     // Substitui espaços por underscore
            .replace(/_+/g, '_')      // Remove underscores consecutivos
            .toLowerCase()
            .substring(0, 50);        // Limita tamanho
    }
    
    // Função para determinar extensão do arquivo
    function getFileExtension(artifact) {
        const { mimeType, language } = artifact;
        
        if (mimeType === 'application/vnd.ant.code') {
            return getCodeExtension(language);
        }
        
        return CONFIG.formats[mimeType] || '.txt';
    }
    
    // Função para criar e baixar arquivo ZIP
    async function downloadAsZip(artifacts) {
        // Verificar se JSZip está disponível
        if (typeof JSZip === 'undefined') {
            // Carregar JSZip dinamicamente
            await loadJSZip();
        }
        
        const zip = new JSZip();
        
        // Adicionar artefatos ao ZIP
        artifacts.forEach(artifact => {
            const filename = `${artifact.title}${getFileExtension(artifact)}`;
            zip.file(filename, artifact.content);
        });
        
        // Adicionar conversa se solicitado
        if (CONFIG.includeConversation) {
            const conversationText = extractConversationText();
            if (conversationText) {
                zip.file('conversation.md', conversationText);
            }
        }
        
        // Adicionar metadados
        const metadata = {
            extractedAt: new Date().toISOString(),
            totalArtifacts: artifacts.length,
            artifacts: artifacts.map(a => ({
                title: a.title,
                type: a.mimeType,
                language: a.language
            }))
        };
        zip.file('metadata.json', JSON.stringify(metadata, null, 2));
        
        // Gerar e baixar ZIP
        try {
            const content = await zip.generateAsync({type: 'blob'});
            downloadBlob(content, CONFIG.zipFilename);
            console.log(`✅ Download concluído: ${artifacts.length} artefatos salvos em ${CONFIG.zipFilename}`);
        } catch (error) {
            console.error('Erro ao gerar ZIP:', error);
        }
    }
    
    // Função para carregar JSZip dinamicamente
    function loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Função para extrair texto da conversa
    function extractConversationText() {
        const messages = document.querySelectorAll('[data-testid="conversation-turn"]');
        let conversationText = '# Conversa Claude\n\n';
        conversationText += `Extraído em: ${new Date().toLocaleString()}\n\n`;
        
        messages.forEach((message, index) => {
            try {
                const isUser = message.querySelector('[data-testid="user-message"]');
                const isAssistant = message.querySelector('[data-testid="assistant-message"]');
                
                const sender = isUser ? 'Usuário' : isAssistant ? 'Claude' : 'Sistema';
                const content = message.textContent.trim();
                
                if (content) {
                    conversationText += `## ${sender} (${index + 1})\n\n${content}\n\n---\n\n`;
                }
            } catch (error) {
                console.warn(`Erro ao extrair mensagem ${index + 1}:`, error);
            }
        });
        
        return conversationText;
    }
    
    // Função para baixar blob
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Função para download individual
    function downloadIndividualFiles(artifacts) {
        artifacts.forEach((artifact, index) => {
            setTimeout(() => {
                const filename = `${artifact.title}${getFileExtension(artifact)}`;
                const blob = new Blob([artifact.content], { type: artifact.mimeType });
                downloadBlob(blob, filename);
            }, index * CONFIG.downloadDelay);
        });
        
        console.log(`✅ Iniciando download de ${artifacts.length} arquivos individuais...`);
    }
    
    // Função principal
    async function downloadAllArtifacts(asZip = true) {
        console.log('🚀 Iniciando extração de artefatos...');
        
        const artifacts = extractArtifacts();
        
        if (artifacts.length === 0) {
            console.warn('❌ Nenhum artefato encontrado nesta conversa.');
            return;
        }
        
        console.log(`📦 Encontrados ${artifacts.length} artefatos:`);
        artifacts.forEach(a => console.log(`  - ${a.title} (${a.mimeType})`));
        
        if (asZip) {
            await downloadAsZip(artifacts);
        } else {
            downloadIndividualFiles(artifacts);
        }
    }
    
    // Interface de controle
    console.log(`
🎯 Claude Artifacts Downloader carregado!

Comandos disponíveis:
- downloadAllArtifacts(true)  : Download como ZIP (recomendado)
- downloadAllArtifacts(false) : Download arquivos individuais

Exemplo de uso:
downloadAllArtifacts(true);
    `);
    
    // Tornar função disponível globalmente
    window.downloadAllArtifacts = downloadAllArtifacts;
    
    // Auto-executar se desejado (descomente a linha abaixo)
    // downloadAllArtifacts(true);
    
})();

// Para executar imediatamente, descomente a linha abaixo:
// downloadAllArtifacts(true);