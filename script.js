/* ========== CONFIGURATION SUPABASE ========== */
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CODE_ADMIN = "200611";

/* ========== GESTION DU LOGIN ADMIN ========== */
window.verifierPin = function() {
    const pinInput = document.getElementById('inputPin');
    const erreurPin = document.getElementById('erreurPin');
    const panelAdmin = document.getElementById('admin'); // Section qui contient le formulaire
    const popupPin = document.getElementById('popupPin');

    if (pinInput.value === CODE_ADMIN) {
        console.log("PIN correct !");
        
        // 1. Cacher le popup
        if (popupPin) popupPin.style.display = 'none';
        
        // 2. Afficher le panneau admin s'il existe
        if (panelAdmin) {
            panelAdmin.style.display = 'block';
            panelAdmin.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert("Attention: La section avec id='admin' est introuvable dans ton HTML !");
        }

        // 3. Activer le mode admin sur le corps de page
        document.body.classList.add('admin-open');
        
        // 4. Afficher tous les boutons de suppression
        document.querySelectorAll('.btn-delete-product').forEach(btn => {
            btn.style.display = 'block';
        });

        pinInput.value = '';
    } else {
        if (erreurPin) erreurPin.style.display = 'block';
        pinInput.value = '';
    }
};

window.fermerPin = function() {
    const popup = document.getElementById('popupPin');
    if (popup) popup.style.display = 'none';
};

/* ========== CHARGEMENT DES PRODUITS ========== */
async function chargerProduits() {
    console.log("Chargement des produits en cours...");
    const grilles = document.querySelectorAll('.products-grid');
    
    // On met un message d'attente
    grilles.forEach(g => g.innerHTML = '<p style="padding:20px;">Chargement du bazar...</p>');

    const { data: products, error } = await db
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur Supabase :", error.message);
        alert("Erreur de connexion à la base de données.");
        return;
    }

    console.log(products.length + " produits récupérés !");

    // On vide les grilles
    grilles.forEach(g => g.innerHTML = '');

    if (products.length === 0) {
        grilles.forEach(g => g.innerHTML = '<p>Aucun produit dans cette catégorie.</p>');
    }

    products.forEach(product => {
        const grid = document.getElementById('grid-' + product.category);
        if (grid) {
            grid.insertAdjacentHTML('beforeend', créerCardHTML(product));
        } else {
            console.warn("Pas de grille trouvée pour la catégorie : " + product.category);
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
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="price"><strong>${product.price}$</strong></p>
                <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
            </div>
        </div>`;
}

/* ========== AJOUTER UN PRODUIT ========== */
const form = document.getElementById('formAjoutProduit');
if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();
        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Ajout...";

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
            alert("Produit ajouté ! ✓");
            form.reset();
            document.getElementById('admin').style.display = 'none';
            chargerProduits();
        }
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Ajouter le produit";
    };
}

/* ========== SUPPRIMER UN PRODUIT ========== */
window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    
    if (confirm("Supprimer définitivement ce produit ?")) {
        const { error } = await db.from('products').delete().eq('id', id);
        if (error) alert("Erreur : " + error.message);
        else card.remove();
    }
};

/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', () => {
    // Bouton Engrenage
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) {
        btnAdmin.onclick = () => {
            document.getElementById('popupPin').style.display = 'flex';
        };
    }

    // Menu Mobile
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.onclick = () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        };
    }

    chargerProduits();
});

/* ========== FILTRES CATÉGORIES ========== */
window.filterByCategory = function(cat) {
    const sections = ['decoration', 'vaisselle', 'bijoux', 'jeux', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'];
    sections.forEach(c => {
        const s = document.getElementById(c);
        if (s) s.style.display = 'none';
    });
    
    const selected = document.getElementById(cat);
    if (selected) {
        selected.style.display = 'block';
        window.scrollTo({ top: selected.offsetTop - 80, behavior: 'smooth' });
    }
    
    const backBtn = document.getElementById('category-back-button');
    if (backBtn) backBtn.style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
};

window.showAllCategories = function() {
    const sections = ['decoration', 'vaisselle', 'bijoux', 'jeux', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'];
    sections.forEach(c => {
        const s = document.getElementById(c);
        if (s) s.style.display = 'block';
    });
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};
