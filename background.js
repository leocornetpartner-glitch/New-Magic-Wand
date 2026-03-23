// background.js

// --- CONFIGURATION VERTEX AI ---
// IMPORTANT : Ces informations sont sensibles. Utilise l'authentification OAuth2 pour une vraie extension
// Pour un test local, tu peux utiliser une API Key Vertex AI, mais c'est moins sécurisé.
const PROJECT_ID = 'project-id-1814974603426480963'; // Remplace par ton ID de projet GCP
const LOCATION = 'europe-west9'; // Ou une région européenne si supportée par Gemini Pro
const MODEL_ID = 'gemini-1.5-flash'; // Ou le modèle spécifique pour Vertex AI

const API_KEY = 'AIzaSyB9uu7_HwcVm2V0NgWTs7C5jAIx0JEvqng'; // Ta clé API Vertex

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generate_solution") {
        
        // URL spécifique pour l'API Gemini via Vertex AI avec une clé API
        const apiUrl = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:streamGenerateContent?key=${API_KEY}`;

        const prompt = `Tu es un expert support chez Decathlon. 
        Analyse ce ticket et propose une solution courte et technique : ${request.description}`;

        const requestBody = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        };

        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            // On concatène les morceaux de texte reçus (si stream)
            const solutionText = data.map(c => c.candidates[0].content.parts[0].text).join('');
            sendResponse({ solution: solutionText });
        })
        .catch(error => sendResponse({ error: error.message }));

        return true; // Garde le canal de communication ouvert pour l'asynchrone
    }
});
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
