function addMagicButton() {
    const targetToolbar = document.querySelector('.cke_toolbar_last .cke_toolgroup');

    if (targetToolbar && !document.getElementById('cke_magic_wand')) {
        const iconUrl = chrome.runtime.getURL("baguetteMagique.png");
        
        const magicBtn = document.createElement('a');
        magicBtn.id = 'cke_magic_wand';
        magicBtn.className = 'cke_button cke_button_off';
        magicBtn.title = 'Insérer le template Decathlon';
        magicBtn.style.cursor = "pointer";
        magicBtn.innerHTML = `
            <span class="cke_button_icon" style="background-image:url('${iconUrl}'); background-size:16px; background-position:center; background-repeat:no-repeat;">&nbsp;</span>
            <span class="cke_button_label">Magie</span>
        `;

        // L'ACTION DE MAGIE :
        magicBtn.onclick = () => {
            // 1. Définir ton template (tu peux utiliser du HTML)
            const template = `
                <p>Bonjour,</p>
                <p>Merci d'avoir contacté le support Decathlon. J'ai bien pris note de votre demande concernant <strong>[Sujet]</strong>.</p>
                <p>Sportivement,<br>L'équipe Support</p>
            `;

            // 2. Trouver l'iframe de CKEditor
            // CKEditor utilise souvent une iframe pour le corps du texte
            const editorIframe = document.querySelector('iframe.cke_wysiwyg_frame');
            
            if (editorIframe) {
                const editorDoc = editorIframe.contentDocument || editorIframe.contentWindow.document;
                const editorBody = editorDoc.querySelector('body');

                if (editorBody) {
                    // On ajoute le texte à la fin (ou on remplace tout avec editorBody.innerHTML = template)
                    editorBody.innerHTML += template;
                    
                    // Optionnel : On remet le focus dans l'éditeur
                    editorBody.focus();
                }
            } else {
                // Si ce n'est pas une iframe, c'est peut-être un div editable directement
                const editableDiv = document.querySelector('.cke_editable');
                if (editableDiv) {
                    editableDiv.innerHTML += template;
                }
            }
        };

        targetToolbar.appendChild(magicBtn);
    }
}

// Surveillance du chargement
const observer = new MutationObserver(() => addMagicButton());
observer.observe(document.body, { childList: true, subtree: true });
