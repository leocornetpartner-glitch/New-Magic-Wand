

async function generateSolutionWithGemini(descriptionText) {
    // On envoie le texte au Service Worker pour qu'il gère l'appel API
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
    const toolbars = document.querySelectorAll('.cke_toolbox');
    toolbars.forEach((toolbar) => {
        const voiceLabel = toolbar.previousElementSibling;
        if (voiceLabel && 
            voiceLabel.textContent.trim().toLowerCase() === 'solution' && 
            !toolbar.querySelector('.magic-wand-btn')) 
            const targetGroup = toolbar.querySelector('.cke_toolbar_last .cke_toolgroup');
            
            if (targetGroup) {
                const iconUrl = chrome.runtime.getURL("baguetteMagique.png");
                const magicBtn = document.createElement('a');
                magicBtn.className = 'cke_button cke_button_off magic-wand-btn';
                magicBtn.title = 'Demander à Gemini une solution';
                magicBtn.style.cursor = "pointer";
                magicBtn.innerHTML = `
                    <span class="cke_button_icon" style="background-image:url('${iconUrl}'); background-size:16px; background-position:center; background-repeat:no-repeat;">&nbsp;</span>
                    <span class="cke_button_label">Magie</span>
                `;
                magicBtn.onclick = async (e) => {
                    e.preventDefault();
                    const container = toolbar.closest('.cke_inner');
                    const editableSolution = container.querySelector('.cke_wysiwyg_div');
                    const mainEditorContainer = toolbar.closest('#cke_67');
                    let descriptionText = '';
                    if (mainEditorContainer) {
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
                        editableSolution.innerHTML = '<p><em>La baguette magique réfléchit...</em></p>';
                        
                        try {
                            const solutionAi = await generateSolutionWithGemini(descriptionText);
                            editableSolution.innerHTML = solutionAi;
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
const observer = new MutationObserver(() => injectMagicButton());
observer.observe(document.body, { childList: true, subtree: true });
injectMagicButton();
// content.js (fin du fichier)
