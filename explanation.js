document.addEventListener('DOMContentLoaded', async function() {
    console.log('Explanation page loaded');
    const loadingElement = document.getElementById('loading');
    const explanationElement = document.getElementById('explanation');
    const selectedTextElement = document.getElementById('selectedText');

    function showError(message) {
        loadingElement.style.display = 'none';
        explanationElement.style.display = 'block';
        explanationElement.innerHTML = `<div style="color: red;">${message}</div>`;
    }

    try {
        // Récupérer les paramètres de l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const selectedText = urlParams.get('text');
        console.log('Selected text:', selectedText);
        
        if (!selectedText) {
            throw new Error('Aucun texte sélectionné');
        }

        selectedTextElement.textContent = `"${selectedText}"`;

        // Récupérer la clé API
        const apiKey = await new Promise((resolve, reject) => {
            chrome.storage.sync.get(['mistralApiKey'], function(result) {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result.mistralApiKey);
                }
            });
        });

        console.log('API Key retrieved:', apiKey ? 'Yes' : 'No');

        if (!apiKey) {
            throw new Error('Clé API Mistral non configurée. Veuillez la configurer dans les options de l\'extension.');
        }

        // Appel à l'API Mistral
        console.log('Calling Mistral API...');
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "mistral-tiny",
                messages: [
                    {
                        role: "user",
                        content: `Explique brièvement ce qu'est "${selectedText}" en français`
                    }
                ],
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Erreur API Mistral (${response.status}): ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('API response received');

        loadingElement.style.display = 'none';
        explanationElement.style.display = 'block';
        explanationElement.textContent = data.choices[0].message.content;

    } catch (error) {
        console.error('Error in explanation.js:', error);
        showError(`Erreur: ${error.message}`);
    }
});
