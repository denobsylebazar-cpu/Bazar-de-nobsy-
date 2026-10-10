
/* ========== 1. CONFIGURATION SUPABASE ========== */
const SUPABASE_URL = 'https://grrlsfvttancthbnysyn.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycmxzZnZ0dGFuY3RoYm55c3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODk0NTcsImV4cCI6MjEwNjg2NTQ1N30.TBbrrvddtKjNQApbKXD6zrIzHL9TaujqEMLelfCxWxA';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/* ========== MENU HAMBURGER ========== */
window.toggleMenu = function() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
};


/* ========== LISTE DES CATÉGORIES ========== */
const sectionsIds = [
    'pop',
    'jeuxvideo',
    'skylander',
    'livre',
    'film',
    'decoration',
    'vaisselle',
    'bijoux',
    'jeux',
    'peluche',
    'vetement',
    'maquillage',
    'lumiere'
];


/* ========== CHARGEMENT ET TRI DES SECTIONS ========== */
async function chargerProduits() {
    console.log("Mise à jour du catalogue...");

    const { data: products, error } = await db
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur de chargement:", error.message);
        alert("Erreur Supabase : " + error.message);
        return;
    }

    // Vider toutes les grilles
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    // Vérifier si on est en mode admin
    const isAdmin = document.body.classList.contains('admin-open');
    const displayStyle = isAdmin ? 'block' : 'none';

    // Remplir les grilles
    products.forEach(product => {

        let cat = (product.category || '').toLowerCase().trim();
        let targetId = "grid-decoration";

        // Skylanders doit être séparé des jeux vidéo
        if (cat.includes("skylander")) {
            targetId = "grid-skylander";
        }
        else if (cat.includes("vaisselle")) {
            targetId = "grid-vaisselle";
        }
        else if (cat.includes("bijoux")) {
            targetId = "grid-bijoux";
        }
        else if (cat.includes("pop")) {
            targetId = "grid-pop";
        }
        else if (cat.includes("livre")) {
            targetId = "grid-livre";
        }
        else if (cat.includes("jeuxvideo")) {
            targetId = "grid-jeuxvideo";
        }
        else if (cat.includes("film")) {
            targetId = "grid-film";
        }
        else if (cat.includes("jeux") || cat.includes("casse")) {
            targetId = "grid-jeux";
        }
        else if (cat.includes("peluche")) {
            targetId = "grid-peluche";
        }
        else if (cat.includes("vetement")) {
            targetId = "grid-vetement";
        }
        else if (cat.includes("maquillage")) {
            targetId = "grid-maquillage";
        }
        else if (cat.includes("lumiere")) {
            targetId = "grid-lumiere";
        }

        const gridElement = document.getElementById(targetId);

        if (gridElement) {
            gridElement.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">

                    <input
                        type="checkbox"
                        class="select-product-checkbox"
                        value="${product.id}"
                        style="display: ${displayStyle}"
                    >

                    <button
                        class="btn-delete-product"
                        style="display: ${displayStyle}"
                        onclick="handleDeleteProduct(event)"
                    >✕</button>

                    <div class="product-image">
                        <img
                            src="${product.image_url || 'https://via.placeholder.com/150'}"
                            alt="${product.name || ''}"
                            onerror="this.src='https://via.placeholder.com/150'"
                        >
                    </div>

                    <div class="product-body">
                        <h3 class="product-name">${product.name || ''}</h3>

                        <p class="product-description">${product.description || ''}</p>

                        <p class="product-price">
                            <strong>${product.price ?? ''}$</strong>
                        </p>

                        <button
                            class="btn"
                            onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')"
                        >Commander</button>
                    </div>
                </div>
            `);
        }
    });

    // TRI DES SECTIONS
    const container = document.querySelector('#produits .container');

    if (container) {
        sectionsIds.forEach(id => {
            const section = document.getElementById(id);
            const grid = document.getElementById('grid-' + id);

            if (section && grid) {
                if (grid.children.length > 0) {
                    container.prepend(section);
                    section.style.display = "block";
                } else {
                    container.appendChild(section);
                    section.style.display = "none";
                }
            }
        });
    }

    // Réappliquer la recherche après le chargement
    appliquerRecherche();
}


/* ========== CATALOGUE DU BAS ========== */
window.toggleCatalogue = function() {
    const content = document.getElementById('catContent');
    if (content) content.classList.toggle('active');
};


/* ========== FILTRAGE PAR CATÉGORIE ========== */
window.filterByCategory = function(cat) {

    const recherche = document.getElementById('rechercheProduit');
    if (recherche) recherche.value = '';

    sectionsIds.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = 'none';
    });

    const selected = document.getElementById(cat);

    if (selected) {
        selected.style.display = 'block';

        window.scrollTo({
            top: selected.offsetTop - 120,
            behavior: 'smooth'
        });
    }

    const backButton = document.getElementById('category-back-button');
    const defaultTitle = document.getElementById('default-title');

    if (backButton) backButton.style.display = 'block';
    if (defaultTitle) defaultTitle.style.display = 'none';

    const content = document.getElementById('catContent');
    if (content) content.classList.remove('active');
};


/* ========== AFFICHER TOUTES LES CATÉGORIES ========== */
window.showAllCategories = function() {
    const recherche = document.getElementById('rechercheProduit');
    if (recherche) recherche.value = '';

    chargerProduits();

    const backButton = document.getElementById('category-back-button');
    const defaultTitle = document.getElementById('default-title');

    if (backButton) backButton.style.display = 'none';
    if (defaultTitle) defaultTitle.style.display = 'block';
};


/* ========== AJOUTER UN PRODUIT ========== */
const form = document.getElementById('formAjoutProduit');

if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const fileInput = document.getElementById('imageProduit');
        const file = fileInput?.files?.[0];

        if (!file) return alert("Choisis une photo !");

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "⏳ Envoi...";
        }

        try {
            const fileName = Date.now() + "-" + file.name;

            const { error: uploadError } = await db.storage
                .from('product-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: linkData } = db.storage
                .from('product-images')
                .getPublicUrl(fileName);

            const { error: insertError } = await db
                .from('products')
                .insert([{
                    name: document.getElementById('nomProduit').value,
                    description: document.getElementById('descProduit').value,
                    price: parseFloat(document.getElementById('prixProduit').value),
                    image_url: linkData.publicUrl,
                    category: document.getElementById('categorieProduit').value
                }]);

            if (insertError) throw insertError;

            alert("Produit publié ! ✅");

            form.reset();

            const preview = document.getElementById('preview-container');
            if (preview) preview.style.display = 'none';

            await chargerProduits();

        } catch (err) {
            console.error("Erreur ajout produit :", err);
            alert("Erreur lors de la publication : " + err.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "🚀 Publier";
            }
        }
    };
}


/* ========== GESTION ADMIN & SUPPRESSION ========== */

// Vérification du PIN admin avec Supabase
window.verifierPin = async function() {
    const input = document.getElementById('inputPin');

    if (!input) {
        alert("Champ PIN introuvable.");
        return;
    }

    const pin = input.value.trim();

    if (!/^\d{6}$/.test(pin)) {
        alert("Veuillez entrer un PIN de 6 chiffres.");
        return;
    }

    try {
        const { data, error } = await db.rpc('verify_admin_pin', {
            pin_code: pin
        });

        if (error) {
            console.error("Erreur vérification PIN :", error);
            alert("Erreur Supabase : " + error.message);
            return;
        }

        if (data !== true) {
            alert("Code PIN incorrect !");
            input.value = "";
            input.focus();
            return;
        }

        const admin = document.getElementById('admin');
        const popupPin = document.getElementById('popupPin');
        const bulkButton = document.getElementById('btn-bulk-delete');

        if (admin) admin.style.display = 'block';
        if (popupPin) popupPin.style.display = 'none';
        if (bulkButton) bulkButton.style.display = 'inline-block';

        document.body.classList.add('admin-open');

        await chargerProduits();

        if (admin) {
            admin.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        console.error("Erreur inattendue :", err);
        alert("Une erreur est survenue : " + (err.message || err));
    }
};


// Suppression sécurisée d'un produit
window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');

    if (!card) {
        alert("Impossible de trouver le produit à supprimer.");
        return;
    }

    const id = card.getAttribute('data-id');

    if (!id) {
        alert("Identifiant du produit introuvable.");
        return;
    }

    const pin = prompt("Entrez le code PIN pour supprimer :");

    if (!pin) return;

    try {
        const { data, error } = await db.rpc('delete_product_secure', {
            prod_id: Number(id),
            pin_code: pin.trim()
        });

        if (error) {
            console.error("Erreur Supabase lors de la suppression :", error);
            alert("Échec de la suppression :\n" + error.message);
            return;
        }

        if (data !== true) {
            alert("Suppression refusée : PIN incorrect ou produit introuvable.");
            return;
        }

        card.style.transition = "transform 300ms ease, opacity 300ms ease";
        card.style.transform = "scale(0)";
        card.style.opacity = "0";

        setTimeout(() => card.remove(), 300);

        alert("Produit supprimé avec succès !");

    } catch (err) {
        console.error("Erreur inattendue :", err);
        alert("Une erreur inattendue est survenue :\n" + (err.message || err));
    }
};


/* ========== SUPPRESSION GROUPÉE ========== */
window.deleteSelectedProducts = async function() {
    const checkboxes = document.querySelectorAll(
        '.select-product-checkbox:checked'
    );

    if (checkboxes.length === 0) {
        return alert("Aucun produit sélectionné");
    }

    const pin = prompt(
        `Supprimer ${checkboxes.length} produits ? Entrez le code PIN :`
    );

    if (!pin) return;

    let successCount = 0;

    for (const cb of checkboxes) {
        const { data, error } = await db.rpc('delete_product_secure', {
            prod_id: Number(cb.value),
            pin_code: pin.trim()
        });

        if (!error && data === true) successCount++;
    }

    if (successCount > 0) {
        alert(`${successCount} produit(s) supprimé(s).`);
        await chargerProduits();
    } else {
        alert("Erreur ou PIN incorrect.");
    }
};


/* ========== RECHERCHE RAPIDE DE PRODUITS ========== */

function appliquerRecherche() {
    const rechercheInput = document.getElementById('rechercheProduit');
    if (!rechercheInput) return;

    const recherche = rechercheInput.value.trim().toLowerCase();

    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        if (!section) return;

        const cartes = section.querySelectorAll('.product-card');
        let cartesVisibles = 0;

        cartes.forEach(carte => {
            const nom = carte.querySelector('.product-name');

            const correspond = !recherche ||
                (nom && nom.textContent.toLowerCase().includes(recherche));

            carte.style.display = correspond ? '' : 'none';

            if (correspond) cartesVisibles++;
        });

        section.style.display = cartesVisibles > 0 ? 'block' : 'none';
    });

    const defaultTitle = document.getElementById('default-title');
    const backButton = document.getElementById('category-back-button');

    if (recherche) {
        if (defaultTitle) defaultTitle.style.display = 'none';
        if (backButton) backButton.style.display = 'block';
    } else {
        if (defaultTitle) defaultTitle.style.display = 'block';
        if (backButton) backButton.style.display = 'none';
    }
}

const rechercheProduit = document.getElementById('rechercheProduit');

if (rechercheProduit) {
    rechercheProduit.addEventListener('input', appliquerRecherche);
}


/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', () => {

    const btnAdmin = document.getElementById('btnAdmin');

    if (btnAdmin) {
        btnAdmin.onclick = () => {
            const popupPin = document.getElementById('popupPin');
            if (popupPin) popupPin.style.display = 'flex';
        };
    }

    const backBtn = document.getElementById('backToCatalogBtn');

    if (backBtn) {
        backBtn.onclick = window.showAllCategories;
    }

    // Aperçu image
    const imgInput = document.getElementById('imageProduit');

    if (imgInput) {
        imgInput.onchange = function() {
            const file = this.files?.[0];

            if (file) {
                const previewContainer = document.getElementById('preview-container');
                const imagePreview = document.getElementById('imagePreview');

                if (previewContainer) previewContainer.style.display = 'block';
                if (imagePreview) imagePreview.src = URL.createObjectURL(file);
            }
        };
    }

    chargerProduits();
});
