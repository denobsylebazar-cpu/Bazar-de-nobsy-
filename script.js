const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ========== ADMIN : APPARITION FORMULAIRE ========== */
window.verifierPin = function() {
    const pin = document.getElementById('inputPin').value;
    if (pin === "200611") {
        // AFFICHE LE FORMULAIRE DIRECTEMENT
        const adminSection = document.getElementById('admin');
        adminSection.style.display = 'block';
        
        // CACHE LE POPUP
        document.getElementById('popupPin').style.display = 'none';
        
        // ACTIVE LES BOUTONS SUPPRIMER
        document.body.classList.add('admin-open');
        document.querySelectorAll('.btn-delete-product').forEach(b => b.style.display = 'block');
        
        // DÉFILEMENT VERS LE FORMULAIRE
        adminSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert("PIN incorrect");
    }
};

/* ========== CHARGEMENT & TRI ========== */
async function chargerProduits() {
    const { data: products, error } = await db.from('products').select('*').order('created_at', { ascending: false });
    if (error) return;

    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    products.forEach(product => {
        let cat = product.category.toLowerCase().trim();
        let targetId = "grid-decoration";

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
            gridElement.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">
                    <button class="btn-delete-product" style="display: ${showX}" onclick="handleDeleteProduct(event)">✕</button>
                    <div class="product-image"><img src="${product.image_url}" onerror="this.src='https://via.placeholder.com/150'"></div>
                    <div class="product-body">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <p class="product-price"><strong>${product.price}$</strong></p>
                        <button class="btn-hero" style="max-width:100%;" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
                    </div>
                </div>`);
        }
    });

    // TRI : Remonter les sections pleines
    const container = document.querySelector('#produits .container');
    const sectionsIds = ['pop', 'jeuxvideo', 'livre', 'film', 'decoration', 'vaisselle', 'bijoux', 'jeux', 'peluche', 'vetement', 'maquillage', 'lumiere'];
    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        const grid = document.getElementById('grid-' + id);
        if (section && grid && grid.children.length > 0) {
            container.prepend(section);
            section.style.display = "block";
        }
    });
}

/* ========== AUTRES FONCTIONS ========== */
window.toggleMenu = function() { document.getElementById('navMenu').classList.toggle('active'); };
window.toggleCatalogue = function() { document.getElementById('catContent').classList.toggle('active'); };

window.filterByCategory = function(cat) {
    const ids = ['pop','jeuxvideo','livre','film','decoration','vaisselle','bijoux','jeux','peluche','vetement','maquillage','lumiere'];
    ids.forEach(id => { const s = document.getElementById(id); if (s) s.style.display = 'none'; });
    const selected = document.getElementById(cat);
    if (selected) {
        selected.style.display = 'block';
        window.scrollTo({ top: selected.offsetTop - 130, behavior: 'smooth' });
    }
    if (document.getElementById('catContent')) document.getElementById('catContent').classList.remove('active');
};

window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    const pin = prompt("Code PIN :");
    if (pin === "200611") {
        const { error } = await db.rpc('delete_product_secure', { prod_id: id, pin_code: pin });
        if (!error) card.remove();
    }
};

/* ========== AJOUT PRODUIT ========== */
const form = document.getElementById('formAjoutProduit');
if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const file = document.getElementById('imageProduit').files[0];
        if (!file) return alert("Photo requise");
        submitBtn.disabled = true;
        submitBtn.innerText = "⏳ Envoi...";
        try {
            const fileName = Date.now() + "-" + file.name;
            await db.storage.from('product-images').upload(fileName, file);
            const { data: linkData } = db.storage.from('product-images').getPublicUrl(fileName);
            await db.from('products').insert([{
                name: document.getElementById('nomProduit').value,
                description: document.getElementById('descProduit').value,
                price: parseFloat(document.getElementById('prixProduit').value),
                image_url: linkData.publicUrl,
                category: document.getElementById('categorieProduit').value
            }]);
            alert("Publié ! ✅");
            form.reset();
            document.getElementById('admin').style.display = 'none';
            chargerProduits();
        } catch (err) { alert("Erreur"); } 
        finally { submitBtn.disabled = false; submitBtn.innerText = "🚀 Publier"; }
    };
}

// Aperçu image
const imgInput = document.getElementById('imageProduit');
if (imgInput) {
    imgInput.onchange = function() {
        const [file] = this.files;
        if (file) {
            document.getElementById('preview-container').style.display = 'block';
            document.getElementById('imagePreview').src = URL.createObjectURL(file);
        }
    };
}

document.addEventListener('DOMContentLoaded', chargerProduits);
