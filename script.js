// 1. CONFIGURATION
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CODE_ADMIN = "200611";

/* ========== CHARGEMENT ET TRI DES SECTIONS ========== */
async function chargerProduits() {
    console.log("Mise à jour du catalogue...");
    
    const { data: products, error } = await db
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    // Vider les grilles
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    // Remplir les grilles
    products.forEach(product => {
        let cat = product.category.toLowerCase().trim();
        let targetId = "grid-decoration";
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
            const showX = document.body.classList.contains('admin-open') ? 'block' : 'none';
            gridElement.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">
                    <button class="btn-delete-product" style="display: ${showX}" onclick="handleDeleteProduct(event)">✕</button>
                    <div class="product-image"><img src="${product.image_url}" onerror="this.src='https://via.placeholder.com/150'"></div>
                    <div class="product-body">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p class="price"><strong>${product.price}$</strong></p>
                        <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
                    </div>
                </div>`);
        }
    });

    // --- LOGIQUE DE RÉORGANISATION ---
    const container = document.querySelector('#produits .container');
    const sectionsIds = ['decoration', 'vaisselle', 'bijoux', 'jeux', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'];

    // On déplace les sections avec produits en haut
    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        const grid = document.getElementById('grid-' + id);
        
        if (section && grid) {
            if (grid.children.length > 0) {
                // Si la section a des produits, on la remonte au début du container
                container.prepend(section); 
                section.style.opacity = "1";
            } else {
                // Si elle est vide, elle reste ou descend à la fin
                container.appendChild(section);
                section.style.opacity = "0.5"; // Optionnel : un peu plus transparent si vide
            }
        }
    });
}

/* ========== GESTION CATALOGUE (DROPDOWN) ========== */
function initCatalogue() {
    const toggleBtn = document.querySelector('.catalogue-toggle');
    const content = document.querySelector('.catalogue-content');

    if (toggleBtn && content) {
        toggleBtn.onclick = function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            content.classList.toggle('active');
        };
    }

    // Liens à l'intérieur du catalogue
    document.querySelectorAll('.catalogue-link').forEach(link => {
        link.onclick = function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            filterByCategory(category);
            
            // Fermer le menu après clic
            toggleBtn.classList.remove('active');
            content.classList.remove('active');
        };
    });
}

/* ========== AJOUTER UN PRODUIT ========== */
const form = document.getElementById('formAjoutProduit');
if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const fileInput = document.getElementById('imageProduit');
        const file = fileInput.files[0];

        if (!file) return alert("Choisis une photo !");
        submitBtn.disabled = true;
        submitBtn.innerText = "Envoi...";

        try {
            const fileName = Date.now() + "-" + file.name;
            const { data: uploadData } = await db.storage.from('product-images').upload(fileName, file);
            const { data: linkData } = db.storage.from('product-images').getPublicUrl(fileName);

            await db.from('products').insert([{
                name: document.getElementById('nomProduit').value,
                description: document.getElementById('descProduit').value,
                price: parseFloat(document.getElementById('prixProduit').value),
                image_url: linkData.publicUrl,
                category: document.getElementById('categorieProduit').value
            }]);

            alert("Produit ajouté ! ✅");
            form.reset();
            document.getElementById('admin').style.display = 'none';
            chargerProduits();
        } catch (err) {
            alert(err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "🚀 Publier";
        }
    };
}

/* ========== ADMIN & SUPPRESSION ========== */
window.verifierPin = function() {
    const pin = document.getElementById('inputPin').value;
    if (pin === CODE_ADMIN) {
        document.getElementById('admin').style.display = 'block';
        document.getElementById('popupPin').style.display = 'none';
        document.body.classList.add('admin-open');
        document.querySelectorAll('.btn-delete-product').forEach(b => b.style.display = 'block');
    } else { alert("PIN incorrect"); }
};

window.fermerPin = function() { document.getElementById('popupPin').style.display = 'none'; };

window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    if (prompt("PIN pour supprimer :") === CODE_ADMIN) {
        const { error } = await db.from('products').delete().eq('id', id);
        if (!error) card.remove();
    }
};

/* ========== FILTRES ========== */
window.filterByCategory = function(cat) {
    const ids = ['decoration','vaisselle','bijoux','jeux','film','peluche','vetement','maquillage','lumiere'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
    if(document.getElementById(cat)) document.getElementById(cat).style.display = 'block';
    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
};

window.showAllCategories = function() {
    chargerProduits(); // Relance le tri automatique
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};

/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', () => {
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) btnAdmin.onclick = () => document.getElementById('popupPin').style.display = 'flex';
    
    initCatalogue();
    chargerProduits();

    const backBtn = document.getElementById('backToCatalogBtn');
    if (backBtn) backBtn.onclick = showAllCategories;
});
