// 1. CONFIGURATION
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CODE_ADMIN = "200611";

// 2. CHARGEMENT DES PRODUITS
async function chargerProduits() {
    console.log("Chargement des produits...");
    
    const { data: products, error } = await db.from('products').select('*').order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur Supabase :", error.message);
        return;
    }

    console.log("Produits reçus :", products.length);

    // Vider toutes les grilles
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    products.forEach(product => {
        // NETTOYAGE CRUCIAL : "Décoration" -> "decoration"
        let catNettoyee = product.category
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlève les accents
            .replace(/\s+/g, '') // Enlève les espaces
            .split('et')[0]; // Prend le premier mot si "vaisselle et cuisine"

        // Correction spécifique pour les noms longs
        if (catNettoyee.includes("vaisselle")) catNettoyee = "vaisselle";
        if (catNettoyee.includes("casse")) catNettoyee = "jeux";
        if (catNettoyee.includes("video")) catNettoyee = "film";
        if (catNettoyee.includes("peluche")) catNettoyee = "peluche";
        if (catNettoyee.includes("maquillage")) catNettoyee = "maquillage";

        const grid = document.getElementById('grid-' + catNettoyee);

        if (grid) {
            grid.insertAdjacentHTML('beforeend', créerCardHTML(product));
        } else {
            console.warn("Impossible de trouver la grille pour : grid-" + catNettoyee);
            // Secours : mettre dans la première grille si on ne trouve pas
            if(grilles[0]) grilles[0].insertAdjacentHTML('beforeend', créerCardHTML(product));
        }
    });
}

function créerCardHTML(product) {
    const displayX = document.body.classList.contains('admin-open') ? 'block' : 'none';
    return `
        <div class="product-card" data-id="${product.id}">
            <button class="btn-delete-product" style="display: ${displayX}" onclick="handleDeleteProduct(event)">✕</button>
            <div class="product-image">
                <img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
            </div>
            <div class="product-body">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="product-price"><strong>${product.price}$</strong></p>
                <button class="btn product-button" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
            </div>
        </div>
    `;
}

/* ========== FONCTIONS ADMIN ========== */
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

/* ========== AJOUTER PRODUIT ========== */
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

        if (error) {
            alert("Erreur : " + error.message);
        } else {
            alert("Produit ajouté avec succès ! ✓");
            form.reset();
            document.getElementById('admin').style.display = 'none';
            chargerProduits();
        }
    };
}

/* ========== SUPPRIMER PRODUIT ========== */
window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    if (confirm("Supprimer ce produit définitivement ?")) {
        const { error } = await db.from('products').delete().eq('id', id);
        if (error) alert(error.message);
        else card.remove();
    }
};

/* ========== FILTRES ========== */
window.filterByCategory = function(cat) {
    const sections = ['decoration','vaisselle','bijoux','jeux','film','peluche','vetement','maquillage','lumiere'];
    sections.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = 'none';
    });
    const selected = document.getElementById(cat);
    if (selected) selected.style.display = 'block';
    
    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
};

window.showAllCategories = function() {
    const sections = ['decoration','vaisselle','bijoux','jeux','film','peluche','vetement','maquillage','lumiere'];
    sections.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = 'block';
    });
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};

/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', () => {
    // Bouton engrenage
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) btnAdmin.onclick = () => document.getElementById('popupPin').style.display = 'flex';

    // Bouton retour
    const backBtn = document.getElementById('backToCatalogBtn');
    if (backBtn) backBtn.onclick = showAllCategories;

    // Liens catalogue
    document.querySelectorAll('.catalogue-link').forEach(link => {
        link.onclick = function() {
            filterByCategory(this.getAttribute('data-category'));
        };
    });

    chargerProduits();
});
