```javascript
// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ3hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ========== MENU MOBILE ========== */
window.toggleMenu = function() {
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.toggle('active');
};

/* ========== TIROIR CATALOGUE ========== */
window.toggleCatalogue = function() {
    const content = document.getElementById('catContent');
    if (content) content.classList.toggle('active');
};

/* ========== CHARGEMENT & TRI ========== */
async function chargerProduits() {
    const { data: products, error } = await db
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    products.forEach(product => {
        let cat = product.category.toLowerCase().trim();
        let targetId = "grid-decoration";

        if (cat.includes("vaisselle")) targetId = "grid-vaisselle";
        else if (cat.includes("bijoux")) targetId = "grid-bijoux";
        else if (cat.includes("pop")) targetId = "grid-pop";
        else if (cat.includes("livre")) targetId = "grid-livre";
        else if (cat.includes("jeuxvideo")) targetId = "grid-jeuxvideo";
        else if (cat.includes("film")) targetId = "grid-film";
        else if (cat.includes("jeux") || cat.includes("casse")) targetId = "grid-jeux";
        else if (cat.includes("peluche")) targetId = "grid-peluche";
        else if (cat.includes("vetement")) targetId = "grid-vetement";
        else if (cat.includes("maquillage")) targetId = "grid-maquillage";
        else if (cat.includes("lumiere")) targetId = "grid-lumiere";

        const gridElement = document.getElementById(targetId);

        if (gridElement) {
            const showX = document.body.classList.contains('admin-open') ? 'block' : 'none';

            gridElement.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">

                    <div class="admin-select-product" style="display:${showX};">
                        <input 
                            type="checkbox" 
                            class="product-checkbox"
                            value="${product.id}"
                            onchange="updateDeleteButton()"
                        >
                        <span>Sélectionner</span>
                    </div>

                    <div class="product-image">
                        <img 
                            src="${product.image_url}" 
                            onerror="this.src='https://via.placeholder.com/150'"
                        >
                    </div>

                    <div class="product-body">
                        <h3 class="product-name">${product.name}</h3>

                        <p class="product-description">
                            ${product.description}
                        </p>

                        <p class="product-price">
                            <strong class="price">${product.price}$</strong>
                        </p>

                        <button 
                            class="btn-hero" 
                            style="max-width:100%;" 
                            onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')"
                        >
                            Commander
                        </button>
                    </div>
                </div>
            `);
        }
    });

    // TRI : Remonter les sections pleines
    const container = document.querySelector('#produits .container');

    const sectionsIds = [
        'pop',
        'jeuxvideo',
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

    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        const grid = document.getElementById('grid-' + id);

        if (section && grid && grid.children.length > 0) {
            container.prepend(section);
            section.style.display = "block";
        }
    });

    updateDeleteButton();
}

/* ========== FILTRES ========== */
window.filterByCategory = function(cat) {
    const ids = [
        'pop',
        'jeuxvideo',
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

    ids.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = 'none';
    });

    const selected = document.getElementById(cat);

    if (selected) {
        selected.style.display = 'block';

        window.scrollTo({
            top: selected.offsetTop - 130,
            behavior: 'smooth'
        });
    }

    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';

    if (document.getElementById('catContent')) {
        document.getElementById('catContent').classList.remove('active');
    }
};

window.showAllCategories = function() {
    chargerProduits();

    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};

/* ========== ADMIN ========== */
window.verifierPin = function() {
    const pin = document.getElementById('inputPin').value;

    if (pin === "200611") {

        const adminSection = document.getElementById('admin');

        adminSection.style.display = 'block';

        document.getElementById('popupPin').style.display = 'none';

        document.body.classList.add('admin-open');

        // Afficher les sélections
        document.querySelectorAll('.admin-select-product').forEach(el => {
            el.style.display = 'block';
        });

        // Afficher le bouton de suppression multiple
        afficherBoutonSuppression();

        // Recharger les produits pour afficher les cases
        chargerProduits();

        // Défilement automatique vers le formulaire
        adminSection.scrollIntoView({
            behavior: 'smooth'
        });

    } else {
        alert("Code PIN incorrect");
    }
};

/* ========== BOUTON SUPPRESSION MULTIPLE ========== */

