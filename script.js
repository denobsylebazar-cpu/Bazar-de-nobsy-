// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
// Attention : BIEN GARDER LA CLÉ SUR UNE SEULE LIGNE SANS ESPACES
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';

// Initialisation correcte (On utilise le nom 'db' pour éviter le conflit avec l'objet supabase du CDN)
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CODE_ADMIN = "200611";

/* ========== CHARGEMENT DES PRODUITS (READ) ========== */
async function chargerProduits() {
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = '<p style="padding:20px;">Chargement...</p>');

    const { data: products, error } = await db
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur de chargement:", error.message);
        return;
    }

    grilles.forEach(g => g.innerHTML = '');

    products.forEach(product => {
        const grid = document.getElementById('grid-' + product.category);
        if (grid) {
            const cardHTML = créerCardHTML(product);
            grid.insertAdjacentHTML('beforeend', cardHTML);
        }
    });

    attacherEvenementsSuppression();
}

function créerCardHTML(product) {
    const displayX = document.body.classList.contains('admin-open') ? 'block' : 'none';
    
    return `
        <div class="product-card" data-id="${product.id}">
            <button class="btn-delete-product" style="display: ${displayX}" title="Supprimer">✕</button>
            <div class="product-image">
                <img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-body">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="product-price"><strong>${product.price}$</strong></p>
                <button class="btn product-button" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander sur Messenger</button>
            </div>
        </div>
    `;
}

/* ========== AJOUTER UN PRODUIT (CREATE) ========== */
const formAjoutProduit = document.getElementById('formAjoutProduit');
if (formAjoutProduit) {
    formAjoutProduit.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nouveauProduit = {
            name: document.getElementById('nomProduit').value,
            description: document.getElementById('descProduit').value,
            price: parseFloat(document.getElementById('prixProduit').value),
            image_url: document.getElementById('imageProduit').value,
            category: document.getElementById('categorieProduit').value
        };

        const { data, error } = await db
            .from('products')
            .insert([nouveauProduit]);

        if (error) {
            alert("Erreur lors de l'ajout : " + error.message);
        } else {
            alert('Produit ajouté avec succès ! ✅');
            formAjoutProduit.reset();
            document.getElementById('admin').style.display = 'none';
            chargerProduits();
        }
    });
}

/* ========== SUPPRIMER UN PRODUIT (DELETE) ========== */
async function handleDeleteProduct(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    
    const password = prompt('Entrez le code PIN pour confirmer la suppression:');
    
    if (password === CODE_ADMIN) {
        const { error } = await db
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Erreur lors de la suppression : " + error.message);
        } else {
            card.remove();
        }
    } else if (password !== null) {
        alert('Code incorrect ❌');
    }
}

function attacherEvenementsSuppression() {
    document.querySelectorAll('.btn-delete-product').forEach(btn => {
        btn.onclick = handleDeleteProduct; // Utilisation de onclick simple pour éviter les doublons
    });
}

/* ========== GESTION LOGIN ADMIN ========== */
function verifierPin() {
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
}

/* ========== FILTRE PAR CATÉGORIE ========== */
const categoryNames = {
    'decoration': 'Décoration',
    'vaisselle': 'Vaisselle et cuisine',
    'bijoux': 'Bijoux',
    'jeux': 'Casse tête et jeux',
    'film': 'Jeux vidéo et film',
    'peluche': 'Peluche et porte clé',
    'vetement': 'Vêtement',
    'maquillage': 'Maquillage et accessoire',
    'lumiere': 'Lumière'
};

function filterByCategory(category) {
    Object.keys(categoryNames).forEach(cat => {
        const section = document.getElementById(cat);
        if (section) section.style.display = 'none';
    });
    
    const selectedSection = document.getElementById(category);
    if (selectedSection) selectedSection.style.display = 'block';
    
    document.getElementById('category-back-button').style.display = 'block';
    const title = document.getElementById('category-title');
    title.style.display = 'block';
    title.textContent = categoryNames[category];
    document.getElementById('default-title').style.display = 'none';
}

function showAllCategories() {
    Object.keys(categoryNames).forEach(cat => {
        const section = document.getElementById(cat);
        if (section) section.style.display = 'block';
    });
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('category-title').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
}

/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', function() {
    chargerProduits();

    // Catalogue Toggle
    const catalogueToggle = document.querySelector('.catalogue-toggle');
    if (catalogueToggle) {
        catalogueToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            document.querySelector('.catalogue-content').classList.toggle('active');
        });
    }

    // Liens catalogue
    document.querySelectorAll('.catalogue-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            filterByCategory(this.getAttribute('data-category'));
            catalogueToggle.classList.remove('active');
            document.querySelector('.catalogue-content').classList.remove('active');
        });
    });

    const backBtn = document.getElementById('backToCatalogBtn');
    if (backBtn) backBtn.addEventListener('click', showAllCategories);
});
