// 1. CONFIGURATION
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CODE_ADMIN = "200611";

// 2. FONCTION DE CHARGEMENT ULTRA-ROBUSTE
async function chargerProduits() {
    console.log("Démarrage du chargement...");
    
    // On récupère les produits
    const { data: products, error } = await db.from('products').select('*');

    if (error) {
        alert("Erreur Supabase : " + error.message);
        return;
    }

    console.log("Produits reçus : " + products.length);

    // Vider toutes les grilles
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    // Dictionnaire pour corriger les catégories automatiquement
    const mapCat = {
        "décoration": "decoration", "decoration": "decoration",
        "vaisselle et cuisine": "vaisselle", "vaisselle": "vaisselle",
        "bijoux": "bijoux",
        "casse tête et jeux": "jeux", "jeux": "jeux",
        "jeux vidéo et film": "film", "film": "film",
        "peluche et porte clé": "peluche", "peluche": "peluche",
        "vêtement": "vetement", "vetement": "vetement",
        "maquillage et accessoire": "maquillage", "maquillage": "maquillage",
        "lumière": "lumiere", "lumiere": "lumiere"
    };

    products.forEach(product => {
        // On nettoie le nom de la catégorie reçue
        let rawCat = product.category.toLowerCase().trim();
        let finalCat = mapCat[rawCat] || rawCat; // On utilise la map ou le nom brut

        const gridId = 'grid-' + finalCat;
        const grid = document.getElementById(gridId);

        if (grid) {
            grid.insertAdjacentHTML('beforeend', créerCardHTML(product));
        } else {
            console.error("Grille introuvable pour : " + gridId);
            // Si on ne trouve pas la grille, on le met dans la première grille trouvée pour ne pas le perdre
            if(grilles[0]) grilles[0].insertAdjacentHTML('beforeend', créerCardHTML(product));
        }
    });

    // On force l'affichage des sections (au cas où elles seraient cachées)
    showAllCategories();
}

function créerCardHTML(product) {
    const displayX = document.body.classList.contains('admin-open') ? 'block' : 'none';
    return `
        <div class="product-card" data-id="${product.id}">
            <button class="btn-delete-product" style="display: ${displayX}" onclick="handleDeleteProduct(event)">✕</button>
            <div class="product-image"><img src="${product.image_url}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='https://via.placeholder.com/150'"></div>
            <div class="product-body">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p><strong>${product.price}$</strong></p>
                <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
            </div>
        </div>`;
}

/* ========== GESTION ADMIN ========== */
window.verifierPin = function() {
    const pin = document.getElementById('inputPin').value;
    if (pin === CODE_ADMIN) {
        document.getElementById('admin').style.display = 'block';
        document.getElementById('popupPin').style.display = 'none';
        document.body.classList.add('admin-open');
        document.querySelectorAll('.btn-delete-product').forEach(b => b.style.display = 'block');
        document.getElementById('admin').scrollIntoView({behavior: 'smooth'});
    } else {
        document.getElementById('erreurPin').style.display = 'block';
    }
};

window.fermerPin = function() { document.getElementById('popupPin').style.display = 'none'; };

/* ========== AJOUTER ========== */
const form = document.getElementById('formAjoutProduit');
if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();
        const nouveau = {
            name: document.getElementById('nomProduit').value,
            description: document.getElementById('descProduit').value,
            price: parseFloat(document.getElementById('prixProduit').value),
            image_url: document.getElementById('imageProduit').value,
            category: document.getElementById('categorieProduit').value
        };
        const { error } = await db.from('products').insert([nouveau]);
        if (error) alert(error.message);
        else { alert("Ajouté !"); form.reset(); chargerProduits(); }
    };
}

/* ========== SUPPRIMER ========== */
window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    if (confirm("Supprimer ?")) {
        const { error } = await db.from('products').delete().eq('id', id);
        if (error) alert(error.message);
        else card.remove();
    }
};

/* ========== FILTRES ========== */
window.showAllCategories = function() {
    const ids = ['decoration','vaisselle','bijoux','jeux','film','peluche','vetement','maquillage','lumiere'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'block'; });
    const backBtn = document.getElementById('category-back-button');
    if(backBtn) backBtn.style.display = 'none';
    const defTitle = document.getElementById('default-title');
    if(defTitle) defTitle.style.display = 'block';
};

window.filterByCategory = function(cat) {
    const ids = ['decoration','vaisselle','bijoux','jeux','film','peluche','vetement','maquillage','lumiere'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
    if(document.getElementById(cat)) document.getElementById(cat).style.display = 'block';
    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
};

/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', () => {
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) btnAdmin.onclick = () => document.getElementById('popupPin').style.display = 'flex';
    chargerProduits();
});
