
async function generateSolutionWithGemini(descriptionText) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "generate_solution", description: descriptionText }, (response) => {
            if (response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response.solution);
            }
        });
    });
}
let vertexAiKey = '';
function injectMagicButton() {
    // 1. On cherche toutes les boîtes à outils de l'éditeur
    const toolboxes = document.querySelectorAll('.cke_toolbox');

    toolboxes.forEach((toolbox) => {
        // 2. On remonte au parent pour trouver le label de cette section
        // Dans ton HTML, le label "Solution" est dans .cke_voice_label juste avant la toolbox
        const voiceLabel = toolbox.previousElementSibling;
        
        if (voiceLabel && voiceLabel.textContent.trim() === "Solution") {
            // 3. On cible le groupe d'outils où se trouve l'icône image
            const targetGroup = toolbox.querySelector('.cke_toolbar_last .cke_toolgroup');
            
            // On vérifie si notre bouton n'existe pas déjà
            if (targetGroup && !targetGroup.querySelector('#cke_magic_wand')) {
                
                const iconUrl = chrome.runtime.getURL("baguetteMagique.png");
                
                const magicBtn = document.createElement('a');
                magicBtn.id = 'cke_magic_wand';
                magicBtn.className = 'cke_button cke_button_off';
                magicBtn.title = 'Générer une réponse avec Gemini';
                magicBtn.style.cursor = 'pointer';
                magicBtn.innerHTML = `
                    <span class="cke_button_icon" style="background-image:url('${iconUrl}'); background-size:16px; background-position:center; background-repeat:no-repeat;">&nbsp;</span>
                    <span class="cke_button_label">Magie Gemini</span>
                `;

                magicBtn.onclick = async (e) => {
                    e.preventDefault();
                    
                    // Récupération de la description pour l'envoyer à l'IA
                    // On cherche le contenu du premier éditeur (Description)
                    const descEditor = document.querySelector('#cke_plCkeditor1 .cke_wysiwyg_div');
                    const descriptionText = descEditor ? descEditor.innerText : "";

                    // On cherche l'éditeur de destination (Solution)
                    const solutionEditor = toolbox.closest('.cke_inner').querySelector('.cke_wysiwyg_div');

                    if (solutionEditor && descriptionText) {
                        solutionEditor.innerHTML = "<p><em>🪄 Gemini rédige la solution...</em></p>";
                        
                        // Appel au background script (Gemini)
                        chrome.runtime.sendMessage({
                            action: "generate_solution",
                            description: descriptionText
                        }, (response) => {
                            if (response && response.solution) {
                                solutionEditor.innerHTML = response.solution;
                                solutionEditor.dispatchEvent(new Event('input', { bubbles: true }));
                            } else {
                                solutionEditor.innerHTML = "<p style='color:red;'>Erreur : impossible de contacter l'IA.</p>";
                            }
                        });
                    } else if (!descriptionText) {
                        alert("Le champ Description est vide. Gemini a besoin de texte pour travailler !");
                    }
                };

                targetGroup.appendChild(magicBtn);
            }
        }
    });
}

// Surveillance continue car SMAX recharge les composants dynamiquement
const observer = new MutationObserver(() => injectMagicButton());
observer.observe(document.body, { childList: true, subtree: true });

// Premier essai au chargement
injectMagicButton();
