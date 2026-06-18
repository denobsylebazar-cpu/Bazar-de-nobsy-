// 1. CONFIGURATION SUPABASE (Remplace par tes vraies infos)
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4
    ';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CODE_ADMIN = "200611";

/* ========== CHARGEMENT DES PRODUITS (READ) ========== */
async function chargerProduits() {
    // On vide les grilles avant de recharger
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = '<p style="padding:20px;">Chargement...</p>');

    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur de chargement:", error.message);
        return;
    }

    // On vide à nouveau pour enlever le message "Chargement..."
    grilles.forEach(g => g.innerHTML = '');

    products.forEach(product => {
        const grid = document.getElementById('grid-' + product.category);
        if (grid) {
            const cardHTML = créerCardHTML(product);
            grid.insertAdjacentHTML('beforeend', cardHTML);
        }
    });

    // On ré-attache les événements de suppression après le rendu
    attacherEvenementsSuppression();
}

function créerCardHTML(product) {
    // On vérifie si on est en mode admin pour afficher le bouton X
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

        const { data, error } = await supabase
            .from('products')
            .insert([nouveauProduit]);

        if (error) {
            alert("Erreur lors de l'ajout : " + error.message);
        } else {
            alert('Produit ajouté avec succès ! ✅');
            formAjoutProduit.reset();
            document.getElementById('admin').style.display = 'none';
            chargerProduits(); // Recharger la liste
        }
    });
}

/* ========== SUPPRIMER UN PRODUIT (DELETE) ========== */
async function handleDeleteProduct(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    
    const password = prompt('Entrez le code PIN pour confirmer la suppression:');
    
    if (password === CODE_ADMIN) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Erreur lors de la suppression : " + error.message);
        } else {
            card.remove();
            console.log('Produit supprimé de la base de données');
        }
    } else if (password !== null) {
        alert('Code incorrect ❌');
    }
}

function attacherEvenementsSuppression() {
    document.querySelectorAll('.btn-delete-product').forEach(btn => {
        btn.removeEventListener('click', handleDeleteProduct); // Éviter les doublons
        btn.addEventListener('click', handleDeleteProduct);
    });
}

/* ========== GESTION LOGIN ADMIN (UI) ========== */
function verifierPin() {
    const pin = document.getElementById('inputPin').value;
    if (pin === CODE_ADMIN) {
        document.getElementById('admin').style.display = 'block';
        document.getElementById('popupPin').style.display = 'none';
        document.body.classList.add('admin-open');
        
        // Afficher tous les boutons de suppression
        document.querySelectorAll('.btn-delete-product').forEach(b => b.style.display = 'block');
        
        document.getElementById('admin').scrollIntoView({behavior: 'smooth'});
    } else {
        document.getElementById('erreurPin').style.display = 'block';
    }
}

/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', function() {
    chargerProduits();
});

/* ========== CATALOGUE TOGGLE ========== */
const catalogueToggle = document.querySelector('.catalogue-toggle');
if (catalogueToggle) {
    catalogueToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        document.querySelector('.catalogue-content').classList.toggle('active');
    });
}

/* ========== FILTRE PAR CATÉGORIE ========== */
const categories = [
    'decoration', 'vaisselle', 'bijoux', 'jeux', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'
];

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

// Récupérer tous les liens du catalogue
const catalogueLinks = document.querySelectorAll('.catalogue-link');
catalogueLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const category = this.getAttribute('data-category');
        filterByCategory(category);
        
        // Fermer le menu catalogue
        catalogueToggle.classList.remove('active');
        document.querySelector('.catalogue-content').classList.remove('active');
    });
});

function filterByCategory(category) {
    // Masquer toutes les sections de catégorie
    categories.forEach(cat => {
        const section = document.getElement = 'block';
        document.getElementById('popupPin').style.display = 'none';
        document.body.classList.add('admin-open');
        
        // Afficher tous les boutons de suppression
        document.querySelectorAll('.btn-delete-product').forEach(b => b.style.display = 'block');
        
        document.getElementById('admin').scrollIntoView({behavior: 'smooth'});
    } else {
        document.getElementById('erreurPin').style.display = 'block';
    }
}

/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', function() {
    chargerProduits();
    

/* ========== CATALOGUE TOGGLE ========== */
const catalogueToggle = document.querySelector('.catalogue-toggle');
if (catalogueToggle) {
    catalogueToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        document.querySelector('.catalogue-content').classList.toggle('active');
    });
}

/* ========== FILTRE PAR CATÉGORIE ========== */
const categories = [
    'decoration', 'vaisselle', 'bijoux', 'jeux', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'
];

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

// Récupérer tous les liens du catalogue
const catalogueLinks = document.querySelectorAll('.catalogue-link');
catalogueLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const category = this.getAttribute('data-category');
        filterByCategory(category);
        
        // Fermer le menu catalogue
        catalogueToggle.classList.remove('active');
        document.querySelector('.catalogue-content').classList.remove('active');
    });
});

function filterByCategory(category) {
    // Masquer toutes les sections de catégorie
    categories.forEach(cat => {
        const section = document.getElementById(cat);
        if (section) {
            section.style.display = 'none';
        }
    });
    
    // Afficher uniquement la catégorie sélectionnée
    const selectedSection = document.getElementById(category);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
    
    // Afficher le bouton retour et le titre de la catégorie
    const backBtn = document.getElementById('category-back-button');
    const categoryTitle = document.getElementById('category-title');
    const defaultTitle = document.getElementById('default-title');
    
    if (backBtn) backBtn.style.display = 'block';
    if (categoryTitle) {
        categoryTitle.style.display = 'block';
        categoryTitle.textContent = categoryNames[category];
    }
    if (defaultTitle) defaultTitle.style.display = 'none';
    
    // Scroll vers la section produits
    const produitSection = document.getElementById('produits');
    if (produitSection) {
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = produitSection.offsetTop - navbarHeight;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

function showAllCategories() {
    // Afficher toutes les sections de catégorie
    categories.forEach(cat => {
        const section = document.getElementById(cat);
        if (section) {
            section.style.display = 'block';
        }
    });
    
    // Masquer le bouton retour et le titre de la catégorie
    const backBtn = document.getElementById('category-back-button');
    const categoryTitle = document.getElementById('category-title');
    const defaultTitle = document.getElementById('default-title');
    
    if (backBtn) backBtn.style.display = 'none';
    if (categoryTitle) categoryTitle.style.display = 'none';
    if (defaultTitle) defaultTitle.style.display = 'block';
    
    // Scroll vers la section produits
    const produitSection = document.getElementById('produits');
    if (produitSection) {
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = produitSection.offsetTop - navbarHeight;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Ajouter l'event listener au bouton retour
const backToCatalogBtn = document.getElementById('backToCatalogBtn');
if (backToCatalogBtn) {
    backToCatalogBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showAllCategories();
    });
}

/* ========== ACCESSIBILITY ENHANCEMENTS ========== */
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            this.click();
        }
    });
});

console.log('Le bazar de Nobsy - Site chargé avec succès! 🎉');
});
