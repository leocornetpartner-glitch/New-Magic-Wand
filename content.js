// --- 0. UTILITAIRE DE FORMATAGE ---
function formatMarkdown(text) {
    if (!text) return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

// --- 1. COMMUNICATION AVEC LE BACKGROUND ---
async function generateSolutionWithGemini(contextText) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "generate_solution", description: contextText }, (response) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else if (response && response.error) reject(new Error(response.error));
            else resolve(response.solution);
        });
    });
}

// --- 2. EXTRACTION DES DONNÉES ---
function extractAllTicketData() {
    let contextData = "--- DONNÉES DU TICKET SMAX ---\n";
    document.querySelectorAll('.field-container').forEach(container => {
        const label = container.querySelector('.label-text')?.textContent.trim().replace('*', '');
        const input = container.querySelector('input, select, .select2-chosen, [role="textbox"]');
        if (label && input) {
            let val = input.value || input.innerText || input.textContent;
            if (val && val.trim()) contextData += `${label}: ${val.trim()}\n`;
        }
    });
    // On cherche la description dans le deuxième éditeur (CKEditor 1)
    const desc = document.querySelector('#cke_plCkeditor1 .cke_wysiwyg_div, #plCkeditor1')?.innerText;
    if (desc) contextData += `\nDescription:\n${desc.replace(/¤§¤/g, ' | ')}\n`;
    return contextData;
}

// --- 3. INJECTION DE L'INTERFACE ---
function injectIAField() {
    // On essaie de cibler l'éditeur de résolution (plCkeditor0)
    const solutionWrapper = document.getElementById('cke_plCkeditor0') || document.getElementById('plCkeditor0');
    
    // Si l'élément n'est pas encore là ou si l'IA est déjà injectée, on s'arrête
    if (!solutionWrapper || document.getElementById('ia-answer-container')) return;

    // A. CONTENEUR PRINCIPAL (Cadrage 193px pour SMAX)
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

    // B. CONTENEUR FEEDBACK
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

    // C. INSERTION DANS LE DOM
    const solutionRow = solutionWrapper.closest('.field-container') || solutionWrapper;
    if (solutionRow && solutionRow.parentNode) {
        solutionRow.parentNode.insertBefore(iaRowContainer, solutionRow);
        solutionRow.parentNode.insertBefore(feedbackRowContainer, solutionRow);
    }

    // --- LOGIQUE INTERACTIVE ---
    const generateBtn = document.getElementById('ia-generate-btn');
    const iaDisplay = document.getElementById('ia-answer-text');
    const feedbackRow = document.getElementById('ia-feedback-container');

    if (generateBtn) {
        generateBtn.onclick = async (e) => {
            e.preventDefault();
            iaDisplay.innerText = "🪄 Gemini analyse les données du ticket...";
            try {
                const result = await generateSolutionWithGemini(extractAllTicketData());
                iaDisplay.innerHTML = formatMarkdown(result); 
                feedbackRow.style.display = "block";
            } catch (err) {
                iaDisplay.innerText = "Erreur : " + err.message;
                iaDisplay.style.color = "red";
            }
        };
    }

    const yesBtn = document.getElementById('ia-feedback-yes');
    const noBtn = document.getElementById('ia-feedback-no');
    if (yesBtn && noBtn) {
        const handleFeedback = () => {
            const container = yesBtn.parentElement;
            if (container) container.innerHTML = '<span style="font-size: 12px; color: #28a745;">Merci pour votre retour !</span>';
        };
        yesBtn.onclick = handleFeedback;
        noBtn.onclick = handleFeedback;
    }
}

// --- 4. MOTEUR DE DÉTECTION ---
let lastUrl = location.href;
function mainLoop() {
    // Si on change de ticket, on nettoie pour permettre une ré-injection
    if (location.href !== lastUrl) {
        const oldIA = document.getElementById('ia-answer-container');
        const oldFeed = document.getElementById('ia-feedback-container');
        if (oldIA) oldIA.remove();
        if (oldFeed) oldFeed.remove();
        lastUrl = location.href;
    }

    // On injecte si l'URL contient "Requests" (sensible à la casse de SMAX)
    if (location.href.toLowerCase().includes('/request')) {
        injectIAField();
    }
}

// Vérification toutes les secondes
setInterval(mainLoop, 1000);
// Lancement immédiat
mainLoop();