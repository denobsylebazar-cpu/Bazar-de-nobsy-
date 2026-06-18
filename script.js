// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CODE_ADMIN = "200611";

/* ========== CHARGEMENT DES PRODUITS ========== */
async function chargerProduits() {
    console.log("Mise à jour du catalogue...");
    
    const { data: products, error } = await db
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur de lecture :", error.message);
        return;
    }

    // On vide toutes les grilles
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    products.forEach(product => {
        // Nettoyage de la catégorie pour correspondre aux IDs HTML
        let cat = product.category.toLowerCase().trim();
        let targetId = "grid-decoration"; // Section par défaut

        if (cat.includes("vaisselle")) targetId = "grid-vaisselle";
        else if (cat.includes("bijoux")) targetId = "grid-bijoux";
        else if (cat.includes("jeux") || cat.includes("casse")) targetId = "grid-jeux";
        else if (cat.includes("film") || cat.includes("video")) targetId = "grid-film";
        else if (cat.includes("peluche")) targetId = "grid-peluche";
        else if (cat.includes("vetement")) targetId = "grid-vetement";
        else if (cat.includes("maquillage")) targetId = "grid-maquillage";
        else if (cat.includes("lumiere")) targetId = "grid-lumiere";

        const gridElement = document.getElementById(targetId);
        if (gridElement) {
            // On vérifie si le mode admin est déjà actif pour afficher le bouton X
            const showX = document.body.classList.contains('admin-open') ? 'block' : 'none';
            
            gridElement.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">
                    <button class="btn-delete-product" style="display: ${showX}" onclick="handleDeleteProduct(event)">✕</button>
                    <div class="product-image">
                        <img src="${product.image_url}" onerror="this.src='https://via.placeholder.com/150'">
                    </div>
                    <div class="product-body">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p class="price"><strong>${product.price}$</strong></p>
                        <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
                    </div>
                </div>
            `);
        }
    });
}

/* ========== GESTION ADMIN UI ========== */
window.verifierPin = function() {
    const pin = document.getElementById('inputPin').value;
    if (pin === CODE_ADMIN) {
        document.getElementById('admin').style.display = 'block';
        document.getElementById('popupPin').style.display = 'none';
        document.body.classList.add('admin-open');
        
        // On affiche les boutons de suppression sur tous les produits existants
        document.querySelectorAll('.btn-delete-product').forEach(b => b.style.display = 'block');
        
        document.getElementById('admin').scrollIntoView({behavior: 'smooth'});
        document.getElementById('inputPin').value = "";
    } else {
        document.getElementById('erreurPin').style.display = 'block';
    }
};

window.fermerPin = function() {
    document.getElementById('popupPin').style.display = 'none';
};

/* ========== SUPPRIMER UN PRODUIT (AVEC PIN) ========== */
window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    
    // DEMANDE DU MOT DE PASSE AVANT SUPPRESSION
    const confirmation = prompt("Entrez le code PIN pour confirmer la suppression définitive :");
    
    if (confirmation === CODE_ADMIN) {
        const { error } = await db.from('products').delete().eq('id', id);
        
        if (error) {
            alert("Erreur base de données : " + error.message);
        } else {
            // Animation de sortie
            card.style.transform = "scale(0)";
            card.style.opacity = "0";
            setTimeout(() => {
                card.remove();
                console.log("Produit supprimé ✓");
            }, 300);
        }
    } else if (confirmation !== null) {
        alert("Code PIN incorrect. Suppression annulée. ❌");
    }
};

/* ========== AJOUTER UN PRODUIT ========== */
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
            alert("Erreur lors de l'ajout : " + error.message);
        } else {
            alert("Produit ajouté avec succès ! ✓");
            form.reset();
            // On cache le panneau admin après l'ajout (optionnel)
            document.getElementById('admin').style.display = 'none';
            document.body.classList.remove('admin-open');
            // Recharger la liste
            chargerProduits();
        }
    };
}

/* ========== CATALOGUE & FILTRES ========== */
window.filterByCategory = function(cat) {
    console.log("Filtrage : " + cat);
    const sections = ['decoration', 'vaisselle', 'bijoux', 'jeux', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'];
    
    // On cache tout
    sections.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = 'none';
    });

    // On affiche la catégorie demandée
    const selected = document.getElementById(cat);
    if (selected) {
        selected.style.display = 'block';
        window.scrollTo({ top: selected.offsetTop - 100, behavior: 'smooth' });
    }

    // UI : Afficher le bouton retour
    const backBtn = document.getElementById('category-back-button');
    if (backBtn) backBtn.style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
};

window.showAllCategories = function() {
    const sections = ['decoration', 'vaisselle', 'bijoux', 'jeux', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'];
    sections.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = 'block';
    });
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};

/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', () => {
    // Bouton admin (Engrenage)
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) {
        btnAdmin.onclick = () => {
            document.getElementById('popupPin').style.display = 'flex';
        };
    }

    // Fix pour les liens du catalogue
    document.querySelectorAll('.catalogue-link').forEach(link => {
        link.onclick = function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            filterByCategory(category);
            
            // Fermer le drawer si ouvert
            const drawer = document.querySelector('.catalogue-content');
            const toggle = document.querySelector('.catalogue-toggle');
            if (drawer) {
                drawer.classList.remove('active');
                toggle.classList.remove('active');
            }
        };
    });

    // Bouton retour catalogue
    const backBtn = document.getElementById('backToCatalogBtn');
    if (backBtn) backBtn.onclick = showAllCategories;

    // Menu Mobile (Burger)
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger) {
        hamburger.onclick = () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        };
    }

    // Charger les produits au démarrage
    chargerProduits();
});
