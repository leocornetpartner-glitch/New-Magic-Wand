// 1. Rétablissement de la fonction de communication avec Gemini
async function generateSolutionWithGemini(descriptionText) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "generate_solution", description: descriptionText }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response.solution);
            }
        });
    });
}

// 2. Fonction d'injection ciblée
function injectMagicButton() {
    // Dans SMAX, l'éditeur de solution est souvent dans une div avec l'ID cke_2
    // On va chercher toutes les boîtes à outils
    const toolboxes = document.querySelectorAll('.cke_toolbox');

    toolboxes.forEach((toolbox) => {
        // Vérification du label pour être sûr d'être sur "Solution"
        const voiceLabel = toolbox.previousElementSibling;
        const isSolution = voiceLabel && voiceLabel.textContent.trim().toLowerCase() === 'solution';

        if (isSolution) {
            // Sécurisation de la ligne 21 : on cherche le groupe de boutons
            const targetGroup = toolbox.querySelector('.cke_toolbar_last .cke_toolgroup');
            
            // Si le groupe existe et que notre baguette n'y est pas encore
            if (targetGroup && !targetGroup.querySelector('#cke_magic_wand')) {
                
                const iconUrl = chrome.runtime.getURL("baguetteMagique.png");
                
                const magicBtn = document.createElement('a');
                magicBtn.id = 'cke_magic_wand';
                magicBtn.className = 'cke_button cke_button_off';
                magicBtn.title = 'Demander à Gemini';
                magicBtn.style.cursor = 'pointer';
                magicBtn.innerHTML = `
                    <span class="cke_button_icon" style="background-image:url('${iconUrl}'); background-size:16px; background-position:center; background-repeat:no-repeat;">&nbsp;</span>
                    <span class="cke_button_label">Magie Gemini</span>
                `;

                magicBtn.onclick = async (e) => {
                    e.preventDefault();
                    
                    // Récupération de la description (ID plCkeditor1 dans ton HTML)
                    const descEditor = document.querySelector('#cke_plCkeditor1 .cke_wysiwyg_div');
                    const rawDescription = descEditor ? descEditor.innerText : "";

                    // Sélection de l'éditeur de destination (celui de cette toolbox)
                    const solutionEditor = toolbox.closest('.cke_inner').querySelector('.cke_wysiwyg_div');

                    if (solutionEditor && rawDescription) {
                        solutionEditor.innerHTML = "<p><em>🪄 Gemini analyse l'incident...</em></p>";
                        
                        try {
                            // Appel de la fonction IA
                            const result = await generateSolutionWithGemini(rawDescription);
                            solutionEditor.innerHTML = `<p>${result}</p>`;
                            solutionEditor.dispatchEvent(new Event('input', { bubbles: true }));
                        } catch (err) {
                            solutionEditor.innerHTML = `<p style="color:red;">Erreur : ${err.message}</p>`;
                        }
                    } else if (!rawDescription) {
                        alert("La description est vide !");
                    }
                };

                targetGroup.appendChild(magicBtn);
            }
        }
    });
}

// 3. Gestion du chargement dynamique
const observer = new MutationObserver(() => injectMagicButton());
observer.observe(document.body, { childList: true, subtree: true });

injectMagicButton();
