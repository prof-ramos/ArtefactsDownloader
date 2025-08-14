// Bookmarklet para Download Rápido de Artefatos Claude
// 
// INSTRUÇÕES DE USO:
// 1. Copie todo o código abaixo (versão minificada)
// 2. Crie um novo bookmark no seu navegador
// 3. Cole o código no campo URL do bookmark
// 4. Salve com nome "Download Claude Artifacts"
// 5. Use clicando no bookmark quando estiver em uma conversa Claude

// VERSÃO MINIFICADA PARA BOOKMARKLET:
javascript:(function(){const CONFIG={downloadDelay:1000,zipFilename:'claude-artifacts.zip',includeConversation:true};function getCodeExtension(language){const extensions={javascript:'.js',typescript:'.ts',python:'.py',java:'.java',cpp:'.cpp',c:'.c',csharp:'.cs',php:'.php',ruby:'.rb',go:'.go',rust:'.rs',bash:'.sh',sql:'.sql',yaml:'.yml',json:'.json',xml:'.xml',css:'.css',html:'.html',dockerfile:'.dockerfile',plaintext:'.txt'};return extensions[language?.toLowerCase()]||'.txt'}function extractArtifacts(){const artifacts=[];const artifactElements=document.querySelectorAll('[data-testid="artifact"]');artifactElements.forEach((element,index)=>{try{const titleElement=element.querySelector('[data-testid="artifact-title"]')||element.querySelector('.artifact-title')||element.querySelector('h3, h2, h1');const title=titleElement?.textContent?.trim()||`Artifact_${index+1}`;const contentElement=element.querySelector('pre code')||element.querySelector('pre')||element.querySelector('.artifact-content');if(!contentElement)return;let content='';let mimeType='text/plain';let language='';if(contentElement.tagName==='CODE'){content=contentElement.textContent;const classNames=contentElement.className;const langMatch=classNames.match(/language-(\w+)/);language=langMatch?langMatch[1]:'plaintext';mimeType='application/vnd.ant.code'}else if(element.querySelector('svg')){const svgElement=element.querySelector('svg');content=svgElement.outerHTML;mimeType='image/svg+xml'}else if(element.querySelector('iframe')){const iframe=element.querySelector('iframe');try{content=iframe.contentDocument.documentElement.outerHTML;mimeType='text/html'}catch(e){content='<!-- Content not accessible -->'}}else{content=contentElement.textContent||contentElement.innerHTML;mimeType='text/markdown'}if(content.trim()){artifacts.push({title:title.replace(/[^\w\s-]/g,'').replace(/\s+/g,'_').toLowerCase().substring(0,50),content:content,mimeType:mimeType,language:language,index:index+1})}}catch(error){console.error(`Erro ao processar artefato ${index+1}:`,error)}});return artifacts}function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url)}function downloadIndividualFiles(artifacts){artifacts.forEach((artifact,index)=>{setTimeout(()=>{let ext='.txt';if(artifact.mimeType==='application/vnd.ant.code'){ext=getCodeExtension(artifact.language)}else if(artifact.mimeType==='text/markdown'){ext='.md'}else if(artifact.mimeType==='text/html'){ext='.html'}else if(artifact.mimeType==='image/svg+xml'){ext='.svg'}const filename=`${artifact.title}${ext}`;const blob=new Blob([artifact.content],{type:artifact.mimeType});downloadBlob(blob,filename)},index*CONFIG.downloadDelay)})}const artifacts=extractArtifacts();if(artifacts.length===0){alert('Nenhum artefato encontrado nesta conversa.');return}const useZip=artifacts.length>3?confirm(`Encontrados ${artifacts.length} artefatos.\n\nBaixar como ZIP? (Recomendado para múltiplos arquivos)`):false;if(useZip){alert('Função ZIP não disponível no bookmarklet. Baixando arquivos individuais...')}downloadIndividualFiles(artifacts);console.log(`Download iniciado: ${artifacts.length} artefatos`)})();

// VERSÃO COMPLETA PARA DESENVOLVIMENTO:
javascript:(function() {
    'use strict';
    
    const CONFIG = {
        downloadDelay: 1000,
        zipFilename: 'claude-artifacts.zip',
        includeConversation: true
    };
    
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
    
    function extractArtifacts() {
        const artifacts = [];
        const artifactElements = document.querySelectorAll('[data-testid="artifact"]');
        
        artifactElements.forEach((element, index) => {
            try {
                const titleElement = element.querySelector('[data-testid="artifact-title"]') || 
                                   element.querySelector('.artifact-title') ||
                                   element.querySelector('h3, h2, h1');
                const title = titleElement?.textContent?.trim() || `Artifact_${index + 1}`;
                
                const contentElement = element.querySelector('pre code') || 
                                     element.querySelector('pre') ||
                                     element.querySelector('.artifact-content');
                
                if (!contentElement) return;
                
                let content = '';
                let mimeType = 'text/plain';
                let language = '';
                
                if (contentElement.tagName === 'CODE') {
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
                        content = '<!-- Content not accessible due to CORS -->';
                    }
                } else {
                    content = contentElement.textContent || contentElement.innerHTML;
                    mimeType = 'text/markdown';
                }
                
                if (content.trim()) {
                    artifacts.push({
                        title: title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').toLowerCase().substring(0, 50),
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
    
    function downloadIndividualFiles(artifacts) {
        artifacts.forEach((artifact, index) => {
            setTimeout(() => {
                let ext = '.txt';
                if (artifact.mimeType === 'application/vnd.ant.code') {
                    ext = getCodeExtension(artifact.language);
                } else if (artifact.mimeType === 'text/markdown') {
                    ext = '.md';
                } else if (artifact.mimeType === 'text/html') {
                    ext = '.html';
                } else if (artifact.mimeType === 'image/svg+xml') {
                    ext = '.svg';
                }
                
                const filename = `${artifact.title}${ext}`;
                const blob = new Blob([artifact.content], { type: artifact.mimeType });
                downloadBlob(blob, filename);
            }, index * CONFIG.downloadDelay);
        });
    }
    
    // Execução principal
    const artifacts = extractArtifacts();
    
    if (artifacts.length === 0) {
        alert('Nenhum artefato encontrado nesta conversa.');
        return;
    }
    
    const useZip = artifacts.length > 3 ? 
        confirm(`Encontrados ${artifacts.length} artefatos.\n\nBaixar como ZIP? (Recomendado para múltiplos arquivos)`) : 
        false;
    
    if (useZip) {
        alert('Função ZIP não disponível no bookmarklet. Baixando arquivos individuais...');
    }
    
    downloadIndividualFiles(artifacts);
    console.log(`Download iniciado: ${artifacts.length} artefatos`);
})();