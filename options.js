document.addEventListener('DOMContentLoaded', function() {
    // Charger la clé API existante
    chrome.storage.sync.get(['mistralApiKey'], function(result) {
        if (result.mistralApiKey) {
            document.getElementById('mistralApiKey').value = result.mistralApiKey;
        }
    });

    // Gérer la sauvegarde
    document.getElementById('saveButton').addEventListener('click', function() {
        const apiKey = document.getElementById('mistralApiKey').value.trim();
        const status = document.getElementById('status');

        if (!apiKey) {
            showStatus('Veuillez entrer une clé API valide', 'error');
            return;
        }

        chrome.storage.sync.set({ mistralApiKey: apiKey }, function() {
            showStatus('Configuration sauvegardée !', 'success');
        });
    });

    function showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = 'status ' + type;
        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
});
