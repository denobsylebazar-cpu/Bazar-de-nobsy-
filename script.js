
// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwiZXQiOiJwcm9kdWN0cyJ9';
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
    const { data: products, error } = await db.from('products').select('*').order('created_at', { ascending: false });
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
            const admin = document.body.classList.contains('admin-open');

            gridElement.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">

                    ${admin ? `
                    <input type="checkbox"
                        class="product-checkbox"
                        value="${product.id}"
                        onchange="updateDeleteButton()"
                        style="display:block; margin:10px auto; width:20px; height:20px;">
                    ` : ''}

                    <div class="product-image">
                        <img src="${product.image_url}" onerror="this.src='https://via.placeholder.com/150'">
                    </div>

                    <div class="product-body">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <p class="product-price">
                            <strong class="price">${product.price}$</strong>
                        </p>

                        <button class="btn-hero"
                            style="max-width:100%;"
                            onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">
                            Commander
                        </button>
                    </div>
                </div>
            `);
        }
    });

    // TRI : Remonter les sections pleines
    const container = document.querySelector('#produits .container');
    const sectionsIds = ['pop', 'jeuxvideo', 'livre', 'film', 'decoration', 'vaisselle', 'bijoux', 'jeux', 'peluche', 'vetement', 'maquillage', 'lumiere'];

    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        const grid = document.getElementById('grid-' + id);

        if (section && grid && grid.children.length > 0) {
            container.prepend(section);
            section.style.display = "block";
        }
    });
}

/* ========== FILTRES ========== */
window.filterByCategory = function(cat) {
    const ids = ['pop','jeuxvideo','livre','film','decoration','vaisselle','bijoux','jeux','peluche','vetement','maquillage','lumiere'];

    ids.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = 'none';
    });

    const selected = document.getElementById(cat);

    if (selected) {
        selected.style.display = 'block';
        window.scrollTo({ top: selected.offsetTop - 130, behavior: 'smooth' });
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

        // Afficher les cases de sélection sans recharger les produits
        document.querySelectorAll('.product-card').forEach(card => {
            if (!card.querySelector('.product-checkbox')) {
                const id = card.getAttribute('data-id');

                card.insertAdjacentHTML('afterbegin', `
                    <input type="checkbox"
                        class="product-checkbox"
                        value="${id}"
                        onchange="updateDeleteButton()"
                        style="display:block; margin:10px auto; width:20px; height:20px;">
                `);
            }
        });

        afficherBoutonSuppression();

        adminSection.scrollIntoView({ behavior: 'smooth' });

    } else {
        alert("Code PIN incorrect");
    }
};

/* ========== BOUTON SUPPRESSION MULTIPLE ========== */
function afficherBoutonSuppression() {
    if (document.getElementById('btnDeleteSelected')) return;

    const button = document.createElement('button');

    button.id = 'btnDeleteSelected';
    button.className = 'btn-hero';
    button.style.maxWidth = '100%';
    button.style.marginTop = '15px';
    button.style.background = '#dc3545';
    button.innerText = '🗑️ Supprimer les produits sélectionnés';

    button.onclick = supprimerProduitsSelectionnes;

    document.getElementById('admin').appendChild(button);
}

/* ========== COMPTEUR ========== */
window.updateDeleteButton = function() {
    const selected = document.querySelectorAll('.product-checkbox:checked');
    const button = document.getElementById('btnDeleteSelected');

    if (!button) return;

    button.innerText = selected.length
        ? `🗑️ Supprimer ${selected.length} produit${selected.length > 1 ? 's' : ''}`
        : '🗑️ Supprimer les produits sélectionnés';
};

/* ========== SUPPRESSION MULTIPLE ========== */
window.supprimerProduitsSelectionnes = async function() {
    const selected = document.querySelectorAll('.product-checkbox:checked');

    if (selected.length === 0) {
        alert("Sélectionne au moins un produit.");
        return;
    }

    if (!confirm(`Voulez-vous supprimer ${selected.length} produit${selected.length > 1 ? 's' : ''} ?`)) {
        return;
    }

    const ids = Array.from(selected).map(c => c.value);

    const button = document.getElementById('btnDeleteSelected');
    button.disabled = true;
    button.innerText = "⏳ Suppression...";

    try {
        for (const id of ids) {
            const { error } = await db.rpc('delete_product_secure', {
                prod_id: id,
                pin_code: "200611"
            });

            if (error) throw error;
        }

        ids.forEach(id => {
            const card = document.querySelector(`.product-card[data-id="${id}"]`);
            if (card) card.remove();
        });

        alert("Produit(s) supprimé(s) avec succès !");

        updateDeleteButton();

    } catch (error) {
        alert("Erreur : " + error.message);
    }

    button.disabled = false;
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

            await db.storage.from('product-images').upload(fileName, file);

            const { data: linkData } = db.storage
                .from('product-images')
                .getPublicUrl(fileName);

            await db.from('products').insert([{
                name: document.getElementById('nomProduit').value,
                description: document.getElementById('descProduit').value,
                price: parseFloat(document.getElementById('prixProduit').value),
                image_url: linkData.publicUrl,
                category: document.getElementById('categorieProduit').value
            }]);

            alert("Produit publié ! ✅");

            form.reset();
            document.getElementById('admin').style.display = 'none';

            chargerProduits();

        } catch (err) {
            alert(err.message);
        }

        finally {
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
            document.getElementById('imagePreview').src = URL.createObjectURL(file);
        }
    };
}

document.addEventListener('DOMContentLoaded', chargerProduits);
```

