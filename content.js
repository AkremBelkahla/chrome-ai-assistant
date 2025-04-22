let popup = null;
let isProcessing = false;

async function getMistralExplanation(text) {
    console.log('Début getMistralExplanation');
    try {
        const apiKey = await new Promise((resolve, reject) => {
            chrome.storage.sync.get(['mistralApiKey'], function(result) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result.mistralApiKey);
                }
            });
        });

        if (!apiKey) {
            throw new Error('Clé API Mistral non configurée. Configurez-la dans les options.');
        }

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
                        content: `Explique brièvement ce qu'est "${text}" en français`
                    }
                ],
                max_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur API (${response.status})`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
}

function showPopup(text, x, y) {
    // Supprimer l'ancienne popup si elle existe
    if (popup) {
        document.body.removeChild(popup);
    }

    // Créer la nouvelle popup
    popup = document.createElement('div');
    popup.innerHTML = `
        <div style="
            position: fixed;
            z-index: 10000;
            left: ${x}px;
            top: ${y}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            max-width: 300px;
            font-family: Arial, sans-serif;
        ">
            <button id="explainButton" style="
                width: 100%;
                padding: 8px;
                margin-bottom: 10px;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            ">Expliquer "${text}"</button>
            <div id="result" style="
                display: none;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #eee;
                font-size: 14px;
                line-height: 1.4;
            "></div>
        </div>
    `;

    // Ajouter la popup au document
    document.body.appendChild(popup);

    // Gérer le clic sur le bouton
    const button = popup.querySelector('#explainButton');
    const result = popup.querySelector('#result');

    button.onclick = async () => {
        if (isProcessing) return;
        
        try {
            console.log('Clic sur le bouton détecté');
            isProcessing = true;
            button.disabled = true;
            button.style.opacity = '0.7';
            
            result.style.display = 'block';
            result.innerHTML = '<div style="text-align: center;">Chargement...</div>';

            const explanation = await getMistralExplanation(text);
            result.innerHTML = explanation;
        } catch (error) {
            result.innerHTML = `<div style="color: red;">${error.message}</div>`;
        } finally {
            isProcessing = false;
            button.disabled = false;
            button.style.opacity = '1';
        }
    };

    // Gérer la fermeture de la popup
    document.addEventListener('mousedown', function closePopup(e) {
        if (popup && !popup.contains(e.target)) {
            document.body.removeChild(popup);
            popup = null;
            document.removeEventListener('mousedown', closePopup);
        }
    });
}

// Gérer la sélection de texte
document.addEventListener('mouseup', function(event) {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text) {
        console.log('Texte sélectionné:', text);
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const x = Math.min(rect.left + window.scrollX, window.innerWidth - 320);
        const y = rect.bottom + window.scrollY + 5;
        
        showPopup(text, x, y);
    }
});
