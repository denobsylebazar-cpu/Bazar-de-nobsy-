/* ========== 1. CONFIGURATION SUPABASE - NOUVELLE BASE ========== */
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
        return;
    }

    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    const isAdmin = document.body.classList.contains('admin-open');
    const displayStyle = isAdmin? 'block' : 'none';

    products.forEach(product => {
        let cat = (product.category || '').toLowerCase().trim();
        let targetId = "grid-decoration";

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
                    <input type="checkbox" class="select-product-checkbox" value="${product.id}" style="display: ${displayStyle}">
                    <button class="btn-delete-product" style="display: ${displayStyle}" onclick="handleDeleteProduct(event)">✕</button>
                    <div class="product-image">
                        <img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
                    </div>
                    <div class="product-body">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <p class="product-price"><strong>${product.price}$</strong></p>
                        <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
                    </div>
                </div>
            `);
        }
    });

    // CORRECTION ICI - avec espace
    const container = document.querySelector('#produits.container');

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

    appliquerRecherche();
}

window.toggleCatalogue = function() {
    const content = document.getElementById('catContent');
    if (content) content.classList.toggle('active');
};

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
        window.scrollTo({ top: selected.offsetTop - 120, behavior: 'smooth' });
    }
    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
    const content = document.getElementById('catContent');
    if (content) content.classList.remove('active');
};

window.showAllCategories = function() {
    const recherche = document.getElementById('rechercheProduit');
    if (recherche) recherche.value = '';
    chargerProduits();
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};

const form = document.getElementById('formAjoutProduit');
if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const fileInput = document.getElementById('imageProduit');
        const file = fileInput.files[0];
        if (!file) return alert("Choisis une photo!");
        submitBtn.disabled = true;
        submitBtn.innerText = "⏳ Envoi...";
        try {
            const fileName = Date.now() + "-" + file.name;
            const { error: uploadError } = await db.storage.from('product-images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: linkData } = db.storage.from('product-images').getPublicUrl(fileName);
            const { error: insertError } = await db.from('products').insert([{
                name: document.getElementById('nomProduit').value,
                description: document.getElementById('descProduit').value,
                price: parseFloat(document.getElementById('prixProduit').value),
                image_url: linkData.publicUrl,
                category: document.getElementById('categorieProduit').value
            }]);
            if (insertError) throw insertError;
            alert("Produit publié! ✅");
            form.reset();
            document.getElementById('preview-container').style.display = 'none';
            chargerProduits();
        } catch (err) {
            alert(err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "🚀 Publier";
        }
    };
}

window.verifierPin = async function() {
    const input = document.getElementById('inputPin');
    const pin = input.value.trim();
    if (!/^\d{6}$/.test(pin)) {
        alert("Veuillez entrer un PIN de 6 chiffres.");
        return;
    }
    try {
        const { data, error } = await db.rpc('verify_admin_pin', { pin_code: pin });
        if (error) {
            console.error("Erreur vérification PIN :", error);
            alert("Erreur Supabase : " + error.message);
            return;
        }
        if (data!== true) {
            alert("Code PIN incorrect!");
            input.value = "";
            input.focus();
            return;
        }
        document.getElementById('admin').style.display = 'block';
        document.getElementById('popupPin').style.display = 'none';
        document.getElementById('btn-bulk-delete').style.display = 'inline-block';
        document.body.classList.add('admin-open');
        chargerProduits();
        document.getElementById('admin').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error("Erreur inattendue :", err);
        alert("Une erreur est survenue : " + (err.message || err));
    }
};

window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    if (!card) { alert("Impossible de trouver le produit à supprimer."); return; }
    const id = card.getAttribute('data-id');
    if (!id) { alert("Identifiant du produit introuvable."); return; }
    const pin = prompt("Entrez le code PIN pour supprimer :");
    if (!pin) return;
    try {
        const { error } = await db.rpc('delete_product_secure', { prod_id: Number(id), pin_code: pin.trim() });
        if (error) {
            console.error("Erreur Supabase lors de la suppression :", error);
            alert("Échec de la suppression :\n" + error.message);
            return;
        }
        card.style.transition = "transform 300ms ease, opacity 300ms ease";
        card.style.transform = "scale(0)";
        card.style.opacity = "0";
        setTimeout(() => { card.remove(); }, 300);
        alert("Produit supprimé avec succès!");
    } catch (err) {
        console.error("Erreur inattendue :", err);
        alert("Une erreur inattendue est survenue :\n" + (err.message || err));
    }
};

window.deleteSelectedProducts = async function() {
    const checkboxes = document.querySelectorAll('.select-product-checkbox:checked');
    if (checkboxes.length === 0) { return alert("Aucun produit sélectionné"); }
    const pin = prompt(`Supprimer ${checkboxes.length} produits? Entrez le code PIN :`);
    if (!pin) return;
    let successCount = 0;
    for (let cb of checkboxes) {
        const id = cb.value;
        const { error } = await db.rpc('delete_product_secure', { prod_id: id, pin_code: pin });
        if (!error) successCount++;
    }
    if (successCount > 0) {
        alert(`${successCount} produit(s) supprimé(s).`);
        chargerProduits();
    } else {
        alert("Erreur ou PIN incorrect.");
    }
};

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
            const correspond = nom && nom.textContent.toLowerCase().includes(recherche);
            carte.style.display = correspond? '' : 'none';
            if (correspond) { cartesVisibles++; }
        });
        if (recherche) {
            section.style.display = cartesVisibles > 0? 'block' : 'none';
        } else {
            section.style.display = cartes.length > 0? 'block' : 'none';
        }
    });
    if (recherche) {
        document.getElementById('default-title').style.display = 'none';
        document.getElementById('category-back-button').style.display = 'block';
    } else {
        document.getElementById('default-title').style.display = 'block';
        document.getElementById('category-back-button').style.display = 'none';
    }
}

const rechercheProduit = document.getElementById('rechercheProduit');
if (rechercheProduit) {
    rechercheProduit.addEventListener('input', function() { appliquerRecherche(); });
}

document.addEventListener('DOMContentLoaded', () => {
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) {
        btnAdmin.onclick = () => { document.getElementById('popupPin').style.display = 'flex'; };
    }
    const backBtn = document.getElementById('backToCatalogBtn');
    if (backBtn) { backBtn.onclick = showAllCategories; }
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
    chargerProduits();
});

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector('input[placeholder*="Rechercher"]');
    if (!searchInput) { console.warn("Barre de recherche introuvable."); return; }
    searchInput.addEventListener("input", function () {
        const recherche = this.value.trim().toLowerCase();
        const produits = document.querySelectorAll(".product-card");
        produits.forEach(function (produit) {
            const titre = produit.querySelector("h3");
            if (!titre) return;
            const nom = titre.textContent.trim().toLowerCase();
            produit.style.display = nom.includes(recherche)? "" : "none";
        });
    });
});
