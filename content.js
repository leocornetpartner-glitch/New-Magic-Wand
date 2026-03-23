// content.js

// Variable pour stocker la clé API (à récupérer de manière sécurisée)
let vertexAiKey = '';

function injectMagicButton() {
    // 1. On cherche toutes les toolbars CKEditor
    const toolbars = document.querySelectorAll('.cke_toolbox');

    toolbars.forEach((toolbar) => {
        // 2. On cherche le label vocal juste avant cette toolbar
        const voiceLabel = toolbar.previousElementSibling;
        
        // 3. On vérifie si c'est bien la toolbar pour "Solution"
        // et que notre bouton n'est pas déjà présent
        if (voiceLabel && 
            voiceLabel.textContent.trim().toLowerCase() === 'solution' && 
            !toolbar.querySelector('.magic-wand-btn')) {
            
            // On cherche le groupe avec le bouton image pour insérer à côté
            const targetGroup = toolbar.querySelector('.cke_toolbar_last .cke_toolgroup');
            
            if (targetGroup) {
                const iconUrl = chrome.runtime.getURL("baguetteMagique.png");
                
                // Création du bouton
                const magicBtn = document.createElement('a');
                magicBtn.className = 'cke_button cke_button_off magic-wand-btn';
                magicBtn.title = 'Demander à Gemini une solution';
                magicBtn.style.cursor = "pointer";
                magicBtn.innerHTML = `
                    <span class="cke_button_icon" style="background-image:url('${iconUrl}'); background-size:16px; background-position:center; background-repeat:no-repeat;">&nbsp;</span>
                    <span class="cke_button_label">Magie</span>
                `;

                // --- ACTION AU CLIC ---
                magicBtn.onclick = async (e) => {
                    e.preventDefault();
                    
                    // 1. Trouver l'éditeur de solution pour y écrire
                    const container = toolbar.closest('.cke_inner');
                    const editableSolution = container.querySelector('.cke_wysiwyg_div');
                    
                    // 2. Trouver l'éditeur de description pour y lire
                    // Il faut remonter au parent commun et chercher la description
                    const mainEditorContainer = toolbar.closest('#cke_67'); // ID parent de l'éditeur 'Solution' dans ton HTML
                    let descriptionText = '';
                    
                    if (mainEditorContainer) {
                        // Chercher l'éditeur de description (supposons qu'il a l'ID parent #cke_1 dans ton HTML)
                        const editableDescription = document.querySelector('#cke_1 .cke_wysiwyg_div');
                        if (editableDescription) {
                            descriptionText = editableDescription.innerText;
                        }
                    }

                    if (!descriptionText) {
                        alert("Impossible de lire la description de l'incident.");
                        return;
                    }

                    if (editableSolution) {
                        // Afficher un statut de chargement
                        editableSolution.innerHTML = '<p><em>La baguette magique réfléchit...</em></p>';
                        
                        try {
                            // 3. APPEL IA (voir Partie 2 ci-dessous)
                            const solutionAi = await generateSolutionWithGemini(descriptionText);
                            
                            // 4. Afficher la solution générée
                            editableSolution.innerHTML = solutionAi;
                            // Signaler le changement à CKEditor
                            editableSolution.dispatchEvent(new Event('input', { bubbles: true }));
                        } catch (error) {
                            editableSolution.innerHTML = `<p style="color:red;">Erreur lors de la génération : ${error.message}</p>`;
                        }
                    }
                };

                targetGroup.appendChild(magicBtn);
            }
        }
    });
}

// Surveillance des changements du DOM (SMAX est dynamique)
const observer = new MutationObserver(() => injectMagicButton());
observer.observe(document.body, { childList: true, subtree: true });

// Lancement au chargement
injectMagicButton();
