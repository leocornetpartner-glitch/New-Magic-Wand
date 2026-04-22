// background.js
const PROJECT_ID = 'fnr-supp-aug-vpc-inix'; 
const LOCATION = 'europe-west1'; 
const MODEL_ID = 'gemini-2.5-flash';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generate_solution") {
const apiUrl = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:generateContent`;
        
        fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", // C'est cette ligne qui manque dans ton payload actuel !
                    parts: [{ text: `You are an assistant for support engineers in Decathlon. By looking at the request detail and the documentation right here https://drive.google.com/drive/folders/1XPotmPx-AtONJS-WgAprcWAWC_yAW8TT to provide steps to follow for the support engineer that will manage the request : ${request.description}` }] }]
            })
        })
        .then(response => response.json())
.then(data => {
    console.log("Data received from VERTEX:", data); // Pour vérifier dans la console du Service Worker

    let solutionText = "";

    // Test de la structure standard Vertex AI
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        solutionText = data.candidates[0].content.parts[0].text;
    } 
    // Test si c'est un tableau (format stream)
    else if (Array.isArray(data) && data[0].candidates) {
        solutionText = data.map(chunk => chunk.candidates[0].content.parts[0].text).join('');
    }
    // Si une erreur est encapsulée dans le JSON
    else if (data.error) {
        solutionText = "Erreur API : " + data.error.message;
    } else {
        solutionText = "Format de réponse inconnu (voir console Service Worker)";
    }

    sendResponse({ solution: solutionText });
})
.catch(err => {
    console.error("Erreur Fetch:", err);
    sendResponse({ error: "Erreur réseau ou Token expiré : " + err.message });
});

        return true; // Obligatoire pour éviter l'erreur de canal fermé
    }
});
