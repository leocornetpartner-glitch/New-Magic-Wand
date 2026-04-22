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


function injectMagicButton() {
    // Ciblage exclusif du conteneur de l'éditeur SOLUTION
    // D'après votre code HTML, l'ID est cke_plCkeditor0
    const solutionWrapper = document.getElementById('cke_plCkeditor0');

    if (solutionWrapper) {
        // On cherche la barre d'outils à l'intérieur de cet éditeur précis
        const targetGroup = solutionWrapper.querySelector('.cke_toolbar_last .cke_toolgroup');
        
        if (targetGroup && !targetGroup.querySelector('#cke_magic_wand')) {
            const iconUrl = chrome.runtime.getURL("baguetteMagique.png");
            
            const magicBtn = document.createElement('a');
            magicBtn.id = 'cke_magic_wand';
            magicBtn.className = 'cke_button cke_button_off magic-wand-btn';
            magicBtn.title = 'Demander une solution à Gemini (Vertex AI)';
            magicBtn.style.cursor = "pointer";
            magicBtn.innerHTML = `
                <span class="cke_button_icon" style="background-image:url('${iconUrl}'); background-size:16px; background-position:center; background-repeat:no-repeat;">&nbsp;</span>
                <span class="cke_button_label">Magie Gemini</span>
            `;

            magicBtn.onclick = async (e) => {
                e.preventDefault();
                
                // Récupération sécurisée de la DESCRIPTION (plCkeditor1)
                const descEditor = document.querySelector('#cke_plCkeditor1 .cke_wysiwyg_div');
                // On nettoie les symboles ¤§¤ pour l'IA
                const rawDescription = descEditor ? descEditor.innerText.replace(/¤§¤/g, ' | ') : "";

                // Cible SOLUTION (l'éditeur où on a cliqué)
                const solutionEditor = solutionWrapper.querySelector('.cke_wysiwyg_div');

                if (solutionEditor && rawDescription) {
                    solutionEditor.innerHTML = "<p><em>🪄 Gemini rédige une réponse sécurisée...</em></p>";
                    try {
                        const result = await generateSolutionWithGemini(rawDescription);
                        solutionEditor.innerHTML = `<p>${result}</p>`;
                        solutionEditor.dispatchEvent(new Event('input', { bubbles: true }));
                    } catch (err) {
                        solutionEditor.innerHTML = `<p style="color:red;">Erreur : ${err.message}</p>`;
                    }
                } else {
                    alert("Le champ Description semble vide.");
                }
            };

            targetGroup.appendChild(magicBtn);
        }
    }
}

// Surveillance du DOM pour SMAX
const observer = new MutationObserver(() => injectMagicButton());
observer.observe(document.body, { childList: true, subtree: true });

injectMagicButton();