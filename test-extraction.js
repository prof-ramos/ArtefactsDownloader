// Script de teste para validar extração de artefatos
// Execute este script no console (F12) do Claude AI para verificar se os artefatos estão sendo extraídos corretamente

console.log('🧪 TESTE DE EXTRAÇÃO DE ARTEFATOS');
console.log('================================');

// Função de teste simplificada baseada na lógica da extensão
function testExtractArtifacts() {
    const artifacts = [];
    
    // Primeiro, tenta o seletor oficial do Claude AI
    let artifactElements = document.querySelectorAll('[data-testid="artifact"]');
    console.log(`✅ Seletor principal "[data-testid="artifact"]": ${artifactElements.length} elementos`);
    
    // Se não encontrou, tenta seletores específicos
    if (artifactElements.length === 0) {
        const specificSelectors = ['.artifact', '[class*="artifact"]', '[data-component="artifact"]'];
        
        for (const selector of specificSelectors) {
            artifactElements = document.querySelectorAll(selector);
            console.log(`🔍 Seletor "${selector}": ${artifactElements.length} elementos`);
            if (artifactElements.length > 0) break;
        }
    }
    
    // Fallback filtrado
    if (artifactElements.length === 0) {
        console.log('⚠️ Aplicando fallback filtrado...');
        const potentialElements = document.querySelectorAll('pre code');
        
        artifactElements = Array.from(potentialElements).filter(element => {
            const content = element.textContent.trim();
            const parent = element.closest('div, article, section');
            
            return content.length > 20 && 
                   !parent?.querySelector('[data-testid="user-message"], [data-testid="assistant-message"]') &&
                   (content.includes('\n') || content.includes('{') || content.includes('function') || content.includes('def '));
        });
        
        console.log(`📋 Elementos filtrados: ${artifactElements.length}`);
    }
    
    // Análise detalhada de cada elemento
    artifactElements.forEach((element, index) => {
        console.log(`\n📦 ARTEFATO ${index + 1}:`);
        console.log('   Elemento:', element.tagName, element.className);
        
        // Busca título
        const titleElement = element.querySelector('[data-testid="artifact-title"]') || 
                           element.querySelector('.artifact-title') ||
                           element.querySelector('h3, h2, h1');
        const title = titleElement?.textContent?.trim() || `Artifact_${index + 1}`;
        console.log('   Título:', title);
        
        // Busca conteúdo
        let contentElement = null;
        
        if (element.hasAttribute('data-testid') && element.getAttribute('data-testid') === 'artifact') {
            contentElement = element.querySelector('pre code') || 
                           element.querySelector('code') ||
                           element.querySelector('pre') ||
                           element.querySelector('svg');
        } else if (element.tagName === 'CODE' || element.tagName === 'PRE') {
            contentElement = element;
        } else {
            contentElement = element.querySelector('pre code') || 
                           element.querySelector('code') ||
                           element.querySelector('pre');
        }
        
        if (contentElement) {
            const content = contentElement.textContent.trim();
            console.log('   Tipo de conteúdo:', contentElement.tagName);
            console.log('   Tamanho do conteúdo:', content.length, 'caracteres');
            console.log('   Preview (primeiras 100 chars):', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
            
            // Detecção de linguagem
            const classNames = contentElement.className;
            const langMatch = classNames.match(/language-(\w+)/);
            const language = langMatch ? langMatch[1] : 'plaintext';
            console.log('   Linguagem detectada:', language);
            
            artifacts.push({ title, content, language, element: contentElement });
        } else {
            console.log('   ❌ Nenhum conteúdo válido encontrado');
        }
    });
    
    console.log(`\n📊 RESUMO: ${artifacts.length} artefatos extraídos com sucesso`);
    return artifacts;
}

// Executa o teste
const testResults = testExtractArtifacts();

// Salva os resultados globalmente para inspeção
window.testArtifacts = testResults;

console.log('\n💡 Para inspecionar os resultados:');
console.log('   window.testArtifacts - Array com os artefatos encontrados');
console.log('   window.testArtifacts[0].content - Conteúdo do primeiro artefato');