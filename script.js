// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ========== MENU HAMBURGER ========== */
window.toggleMenu = function() {
    const menu = document.getElementById('navMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
};

/* ========== CATALOGUE DU BAS (DRAWER) ========== */
window.toggleCatalogue = function() {
    const content = document.getElementById('catContent');
    if (content) {
        content.classList.toggle('active');
    }
};

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

    // Vider toutes les grilles
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    // Remplir les grilles
    products.forEach(product => {
        let cat = product.category.toLowerCase().trim();
        let targetId = "grid-decoration"; // Par défaut

        if (cat.includes("vaisselle")) targetId = "grid-vaisselle";
        else if (cat.includes("bijoux")) targetId = "grid-bijoux";
        else if (cat.includes("pop")) targetId = "grid-pop";
        else if (cat.includes("livre")) targetId = "grid-livre";
        else if (cat.includes("jeuxvideo")) targetId = "grid-jeuxvideo";
        else if (cat.includes("film")) targetId = "grid-film";
        else if (cat.includes("jeux") || cat.includes("casse")) targetId = "grid-jeux";
        else if (cat.includes("peluche")) targetId = "grid-peluche";
        else if (cat.includes("vetement")) targetId = "grid-vetement";
        else if (cat.includes("maquillage")) targetId = "grid-maquillage";
        else if (cat.includes("lumiere")) targetId = "grid-lumiere";

        const gridElement = document.getElementById(targetId);
        if (gridElement) {
            const showX = document.body.classList.contains('admin-open') ? 'block' : 'none';
            // Note : On utilise <strong> pour que le prix soit BLEU via le CSS
            gridElement.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">
                    <button class="btn-delete-product" style="display: ${showX}" onclick="handleDeleteProduct(event)">✕</button>
                    <div class="product-image">
                        <img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
                    </div>
                    <div class="product-body">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <p class="product-price"><strong>${product.price}$</strong></p>
                        <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
                    </div>
                </div>`);
        }
    });

    // --- LOGIQUE DE TRI (SECTIONS PLEINES EN HAUT) ---
    const container = document.querySelector('#produits .container');
    const sectionsIds = ['pop', 'jeuxvideo', 'livre', 'film', 'decoration', 'vaisselle', 'bijoux', 'jeux', 'peluche', 'vetement', 'maquillage', 'lumiere'];

    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        const grid = document.getElementById('grid-' + id);
        if (section && grid) {
            if (grid.children.length > 0) {
                container.prepend(section); 
                section.style.display = "block";
            } else {
                container.appendChild(section);
            }
        }
    });
}

/* ========== FILTRAGE PAR CATÉGORIE ========== */
window.filterByCategory = function(cat) {
    const ids = ['pop','jeuxvideo','livre','film','decoration','vaisselle','bijoux','jeux','peluche','vetement','maquillage','lumiere'];
    ids.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = 'none';
    });

    const selected = document.getElementById(cat);
    if (selected) {
        selected.style.display = 'block';
        // Scroll avec un décalage (offset) pour ne pas être caché par le menu fixe
        const offset = 160; 
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = selected.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
    
    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
    
    // Fermer les menus après sélection
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('active');
    
    const catContent = document.getElementById('catContent');
    if (catContent) catContent.classList.remove('active');
};

window.showAllCategories = function() {
    chargerProduits();
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};

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

            alert("Produit publié ! ✅");
            form.reset();
            document.getElementById('preview-container').style.display = 'none';
            document.getElementById('admin').style.display = 'none';
            document.body.classList.remove('admin-open');
            chargerProduits();

        } catch (err) {
            alert("Erreur : " + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "🚀 Publier le produit";
        }
    };
}

/* ========== GESTION ADMIN & SUPPRESSION ========== */
window.verifierPin = function() {
    const pin = document.getElementById('inputPin').value;
    if (pin.length === 6) {
        document.getElementById('admin').style.display = 'block';
        document.getElementById('popupPin').style.display = 'none';
        document.body.classList.add('admin-open');
        // Afficher les boutons X sur les produits existants
        document.querySelectorAll('.btn-delete-product').forEach(b => b.style.display = 'block');
        document.getElementById('admin').scrollIntoView({behavior: 'smooth'});
    } else {
        alert("Code PIN invalide");
    }
};

window.fermerPin = function() {
    document.getElementById('popupPin').style.display = 'none';
};

window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    const pin = prompt("Entrez le code PIN pour confirmer la suppression :");
    if (!pin) return;

    // Appel à la fonction RPC sécurisée de Supabase
    const { error } = await db.rpc('delete_product_secure', { 
        prod_id: id, 
        pin_code: pin 
    });

    if (error) {
        alert("PIN incorrect ou erreur de suppression");
    } else {
        card.style.transition = "0.4s";
        card.style.transform = "scale(0) rotate(15deg)";
        card.style.opacity = "0";
        setTimeout(() => { card.remove(); }, 400);
    }
};

/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', () => {
    // Aperçu de l'image lors du choix du fichier
    const imgInput = document.getElementById('imageProduit');
    if (imgInput) {
        imgInput.onchange = function() {
            const [file] = this.files;
            if (file) {
                const previewContainer = document.getElementById('preview-container');
                const previewImg = document.getElementById('imagePreview');
                if (previewContainer && previewImg) {
                    previewContainer.style.display = 'block';
                    previewImg.src = URL.createObjectURL(file);
                }
            }
        };
    }

    chargerProduits();
});
