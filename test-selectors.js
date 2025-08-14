// Script de teste para verificar seletores DOM do Claude AI
// Execute este script no console do navegador (F12 → Console) em uma página claude.ai

console.log('🔍 TESTANDO SELETORES DOM DO CLAUDE AI');
console.log('=====================================');

const selectors = [
    // Seletores de artefatos
    '[data-testid="artifact"]',
    '.artifact',
    '[class*="artifact"]',
    
    // Seletores de código
    'pre code',
    '.language-javascript',
    '.language-python',
    '.language-typescript',
    
    // Seletores gerais
    'svg',
    'iframe',
    '.prose',
    
    // Seletores de conversa
    '[data-testid="conversation-turn"]',
    '[data-testid="user-message"]',
    '[data-testid="assistant-message"]',
    
    // Possíveis novos seletores
    '[data-component="artifact"]',
    '.claude-artifact',
    '.code-block',
    '.artifact-container'
];

console.log('Testando seletores...\n');

selectors.forEach(selector => {
    try {
        const elements = document.querySelectorAll(selector);
        const count = elements.length;
        const status = count > 0 ? '✅' : '❌';
        
        console.log(`${status} ${selector.padEnd(35)} → ${count} elementos`);
        
        if (count > 0 && count <= 3) {
            elements.forEach((el, i) => {
                console.log(`    ${i + 1}. ${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ').join('.') : ''}`);
            });
        }
    } catch (error) {
        console.log(`❌ ${selector.padEnd(35)} → ERRO: ${error.message}`);
    }
});

console.log('\n🎯 ANÁLISE DE ESTRUTURA DA PÁGINA:');
console.log('==================================');

// Analisa a estrutura geral da página
const bodyClasses = document.body.className;
const mainElement = document.querySelector('main, #root, .app, [role="main"]');

console.log('Body classes:', bodyClasses || 'nenhuma');
console.log('Elemento principal:', mainElement ? mainElement.tagName.toLowerCase() : 'não encontrado');

// Procura por elementos que podem conter artefatos
const possibleContainers = [
    'div[class*="conversation"]',
    'div[class*="message"]',
    'div[class*="response"]',
    'div[class*="content"]',
    '.prose',
    'article'
];

console.log('\n📦 POSSÍVEIS CONTAINERS:');
possibleContainers.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
        console.log(`✅ ${selector} → ${elements.length} elementos`);
    }
});

console.log('\n🔍 Para usar este diagnóstico:');
console.log('1. Execute este script em uma página do Claude AI com artefatos');
console.log('2. Copie os seletores que retornaram ✅ com elementos');
console.log('3. Atualize a extensão com os seletores corretos');