function afficherBoutonSuppression() {

    if (document.getElementById('btnDeleteSelected')) return;

    const adminSection = document.getElementById('admin');

    const button = document.createElement('button');

    button.id = 'btnDeleteSelected';
    button.className = 'btn-hero';
    button.style.maxWidth = '100%';
    button.style.marginTop = '15px';
    button.style.background = '#dc3545';
    button.style.display = 'block';

    button.innerHTML = '🗑️ Supprimer les produits sélectionnés';

    button.onclick = supprimerProduitsSelectionnes;

    adminSection.appendChild(button);
}

/* ========== COMPTER LES PRODUITS SÉLECTIONNÉS ========== */

window.updateDeleteButton = function() {

    const checkboxes = document.querySelectorAll('.product-checkbox:checked');

    const button = document.getElementById('btnDeleteSelected');

    if (!button) return;

    if (checkboxes.length > 0) {
        button.style.display = 'block';
        button.innerHTML =
            `🗑️ Supprimer ${checkboxes.length} produit${checkboxes.length > 1 ? 's' : ''} sélectionné${checkboxes.length > 1 ? 's' : ''}`;
    } else {
        button.innerHTML = '🗑️ Supprimer les produits sélectionnés';
    }
};

/* ========== SUPPRESSION MULTIPLE ========== */

window.supprimerProduitsSelectionnes = async function() {

    const checkboxes = document.querySelectorAll('.product-checkbox:checked');

    if (checkboxes.length === 0) {
        alert("Sélectionne au moins un produit.");
        return;
    }

    const ids = Array.from(checkboxes).map(checkbox => checkbox.value);

    const confirmation = confirm(
        `Voulez-vous vraiment supprimer ${ids.length} produit${ids.length > 1 ? 's' : ''} ?`
    );

    if (!confirmation) return;

    const button = document.getElementById('btnDeleteSelected');

    if (button) {
        button.disabled = true;
        button.innerText = "⏳ Suppression...";
    }

    try {

        // Suppression de chaque produit avec la fonction sécurisée Supabase
        for (const id of ids) {

            const { error } = await db.rpc('delete_product_secure', {
                prod_id: id,
                pin_code: "200611"
            });

            if (error) {
                throw error;
            }
        }

        alert(
            `${ids.length} produit${ids.length > 1 ? 's' : ''} supprimé${ids.length > 1 ? 's' : ''} avec succès !`
        );

        // Recharger la liste
        await chargerProduits();

    } catch (error) {

        alert("Erreur lors de la suppression : " + error.message);

    } finally {

        if (button) {
            button.disabled = false;
            updateDeleteButton();
        }
    }
};

/* ========== AJOUTER PRODUIT ========== */
const form = document.getElementById('formAjoutProduit');

if (form) {

    form.onsubmit = async function(e) {

        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');

        const file = document.getElementById('imageProduit').files[0];

        if (!file) return alert("Photo requise");

        submitBtn.disabled = true;
        submitBtn.innerText = "⏳ Envoi...";

        try {

            const fileName = Date.now() + "-" + file.name;

            await db.storage
                .from('product-images')
                .upload(fileName, file);

            const { data: linkData } = db.storage
                .from('product-images')
                .getPublicUrl(fileName);

            await db.from('products').insert([{

                name: document.getElementById('nomProduit').value,

                description: document.getElementById('descProduit').value,

                price: parseFloat(
                    document.getElementById('prixProduit').value
                ),

                image_url: linkData.publicUrl,

                category: document.getElementById('categorieProduit').value

            }]);

            alert("Produit publié ! ✅");

            form.reset();

            document.getElementById('admin').style.display = 'none';

            chargerProduits();

        } catch (err) {

            alert(err.message);

        } finally {

            submitBtn.disabled = false;

            submitBtn.innerText = "🚀 Publier";
        }
    };
}

/* ========== APERÇU IMAGE ========== */

const imgInput = document.getElementById('imageProduit');

if (imgInput) {

    imgInput.onchange = function() {

        const [file] = this.files;

        if (file) {

            document.getElementById('preview-container').style.display = 'block';

            document.getElementById('imagePreview').src =
                URL.createObjectURL(file);
        }
    };
}

/* ========== CHARGEMENT INITIAL ========== */

document.addEventListener(
    'DOMContentLoaded',
    chargerProduits
);
```

