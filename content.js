function addMagicButton() {
    // On cible le dernier groupe d'outils de CKEditor
    const targetToolbar = document.querySelector('.cke_toolbar_last .cke_toolgroup');

    // On vérifie si la barre existe et si notre bouton n'est pas déjà là
    if (targetToolbar && !document.getElementById('cke_magic_wand')) {
        
        const iconUrl = chrome.runtime.getURL("baguetteMagique.png");
        
        // Création de l'élément bouton en copiant le style natif
        const magicBtn = document.createElement('a');
        magicBtn.id = 'cke_magic_wand';
        magicBtn.className = 'cke_button cke_button_off';
        magicBtn.title = 'Baguette Magique Decathlon';
        magicBtn.innerHTML = `
            <span class="cke_button_icon" style="background-image:url('${iconUrl}'); background-size:16px; background-position:center; background-repeat:no-repeat;">&nbsp;</span>
            <span class="cke_button_label">Magie</span>
        `;

        // Action au clic
        magicBtn.onclick = () => {
            alert("🪄 Magie Decathlon activée !");
            // Ici, tu pourras ajouter le code pour remplir le champ texte
        };

        targetToolbar.appendChild(magicBtn);
    }
}

// Surveillance du chargement de la page (CKEditor arrive souvent après le DOM)
const observer = new MutationObserver(() => {
    addMagicButton();
});

observer.observe(document.body, { childList: true, subtree: true });
