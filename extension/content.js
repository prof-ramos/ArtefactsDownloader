(function() {
    'use strict';
    
    console.log('Claude Artifacts Downloader: Content script carregado');
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script recebeu mensagem:', request);
        
        if (request.action === 'scanArtifacts') {
            try {
                const artifacts = extractArtifacts();
                console.log('Artefatos encontrados:', artifacts.length);
                sendResponse({
                    success: artifacts.length > 0,
                    count: artifacts.length
                });
            } catch (error) {
                console.error('Erro ao escanear artefatos:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        } else if (request.action === 'downloadArtifacts') {
            downloadAllArtifacts(request.options)
                .then(count => {
                    sendResponse({
                        success: true,
                        count: count
                    });
                })
                .catch(error => {
                    sendResponse({
                        success: false,
                        error: error.message
                    });
                });
        }
        return true; // Keep message channel open for async response
    });

    // Shared functions from main script
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

    function sanitizeFilename(filename) {
        return filename
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_')
            .toLowerCase()
            .substring(0, 50);
    }

    function extractArtifacts() {
        const artifacts = [];
        
        // Tenta múltiplos seletores para encontrar artefatos
        const selectors = [
            '[data-testid="artifact"]',
            '.artifact',
            '[class*="artifact"]',
            '.prose .language-',
            'pre code',
            'svg',
            'iframe'
        ];
        
        let artifactElements = [];
        for (const selector of selectors) {
            artifactElements = document.querySelectorAll(selector);
            console.log(`Seletor "${selector}": encontrou ${artifactElements.length} elementos`);
            if (artifactElements.length > 0) break;
        }
        
        console.log(`Total de elementos para processar: ${artifactElements.length}`);
        
        // Se não encontrou elementos com seletores específicos, 
        // tenta buscar blocos de código diretamente
        if (artifactElements.length === 0) {
            console.log('Tentando fallback: buscando blocos de código...');
            const codeBlocks = document.querySelectorAll('pre, code, .highlight');
            console.log(`Blocos de código encontrados: ${codeBlocks.length}`);
            
            if (codeBlocks.length > 0) {
                artifactElements = codeBlocks;
            }
        }
        
        artifactElements.forEach((element, index) => {
            try {
                console.log(`Processando elemento ${index + 1}:`, element.tagName, element.className);
                
                const titleElement = element.querySelector('[data-testid="artifact-title"]') || 
                                   element.querySelector('.artifact-title') ||
                                   element.querySelector('h3, h2, h1') ||
                                   element.previousElementSibling?.querySelector('h1, h2, h3') ||
                                   element.closest('[class*="message"]')?.querySelector('h1, h2, h3');
                                   
                const title = titleElement?.textContent?.trim() || `Artifact_${index + 1}`;
                
                // Lógica mais flexível para encontrar conteúdo
                let contentElement = element;
                
                // Se o elemento atual é um container, procura conteúdo dentro
                if (element.querySelector('pre, code, svg, iframe')) {
                    contentElement = element.querySelector('pre code') || 
                                   element.querySelector('pre') ||
                                   element.querySelector('code') ||
                                   element.querySelector('svg') ||
                                   element.querySelector('iframe') ||
                                   element;
                }
                
                let content = '';
                let mimeType = 'text/plain';
                let language = '';
                
                console.log(`Elemento de conteúdo:`, contentElement.tagName, contentElement.className);
                
                if (contentElement.tagName === 'CODE' || contentElement.tagName === 'PRE') {
                    content = contentElement.textContent;
                    const classNames = contentElement.className;
                    const langMatch = classNames.match(/language-(\w+)/);
                    language = langMatch ? langMatch[1] : 'plaintext';
                    mimeType = 'application/vnd.ant.code';
                } else if (element.querySelector('svg')) {
                    const svgElement = element.querySelector('svg');
                    content = svgElement.outerHTML;
                    mimeType = 'image/svg+xml';
                } else if (element.querySelector('iframe')) {
                    const iframe = element.querySelector('iframe');
                    try {
                        content = iframe.contentDocument.documentElement.outerHTML;
                        mimeType = 'text/html';
                    } catch (e) {
                        console.warn('Cannot access iframe content due to CORS:', e);
                        content = '<!-- Content not accessible due to CORS restrictions -->';
                    }
                } else {
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

    function getFileExtension(artifact) {
        const { mimeType, language } = artifact;
        
        if (mimeType === 'application/vnd.ant.code') {
            return getCodeExtension(language);
        }
        
        const formats = {
            'text/markdown': '.md',
            'text/html': '.html',
            'image/svg+xml': '.svg',
            'application/json': '.json'
        };
        
        return formats[mimeType] || '.txt';
    }

    function loadJSZip() {
        return new Promise((resolve, reject) => {
            if (typeof JSZip !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('jszip.min.js');
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

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

    async function downloadAsZip(artifacts, options) {
        await loadJSZip();
        
        const zip = new JSZip();
        
        artifacts.forEach(artifact => {
            const filename = `${artifact.title}${getFileExtension(artifact)}`;
            zip.file(filename, artifact.content);
        });
        
        if (options.includeConversation) {
            const conversationText = extractConversationText();
            if (conversationText) {
                zip.file('conversation.md', conversationText);
            }
        }
        
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
        
        let filename = 'claude-artifacts.zip';
        if (options.addTimestamp) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            filename = `claude-artifacts-${timestamp}.zip`;
        }
        
        const content = await zip.generateAsync({type: 'blob'});
        downloadBlob(content, filename);
        
        return artifacts.length;
    }

    function downloadIndividualFiles(artifacts, options) {
        artifacts.forEach((artifact, index) => {
            setTimeout(() => {
                let filename = `${artifact.title}${getFileExtension(artifact)}`;
                if (options.addTimestamp) {
                    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                    const ext = getFileExtension(artifact);
                    filename = `${artifact.title}-${timestamp}${ext}`;
                }
                
                const blob = new Blob([artifact.content], { type: artifact.mimeType });
                downloadBlob(blob, filename);
            }, index * 1000);
        });
        
        if (options.includeConversation) {
            setTimeout(() => {
                const conversationText = extractConversationText();
                if (conversationText) {
                    let filename = 'conversation.md';
                    if (options.addTimestamp) {
                        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                        filename = `conversation-${timestamp}.md`;
                    }
                    const blob = new Blob([conversationText], { type: 'text/markdown' });
                    downloadBlob(blob, filename);
                }
            }, artifacts.length * 1000);
        }
        
        return artifacts.length;
    }

    async function downloadAllArtifacts(options = {}) {
        const artifacts = extractArtifacts();
        
        if (artifacts.length === 0) {
            throw new Error('Nenhum artefato encontrado nesta conversa');
        }
        
        if (options.zipFormat) {
            return await downloadAsZip(artifacts, options);
        } else {
            return downloadIndividualFiles(artifacts, options);
        }
    }

})();