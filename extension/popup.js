document.addEventListener('DOMContentLoaded', function() {
    const downloadButton = document.getElementById('downloadAll');
    const scanButton = document.getElementById('scanArtifacts');
    const statusDiv = document.getElementById('status');
    
    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = `status status-${type}`;
        statusDiv.style.display = 'block';
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }
    
    function getOptions() {
        return {
            includeConversation: document.getElementById('includeConversation').checked,
            zipFormat: document.getElementById('zipFormat').checked,
            addTimestamp: document.getElementById('addTimestamp').checked
        };
    }
    
    scanButton.addEventListener('click', async function() {
        showStatus('Scanning for artifacts...', 'info');
        
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            console.log('Tab ativa:', tab.url);
            
            if (!tab.url.includes('claude.ai')) {
                showStatus('Please navigate to claude.ai first', 'error');
                return;
            }
            
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'scanArtifacts'
            });
            
            console.log('Resposta do content script:', response);
            
            if (response && response.success) {
                showStatus(`Found ${response.count} artifacts`, 'success');
            } else if (response && response.error) {
                showStatus(`Error: ${response.error}`, 'error');
            } else {
                showStatus('No artifacts found', 'error');
            }
        } catch (error) {
            console.error('Erro detalhado:', error);
            if (error.message.includes('receiving end does not exist')) {
                showStatus('Please refresh the Claude AI page and try again.', 'error');
            } else if (error.message.includes('Could not establish connection')) {
                showStatus('Extension not ready. Please refresh the page.', 'error');
            } else {
                showStatus(`Error: ${error.message}`, 'error');
            }
        }
    });
    
    downloadButton.addEventListener('click', async function() {
        showStatus('Starting download...', 'info');
        
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            if (!tab.url.includes('claude.ai')) {
                showStatus('Please navigate to claude.ai first', 'error');
                return;
            }
            
            const options = getOptions();
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'downloadArtifacts',
                options: options
            });
            
            if (response.success) {
                showStatus(`Downloaded ${response.count} artifacts`, 'success');
            } else {
                showStatus(response.error || 'Download failed', 'error');
            }
        } catch (error) {
            console.error('Erro detalhado no download:', error);
            if (error.message.includes('receiving end does not exist')) {
                showStatus('Please refresh the Claude AI page and try again.', 'error');
            } else if (error.message.includes('Could not establish connection')) {
                showStatus('Extension not ready. Please refresh the page.', 'error');
            } else {
                showStatus(`Error: ${error.message}`, 'error');
            }
        }
    });
});