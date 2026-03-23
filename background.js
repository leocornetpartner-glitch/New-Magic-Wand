// background.js

// --- CONFIGURATION VERTEX AI ---
// IMPORTANT : Ces informations sont sensibles. Utilise l'authentification OAuth2 pour une vraie extension
// Pour un test local, tu peux utiliser une API Key Vertex AI, mais c'est moins sécurisé.
const PROJECT_ID = 'MON-PROJET-DECATHLON'; // Remplace par ton ID de projet GCP
const LOCATION = 'us-central1'; // Ou une région européenne si supportée par Gemini Pro
const MODEL_ID = 'gemini-pro'; // Ou le modèle spécifique pour Vertex AI

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generate_solution") {
        
        // Récupérer la clé API stockée de manière sécurisée (OAuth est mieux)
        chrome.storage.local.get(['vertexApiKey'], (result) => {
            if (!result.vertexApiKey) {
                sendResponse({ error: "Clé API Vertex AI manquante dans la configuration." });
                return;
            }

            const apiUrl = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:streamGenerateContent?key=${result.vertexApiKey}`;

            const prompt = `
                Tu es un expert support technique Decathlon pour le portail SMAX. 
                Voici la description d'un incident remonté par un collaborateur :
                ---
                ${request.description}
                ---
                Génère une solution claire, professionnelle et précise en français pour résoudre cet incident. 
                N'inclus pas de salutations introductives, va directement à la solution technique.
            `;

            const requestBody = {
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.4, // Moins créatif, plus factuel
                    maxOutputTokens: 1024
                }
            };

            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur API Vertex : ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Gemini stream renvoie un tableau de fragments
                const generatedText = data.map(fragment => fragment.candidates[0].content.parts[0].text).join('');
                sendResponse({ solution: generatedText });
            })
            .catch(error => {
                sendResponse({ error: error.message });
            });
        });

        // Nécessaire pour les réponses asynchrones
        return true; 
    }
});
