/* ========== BANNIÈRE NOUVEAU LOCAL - GESTION ========== */
document.addEventListener('DOMContentLoaded', function() {
    const banner = document.getElementById('banner-toit-rouge');
    
    if (!banner) return;
    
    // Date de début : 12 juin 2026
    const startDate = new Date('2026-06-12');
    const today = new Date();
    
    // Calculer la date d'expiration (14 jours après le début)
    const expirationDate = new Date(startDate);
    expirationDate.setDate(expirationDate.getDate() + 14); // Expire le 26 juin 2026
    
    // Vérifier si la bannière doit être supprimée complètement
    if (today > expirationDate) {
        banner.remove();
        console.log('Bannière supprimée : période de 14 jours dépassée (expiration : 26 juin 2026)');
        return;
    }
    
    // Afficher la bannière immédiatement au chargement
    banner.classList.remove('hidden');
    console.log('Bannière affichée au chargement de la page');
    
    // Gestion de l'animation : 2 minutes affichée + 30 secondes masquée
    const showDuration = 2 * 60 * 1000; // 2 minutes
    const hideDuration = 30 * 1000;      // 30 secondes
    
    function toggleBannerCycle() {
        setTimeout(function() {
            banner.classList.add('hidden');
            console.log('Bannière masquée');
            
            setTimeout(function() {
                banner.classList.remove('hidden');
                console.log('Bannière réaffichée');
                toggleBannerCycle();
            }, hideDuration);
        }, showDuration);
    }
    
    toggleBannerCycle();
    console.log('Animation bannière activée - Cycle: 2min affichée + 30s masquée - Expires le 26 juin 2026');
});

/* ========== MOBILE MENU FUNCTIONALITY ========== */
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    document.addEventListener('click', function(event) {
        const isClickInsideMenu = navMenu.contains(event.target);
        const isClickOnHamburger = hamburger.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnHamburger && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
});

/* ========== SMOOTH SCROLL WITH NAVBAR OFFSET ========== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

/* ========== BUTTON EVENT LISTENERS ========== */
const btnProduits = document.getElementById('btnProduits');
if (btnProduits) {
    btnProduits.addEventListener('click', function() {
        const produitSection = document.getElementById('produits');
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = produitSection.offsetTop - navbarHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    });
}

const btnLive = document.getElementById('btnLive');
if (btnLive) {
    btnLive.addEventListener('click', function() {
        window.open('https://www.facebook.com/share/g/18YTkXrkvB/', '_blank');
    });
}

/* ========== INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS ========== */
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in-section').forEach(element => {
    observer.observe(element);
});

/* ========== NAVBAR SCROLL EFFECT ========== */
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 0) {
        navbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

/* ========== ADMIN PANEL + PIN 200611 ========== */
const CODE_ADMIN = "200611";
let isAdminOpen = false;

// Montrer popup PIN
const btnAdmin = document.getElementById('btnAdmin');
if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
        document.getElementById('popupPin').style.display = 'flex';
        document.getElementById('inputPin').focus();
    });
}

// Vérifier le code
function verifierPin() {
    const pin = document.getElementById('inputPin').value;
    if (pin === CODE_ADMIN) {
        document.getElementById('admin').style.display = 'block';
        document.getElementById('popupPin').style.display = 'none';
        document.getElementById('inputPin').value = '';
        document.getElementById('erreurPin').style.display = 'none';
        document.getElementById('admin').scrollIntoView({behavior: 'smooth'});
        
        // Ajouter la classe pour afficher les boutons X
        document.body.classList.add('admin-open');
        isAdminOpen = true;
    } else {
        document.getElementById('erreurPin').style.display = 'block';
        document.getElementById('inputPin').value = '';
    }
}

function fermerPin() {
    document.getElementById('popupPin').style.display = 'none';
    document.getElementById('inputPin').value = '';
    document.getElementById('erreurPin').style.display = 'none';
}

// Entrer avec Entrée
const inputPin = document.getElementById('inputPin');
if (inputPin) {
    inputPin.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifierPin();
    });
}

/* ========== AJOUT PRODUIT DYNAMIQUE ========== */
const formAjoutProduit = document.getElementById('formAjoutProduit');
if (formAjoutProduit) {
    formAjoutProduit.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nom = document.getElementById('nomProduit').value;
        const desc = document.getElementById('descProduit').value;
        const prix = document.getElementById('prixProduit').value;
        const img = document.getElementById('imageProduit').value;
        const cat = document.getElementById('categorieProduit').value;
        
        const card = `
            <div class="product-card">
                <button class="btn-delete-product" title="Supprimer ce produit">✕</button>
                <div class="product-image">
                    <img src="${img}" alt="${nom}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="product-body">
                    <h3 class="product-name">${nom}</h3>
                    <p class="product-description">${desc}</p>
                    <p class="product-price"><strong>${prix}$</strong></p>
                    <button class="btn product-button" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander sur Messenger</button>
                </div>
            </div>
        `;
        
        const grid = document.getElementById('grid-' + cat);
        if (grid) {
            grid.insertAdjacentHTML('beforeend', card);
            
            // Ajouter l'event listener au nouveau bouton X
            const newCard = grid.lastElementChild;
            const deleteBtn = newCard.querySelector('.btn-delete-product');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', handleDeleteProduct);
            }
            
            this.reset();
            alert('Produit ajouté dans ' + cat + ' ✅');
            
            // Fermer le panneau admin après ajout
            document.getElementById('admin').style.display = 'none';
            document.body.classList.remove('admin-open');
            isAdminOpen = false;
        }
    });
}

/* ========== GESTION SUPPRESSION PRODUIT ========== */
function handleDeleteProduct(event) {
    event.preventDefault();
    
    // Demander le mot de passe
    const password = prompt('Entrez le mot de passe pour supprimer ce produit:');
    
    if (password === null) {
        // L'utilisateur a cliqué sur "Annuler"
        return;
    }
    
    if (password === CODE_ADMIN) {
        // Trouver la carte produit parente et la supprimer avec une animation
        const productCard = this.closest('.product-card');
        if (productCard) {
            productCard.style.transition = 'all 0.3s ease-out';
            productCard.style.opacity = '0';
            productCard.style.transform = 'scale(0.8)';
            setTimeout(() => {
                productCard.remove();
                console.log('Produit supprimé ✓');
            }, 300);
        }
    } else {
        alert('Mot de passe incorrect ❌');
    }
}

// Ajouter les event listeners au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    const deleteButtons = document.querySelectorAll('.btn-delete-product');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', handleDeleteProduct);
    });
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
