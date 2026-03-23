function injectMagicButtons() {
    // On cherche tous les groupes d'outils qui contiennent le bouton "Image"
    const toolGroups = document.querySelectorAll('.cke_toolgroup');

    toolGroups.forEach((group) => {
        // On vérifie si ce groupe contient déjà notre baguette pour ne pas doubler l'injection
        if (group.querySelector('.cke_button__image') && !group.querySelector('#cke_magic_wand')) {
            
            const iconUrl = chrome.runtime.getURL("baguetteMagique.png");
            
            // Création du bouton
            const magicBtn = document.createElement('a');
            magicBtn.id = 'cke_magic_wand'; // Note : si plusieurs éditeurs, utiliser une classe plutôt qu'un ID unique
            magicBtn.className = 'cke_button cke_button_off magic-wand-btn';
            magicBtn.title = 'Baguette Magique Decathlon';
            magicBtn.innerHTML = `
                <span class="cke_button_icon" style="background-image:url('${iconUrl}'); background-size:16px; background-position:center; background-repeat:no-repeat;">&nbsp;</span>
                <span class="cke_button_label">Magie</span>
            `;

            // Action au clic
            magicBtn.onclick = (e) => {
                e.preventDefault();
                
                // On remonte au parent pour trouver l'éditeur correspondant à ce bouton précis
                const container = group.closest('.cke_inner');
                const editableDiv = container.querySelector('.cke_wysiwyg_div');

                if (editableDiv) {
                    const template = `
                        <p>Bonjour,</p>
                        <p>L'ouverture du magasin a bien été enregistrée.</p>
                        <p>Sportivement.</p>
                    `;
                    // On insère le texte
                    editableDiv.innerHTML += template;
                    // On déclenche un événement input pour que CKEditor sache que le contenu a changé
                    editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
                }
            };

            group.appendChild(magicBtn);
        }
    });
}

// L'interface de SMAX est dynamique, on surveille les changements du DOM
const observer = new MutationObserver(() => injectMagicButtons());
observer.observe(document.body, { childList: true, subtree: true });

// Premier passage au chargement
injectMagicButtons();
