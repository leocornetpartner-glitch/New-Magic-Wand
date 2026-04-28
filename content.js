// --- 0. UTILITAIRE DE FORMATAGE ---
function formatMarkdown(text) {
    if (!text) return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

// --- 1. COMMUNICATION AVEC LE BACKGROUND ----
async function generateSolutionWithGemini(contextText) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "generate_solution", description: contextText }, (response) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else if (response && response.error) reject(new Error(response.error));
            else resolve(response.solution);
        });
    });
}

// --- 2. EXTRACTION DES DONNÉES (CORRIGÉE POUR IGNORER LES CHAMPS CACHÉS) ---
function extractAllTicketData() {
    let contextData = "--- DONNÉES DU TICKET SMAX ---\n";
    
    document.querySelectorAll('.field-container').forEach(container => {
        // Ignorer les conteneurs invisibles laissés en mémoire par l'application SMAX
        if (container.offsetParent === null) return;

        const labelEl = container.querySelector('.label-text');
        if (!labelEl) return;
        
        const label = labelEl.textContent.trim().replace('*', '');
        let val = "";

        // Champs textes classiques
        const input = container.querySelector('input, select, .select2-chosen, [role="textbox"]');
        if (input) {
            val = input.value || input.innerText || input.textContent;
        }

        // Champs riches (CKEditor) comme la Description
        if (!val || val.trim() === "") {
            const richText = container.querySelector('.cke_wysiwyg_div');
            if (richText) val = richText.innerText;
        }

        if (val && val.trim()) {
            contextData += `${label}: ${val.trim()}\n`;
        }
    });
    return contextData;
}

