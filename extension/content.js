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
        
        // Primeiro, tenta o seletor oficial do Claude AI
        let artifactElements = document.querySelectorAll('[data-testid="artifact"]');
        console.log(`Seletor principal "[data-testid="artifact"]": encontrou ${artifactElements.length} elementos`);
        
        // Se não encontrou com o seletor principal, tenta outros seletores específicos de artefatos
        if (artifactElements.length === 0) {
            const specificSelectors = [
                '.artifact',
                '[class*="artifact"]',
                '[data-component="artifact"]',
                '.claude-artifact'
            ];
            
            for (const selector of specificSelectors) {
                artifactElements = document.querySelectorAll(selector);
                console.log(`Seletor específico "${selector}": encontrou ${artifactElements.length} elementos`);
                if (artifactElements.length > 0) break;
            }
        }
        
        // Apenas como último recurso, procura por blocos de código isolados
        // MAS aplica filtros para evitar capturar conteúdo incorreto
        if (artifactElements.length === 0) {
            console.log('Aplicando fallback com filtros...');
            const potentialElements = document.querySelectorAll('pre code');
            
            // Filtra apenas elementos que parecem ser artefatos reais
            artifactElements = Array.from(potentialElements).filter(element => {
                const content = element.textContent.trim();
                const parent = element.closest('div, article, section');
                
                // Critérios para considerar um artefato válido:
                // 1. Conteúdo mínimo (mais de 20 caracteres)
                // 2. Não está dentro de uma mensagem de chat (evita código de exemplo em conversas)
                // 3. Tem características de código estruturado
                return content.length > 20 && 
                       !parent?.querySelector('[data-testid="user-message"], [data-testid="assistant-message"]') &&
                       (content.includes('\n') || content.includes('{') || content.includes('function') || content.includes('def '));
            });
            
            console.log(`Elementos filtrados por critérios: ${artifactElements.length}`);
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
                
                // Lógica mais precisa para encontrar conteúdo
                let contentElement = null;
                let content = '';
                let mimeType = 'text/plain';
                let language = '';
                
                // Verifica se o elemento é um container de artefato oficial
                if (element.hasAttribute('data-testid') && element.getAttribute('data-testid') === 'artifact') {
                    // Para artefatos oficiais, busca o conteúdo específico
                    contentElement = element.querySelector('pre code') || 
                                   element.querySelector('code') ||
                                   element.querySelector('pre') ||
                                   element.querySelector('svg') ||
                                   element.querySelector('iframe');
                } else if (element.tagName === 'CODE' || element.tagName === 'PRE') {
                    // Se o elemento já é um bloco de código
                    contentElement = element;
                } else {
                    // Para outros containers, procura conteúdo
                    contentElement = element.querySelector('pre code') || 
                                   element.querySelector('code') ||
                                   element.querySelector('pre') ||
                                   element.querySelector('svg') ||
                                   element.querySelector('iframe');
                }
                
                if (!contentElement) {
                    console.warn(`Elemento ${index + 1}: Nenhum conteúdo válido encontrado`);
                    return;
                }
                
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
                
                // Validação de conteúdo antes de adicionar aos artefatos
                if (content.trim() && content.length > 10) {
                    // Evita capturar conteúdo que claramente não é um artefato
                    const isValidArtifact = !content.includes('claude_extension.json') && 
                                          !content.includes('popup.html') &&
                                          !content.includes('manifest.json') &&
                                          !content.includes('This may or may not be related');
                    
                    if (isValidArtifact) {
                        console.log(`✅ Artefato ${index + 1} adicionado: "${title}" (${content.length} chars)`);
                        artifacts.push({
                            title: sanitizeFilename(title),
                            content: content,
                            mimeType: mimeType,
                            language: language,
                            index: index + 1
                        });
                    } else {
                        console.log(`⚠️ Artefato ${index + 1} rejeitado: conteúdo parece ser metadados`);
                    }
                } else {
                    console.log(`⚠️ Artefato ${index + 1} rejeitado: conteúdo vazio ou muito pequeno`);
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