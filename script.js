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

    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

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

/* ========== AJOUTER UN PRODUIT (AVEC UPLOAD PHOTO) ========== */
const form = document.getElementById('formAjoutProduit');
if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const fileInput = document.getElementById('imageProduit');
        const file = fileInput.files[0];

        if (!file) {
            alert("Veuillez sélectionner une photo !");
            return;
        }

        // 1. Désactiver le bouton et montrer l'état de chargement
        submitBtn.disabled = true;
        submitBtn.innerText = "⏳ Upload de la photo...";

        try {
            // 2. Créer un nom de fichier unique
            const fileName = Date.now() + "-" + file.name;

            // 3. Envoyer le fichier vers Supabase Storage
            const { data: uploadData, error: uploadError } = await db.storage
                .from('product-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 4. Obtenir l'URL publique de la photo
            const { data: publicUrlData } = db.storage
                .from('product-images')
                .getPublicUrl(fileName);
            
            const photoUrl = publicUrlData.publicUrl;

            // 5. Enregistrer les infos du produit dans la base de données
            submitBtn.innerText = "📝 Création du produit...";
            const nouveau = {
                name: document.getElementById('nomProduit').value,
                description: document.getElementById('descProduit').value,
                price: parseFloat(document.getElementById('prixProduit').value),
                image_url: photoUrl, // On utilise le lien de l'image uploadée
                category: document.getElementById('categorieProduit').value
            };

            const { error: dbError } = await db.from('products').insert([nouveau]);

            if (dbError) throw dbError;

            alert("Produit ajouté avec succès ! ✓");
            form.reset();
            document.getElementById('preview-container').style.display = 'none'; // Cacher l'aperçu
            document.getElementById('admin').style.display = 'none';
            document.body.classList.remove('admin-open');
            chargerProduits();

        } catch (error) {
            alert("Erreur : " + error.message);
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "🚀 Publier le produit";
        }
    };
}

// Fonction pour afficher l'aperçu de l'image sélectionnée
const imageProduitInput = document.getElementById('imageProduit');
if (imageProduitInput) {
    imageProduitInput.onchange = function() {
        const [file] = this.files;
        if (file) {
            const previewContainer = document.getElementById('preview-container');
            const previewImg = document.getElementById('imagePreview');
            previewContainer.style.display = 'block';
            previewImg.src = URL.createObjectURL(file);
        }
    };
}

/* ========== SUPPRIMER UN PRODUIT ========== */
window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    const confirmation = prompt("Entrez le code PIN pour confirmer la suppression :");
    
    if (confirmation === CODE_ADMIN) {
        const { error } = await db.from('products').delete().eq('id', id);
        if (error) {
            alert("Erreur base de données : " + error.message);
        } else {
            card.style.transform = "scale(0)";
            card.style.opacity = "0";
            setTimeout(() => {
                card.remove();
                console.log("Produit supprimé ✓");
            }, 300);
        }
    } else if (confirmation !== null) {
        alert("Code PIN incorrect ❌");
    }
};

/* ========== CATALOGUE & FILTRES ========== */
window.filterByCategory = function(cat) {
    const sections = ['decoration', 'vaisselle', 'bijoux', 'jeux', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'];
    sections.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = 'none';
    });
    const selected = document.getElementById(cat);
    if (selected) {
        selected.style.display = 'block';
        window.scrollTo({ top: selected.offsetTop - 100, behavior: 'smooth' });
    }
    document.getElementById('category-back-button').style.display = 'block';
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
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) {
        btnAdmin.onclick = () => {
            document.getElementById('popupPin').style.display = 'flex';
        };
    }

    document.querySelectorAll('.catalogue-link').forEach(link => {
        link.onclick = function(e) {
            e.preventDefault();
            filterByCategory(this.getAttribute('data-category'));
        };
    });

    const backBtn = document.getElementById('backToCatalogBtn');
    if (backBtn) backBtn.onclick = showAllCategories;

    chargerProduits();
});
