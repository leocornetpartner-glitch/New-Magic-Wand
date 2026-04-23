// background.js
const CLOUD_RUN_URL = 'https://fnr-augmented-service-32677391621.europe-west1.run.app/generate'; 
// Collez votre NOUVEAU Client ID "Application Web" ici
const CLIENT_ID = '32677391621-bv4eu3sicn5qockp7eiqc8jvl7a94ir4.apps.googleusercontent.com'; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generate_solution") {
        const promptText = `You are an assistant for support engineers in Decathlon. By looking at the request detail and the documentation right here https://drive.google.com/drive/folders/1XPotmPx-AtONJS-WgAprcWAWC_yAW8TT you provide steps to follow for the support engineer that will manage the request, in 250 words maximum : ${request.description}`;

        const EXTENSION_ID = chrome.runtime.id; 
        const REDIRECT_URI = `https://${EXTENSION_ID}.chromiumapp.org/`;

        // L'URL magique qui demande spécifiquement un ID Token (response_type=id_token)
        const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=id_token&redirect_uri=${REDIRECT_URI}&scope=openid%20email&nonce=12345`;

        // Ouvre la fenêtre de connexion Google de manière universelle
        chrome.identity.launchWebAuthFlow({
            url: AUTH_URL,
            interactive: true
        }, function(redirectUrl) {
            if (chrome.runtime.lastError || !redirectUrl) {
                console.error("Erreur de connexion:", chrome.runtime.lastError);
                sendResponse({ error: "L'authentification a été annulée ou a échoué." });
                return;
            }

            // On découpe l'URL renvoyée pour récupérer l'ID Token
            const urlParams = new URLSearchParams(redirectUrl.split('#')[1]);
            const idToken = urlParams.get('id_token');

            if (!idToken) {
                sendResponse({ error: "Impossible de récupérer l'ID Token." });
                return;
            }

            // On attaque enfin Cloud Run avec le bon format de clé !
            fetch(CLOUD_RUN_URL, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${idToken}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ prompt: promptText })
            })
            .then(async (response) => {
                if (!response.ok) {
                    const textError = await response.text();
                    throw new Error(`Erreur Cloud Run ${response.status} : ${textError.substring(0, 50)}...`);
                }
                return response.json();
            })
.then(data => {
                // On vérifie si data.solution existe, sinon on affiche une erreur propre
                let solutionText = data.solution ? data.solution : "Erreur de format de réponse";
                sendResponse({ solution: solutionText });
            })
            .catch(err => {
                console.error("Erreur Fetch Cloud Run:", err);
                sendResponse({ error: err.message });
            });
        });

        return true; 
    }
});