// 1. CONFIGURATION
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CODE_ADMIN = "200611";

/* ========== GESTION DU BOUTON ADMIN (ENGRENAGE) ========== */
document.addEventListener('DOMContentLoaded', () => {
    const btnAdmin = document.getElementById('btnAdmin');
    const popupPin = document.getElementById('popupPin');

    if (btnAdmin && popupPin) {
        btnAdmin.onclick = function() {
            console.log("Clic sur engrenage !");
            popupPin.style.display = 'flex'; // Ouvre le popup PIN
        };
    }
    chargerProduits();
});

/* ========== VÉRIFICATION DU PIN ========== */
window.verifierPin = function() {
    const pinInput = document.getElementById('inputPin');
    const erreurPin = document.getElementById('erreurPin');
    
    if (pinInput.value === CODE_ADMIN) {
        document.getElementById('admin').style.display = 'block'; // Affiche le formulaire
        document.getElementById('popupPin').style.display = 'none'; // Cache le popup
        document.body.classList.add('admin-open');
        document.querySelectorAll('.btn-delete-product').forEach(b => b.style.display = 'block');
        erreurPin.style.display = 'none';
        pinInput.value = '';
        console.log("Admin connecté ✓");
    } else {
        erreurPin.style.display = 'block';
        pinInput.value = '';
    }
};

window.fermerPin = function() {
    document.getElementById('popupPin').style.display = 'none';
};

/* ========== CHARGEMENT DES PRODUITS ========== */
async function chargerProduits() {
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = '<p>Chargement...</p>');

    const { data: products, error } = await db.from('products').select('*').order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur Supabase:", error.message);
        return;
    }

    grilles.forEach(g => g.innerHTML = '');
    products.forEach(product => {
        const grid = document.getElementById('grid-' + product.category);
        if (grid) {
            grid.insertAdjacentHTML('beforeend', créerCardHTML(product));
        }
    });
}

function créerCardHTML(product) {
    const displayX = document.body.classList.contains('admin-open') ? 'block' : 'none';
    return `
        <div class="product-card" data-id="${product.id}">
            <button class="btn-delete-product" style="display: ${displayX}" onclick="handleDeleteProduct(event)">✕</button>
            <div class="product-image"><img src="${product.image_url}" style="width:100%;height:100%;object-fit:cover;"></div>
            <div class="product-body">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p><strong>${product.price}$</strong></p>
                <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
            </div>
        </div>`;
}

/* ========== AJOUTER UN PRODUIT ========== */
const formAjoutProduit = document.getElementById('formAjoutProduit');
if (formAjoutProduit) {
    formAjoutProduit.onsubmit = async function(e) {
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
            alert("Erreur base de données : " + error.message);
        } else {
            alert("Produit ajouté ! ✓");
            formAjoutProduit.reset();
            document.getElementById('admin').style.display = 'none';
            chargerProduits();
        }
    };
}

/* ========== SUPPRIMER UN PRODUIT ========== */
window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    if (confirm("Supprimer ce produit ?")) {
        const { error } = await db.from('products').delete().eq('id', id);
        if (error) alert(error.message);
        else card.remove();
    }
};

/* ========== FILTRES ========== */
window.filterByCategory = function(cat) {
    const categories = ['decoration', 'vaisselle', 'bijoux', 'jeux', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'];
    categories.forEach(c => { if(document.getElementById(c)) document.getElementById(c).style.display = 'none'; });
    if(document.getElementById(cat)) document.getElementById(cat).style.display = 'block';
    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
};

window.showAllCategories = function() {
    const categories = ['decoration', 'vaisselle', 'bijoux', 'jeux', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'];
    categories.forEach(c => { if(document.getElementById(c)) document.getElementById(c).style.display = 'block'; });
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};