// --- 3. INJECTION DE L'INTERFACE (CORRIGÉE) ---
function injectIAField() {
    // Si l'IA est déjà là sur cette page visible, on s'arrête
    if (document.getElementById('ia-answer-container')) return;

    // Récupérer UNIQUEMENT les labels VISIBLES sur l'écran actuel
    const labels = Array.from(document.querySelectorAll('.label-text'))
                        .filter(el => el.offsetParent !== null); 

    let targetNode = null;

    // A. Priorité : On cherche le label "Solution" pour s'insérer juste au-dessus
    const solutionLabel = labels.find(l => l.textContent.trim().toLowerCase() === 'solution' || l.textContent.trim().toLowerCase() === 'résolution');
    
    if (solutionLabel) {
        targetNode = solutionLabel.closest('.field-container');
    } else {
        // B. Repli : S'il n'y a pas de champ Solution, on cherche "Description" et on s'insère EN DESSOUS
        const descLabel = labels.find(l => l.textContent.trim().toLowerCase() === 'description');
        if (descLabel) {
            const descContainer = descLabel.closest('.field-container');
            // On cible l'élément DOM suivant pour s'insérer après
            targetNode = descContainer ? descContainer.nextElementSibling : null;
        }
    }

    // Si la page charge encore et qu'on ne trouve rien, on abandonne (le setInterval réessaiera 1s plus tard)
    if (!targetNode || !targetNode.parentNode) return;

    // CONTENEUR PRINCIPAL
    const iaRowContainer = document.createElement('div');
    iaRowContainer.id = 'ia-answer-container';
    iaRowContainer.className = 'field-container clearfix clear-both full-width rich-text-field-type';
    iaRowContainer.style.marginBottom = "15px";

    iaRowContainer.innerHTML = `
        <div class="label-container" style="width: 193.56px; float: left;">
            <label><span class="label-text" style="color: #0078d4; font-weight: bold;">IA Suggestion</span></label>
        </div>
        <div class="control-container" style="overflow: hidden; display: block;">
            <div style="box-sizing: border-box; width: 100%; border: 1.5px solid #0078d4; border-radius: 4px; background-color: #f3f9ff; padding: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 11px; color: #666; font-style: italic;">Gemini Support</span>
                    <button id="ia-generate-btn" type="button" style="cursor: pointer; padding: 4px 12px; background: #0078d4; color: white; border: none; border-radius: 3px; font-size: 12px; font-weight: 500;">
                        <img src="${chrome.runtime.getURL("baguetteMagique.png")}" style="width:14px; vertical-align:middle; margin-right:5px;"> Générer une solution
                    </button>
                </div>
                <div id="ia-answer-text" 
                     contenteditable="true" 
                     style="box-sizing: border-box; width: 100%; min-height: 150px; border: 1px solid #ccc; border-radius: 3px; padding: 12px; font-family: 'Segoe UI', sans-serif; font-size: 13px; resize: vertical; overflow-y: auto; background: white; white-space: pre-wrap; line-height: 1.5;">Cliquez sur 'Générer'...</div>
            </div>
        </div>
    `;

    // CONTENEUR FEEDBACK
    const feedbackRowContainer = document.createElement('div');
    feedbackRowContainer.id = 'ia-feedback-container';
    feedbackRowContainer.className = 'field-container clearfix clear-both full-width';
    feedbackRowContainer.style.cssText = "display: none; margin-top: 10px; margin-bottom: 20px;";

    feedbackRowContainer.innerHTML = `
        <div style="width: 193.56px; float: left;"></div>
        <div class="control-container" style="overflow: hidden; padding-left: 5px;">
            <div style="display: flex; align-items: center; gap: 15px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9; box-sizing: border-box;">
                <span style="font-size: 13px; color: #333; font-weight: 500;">La réponse de l'IA était-elle pertinente ?</span>
                <button id="ia-feedback-yes" type="button" style="cursor: pointer; padding: 4px 15px; background: #ffffff; color: #28a745; border: 1px solid #28a745; border-radius: 3px; font-size: 12px; font-weight: bold;">Oui</button>
                <button id="ia-feedback-no" type="button" style="cursor: pointer; padding: 4px 15px; background: #ffffff; color: #dc3545; border: 1px solid #dc3545; border-radius: 3px; font-size: 12px; font-weight: bold;">Non</button>
                <span id="ia-feedback-thanks" style="font-size: 12px; color: #28a745; display: none;">Merci pour votre retour !</span>
            </div>
        </div>
    `;

    // Insertion
    targetNode.parentNode.insertBefore(iaRowContainer, targetNode);
    targetNode.parentNode.insertBefore(feedbackRowContainer, targetNode);

    // --- NOUVELLE VARIABLE POUR STOCKER LA RÉPONSE DE L'IA ---
    let currentAiResponseText = "";

    // Événements
    document.getElementById('ia-generate-btn').onclick = async (e) => {
        e.preventDefault();
        const iaDisplay = document.getElementById('ia-answer-text');
        const feedbackRow = document.getElementById('ia-feedback-container');
        iaDisplay.innerText = "🪄 Gemini analyse les données du ticket...";
        
        currentAiResponseText = ""; 
        
        try {
            const result = await generateSolutionWithGemini(extractAllTicketData());
            
            // On sauvegarde le texte brut
            currentAiResponseText = result; 
            
            iaDisplay.innerHTML = formatMarkdown(result); 
            feedbackRow.style.display = "block";
        } catch (err) {
            iaDisplay.innerText = "Erreur : " + err.message;
            iaDisplay.style.color = "red";
        }
    };

    // Fonction utilitaire pour extraire l'ID du ticket depuis l'URL de la page
    const getTicketId = () => {
        const match = location.href.match(/\/saw\/.*request\/(\d+)/i);
        return match ? match[1] : null;
    };

    // --- NOUVEAU COMPORTEMENT DU BOUTON (SANS FETCH) ---
    const handleFeedback = async (isUseful) => {
        const ticketId = getTicketId();
        
        // Construction du message avec le préfixe ET la réponse de l'IA
        const feedbackPrefix = isUseful ? "<b>[BoT] L'ingénieur support a jugé cette réponse UTILE :</b><br><br>" : "<b>[BoT] L'ingénieur support a jugé cette réponse INUTILE :</b><br><br>";
        const fullCommentText = feedbackPrefix + (currentAiResponseText || "Aucune réponse enregistrée.");

        const container = document.getElementById('ia-feedback-yes').parentElement;
        container.innerHTML = '<span style="font-size: 12px; color: #0078d4;">Enregistrement SMAX...</span>';

        // Envoi au background.js qui se chargera de l'auth et de la requête
        chrome.runtime.sendMessage({ 
            action: "send_feedback", 
            ticketId: ticketId, 
            feedbackText: fullCommentText 
        }, (response) => {
            if (chrome.runtime.lastError) {
                container.innerHTML = `<span style="font-size: 12px; color: #dc3545;">Erreur interne: ${chrome.runtime.lastError.message}</span>`;
            } else if (response && response.error) {
                container.innerHTML = `<span style="font-size: 12px; color: #dc3545;">Erreur: ${response.error}</span>`;
            } else {
                container.innerHTML = '<span style="font-size: 12px; color: #28a745;">Feedback enregistré sur SMAX !</span>';
            }
        });
    };

    // On attache la fonction aux boutons en passant 'true' (Oui) ou 'false' (Non)
    document.getElementById('ia-feedback-yes').onclick = () => handleFeedback(true);
    document.getElementById('ia-feedback-no').onclick = () => handleFeedback(false);
}

// --- 4. MOTEUR DE DÉTECTION ---
let lastUrl = location.href;
function mainLoop() {
    // Si l'URL change, on détruit l'ancien conteneur
    if (location.href !== lastUrl) {
        const oldIA = document.getElementById('ia-answer-container');
        const oldFeed = document.getElementById('ia-feedback-container');
        if (oldIA) oldIA.remove();
        if (oldFeed) oldFeed.remove();
        lastUrl = location.href;
    }

    // REGEX ultra-stricte : S'active UNIQUEMENT si l'URL contient un ID de ticket
    if (/\/saw\/.*request\/\d+/i.test(location.href)) {
        injectIAField();
    }
}

// Vérification toutes les secondes
setInterval(mainLoop, 1000);
// Lancement immédiat
mainLoop();