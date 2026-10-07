/* ========== 1. CONFIGURATION SUPABASE - NOUVELLE BASE SANS BUCKET ========== */
const SUPABASE_URL = 'https://grrlsfvttancthbnysyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycmxzZnZ0dGFuY3RoYm55c3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODk0NTcsImV4cCI6MjEwNjg2NTQ1N30.TBbrrvddtKjNQApbKXD6zrIzHL9TaujqEMLelfCxWxA';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ========== MENU HAMBURGER ========== */
window.toggleMenu = function() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
};

/* ========== LISTE DES CATÉGORIES ========== */
const sectionsIds = [
    'pop',
    'jeuxvideo',
    'skylander',
    'livre',
    'film',
    'decoration',
    'vaisselle',
    'bijoux',
    'jeux',
    'peluche',
    'vetement',
    'maquillage',
    'lumiere'
];

/* ========== CHARGEMENT ET TRI DES SECTIONS ========== */
async function chargerProduits() {
    console.log("Mise à jour du catalogue...");
    const { data: products, error } = await db.from('products').select('*').order('created_at', { ascending: false });
    if (error) { console.error("Erreur de chargement:", error.message); return; }
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");
    const isAdmin = document.body.classList.contains('admin-open');
    const displayStyle = isAdmin? 'block' : 'none';
    products.forEach(product => {
        let cat = (product.category || '').toLowerCase().trim();
        let targetId = "grid-decoration";
        if (cat.includes("skylander")) targetId = "grid-skylander";
        else if (cat.includes("vaisselle")) targetId = "grid-vaisselle";
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
            gridElement.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">
                    <input type="checkbox" class="select-product-checkbox" value="${product.id}" style="display: ${displayStyle}">
                    <button class="btn-delete-product" style="display: ${displayStyle}" onclick="handleDeleteProduct(event)">✕</button>
                    <div class="product-image"><img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'"></div>
                    <div class="product-body">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <p class="product-price"><strong>${product.price}$</strong></p>
                        <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
                    </div>
                </div>
            `);
        }
    });
    const container = document.querySelector('#produits.container');
    if (container) {
        sectionsIds.forEach(id => {
            const section = document.getElementById(id);
            const grid = document.getElementById('grid-' + id);
            if (section && grid) {
                if (grid.children.length > 0) { container.prepend(section); section.style.display = "block"; }
                else { container.appendChild(section); section.style.display = "none"; }
            }
        });
    }
    appliquerRecherche();
}

window.toggleCatalogue = function() { const c = document.getElementById('catContent'); if (c) c.classList.toggle('active'); };
window.filterByCategory = function(cat) {
    const r = document.getElementById('rechercheProduit'); if (r) r.value = '';
    sectionsIds.forEach(id => { const s = document.getElementById(id); if (s) s.style.display = 'none'; });
    const sel = document.getElementById(cat); if (sel) { sel.style.display = 'block'; window.scrollTo({ top: sel.offsetTop - 120, behavior: 'smooth' }); }
    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
    document.getElementById('catContent').classList.remove('active');
};
window.showAllCategories = function() {
    const r = document.getElementById('rechercheProduit'); if (r) r.value = '';
    chargerProduits();
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};

/* Compression image pour éviter l'erreur undefined */
function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 800;
                let w = img.width, h = img.height;
                if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/* ========== AJOUTER UN PRODUIT - SANS BUCKET ========== */
const form = document.getElementById('formAjoutProduit');
if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const fileInput = document.getElementById('imageProduit');
        const file = fileInput.files[0];
        if (!file) return alert("Choisis une photo!");
        submitBtn.disabled = true;
        submitBtn.innerText = "⏳ Compression...";
        try {
            const imageBase64 = await compressImage(file);
            submitBtn.innerText = "⏳ Envoi...";
            const { error: insertError } = await db.from('products').insert([{
                name: document.getElementById('nomProduit').value,
                description: document.getElementById('descProduit').value,
                price: parseFloat(document.getElementById('prixProduit').value),
                image_url: imageBase64,
                category: document.getElementById('categorieProduit').value
            }]);
            if (insertError) throw insertError;
            alert("Produit publié! ✅");
            form.reset();
            document.getElementById('preview-container').style.display = 'none';
            chargerProduits();
        } catch (err) {
            console.error(err);
            alert("Erreur: " + (err.message || JSON.stringify(err)));
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "🚀 Publier";
        }
    };
}

window.verifierPin = async function() {
    const input = document.getElementById('inputPin');
    const pin = input.value.trim();
    if (!/^\d{6}$/.test(pin)) { alert("Veuillez entrer un PIN de 6 chiffres."); return; }
    try {
        const { data, error } = await db.rpc('verify_admin_pin', { pin_code: pin });
        if (error) { alert("Erreur Supabase : " + error.message); return; }
        if (data!== true) { alert("Code PIN incorrect!"); input.value = ""; return; }
        document.getElementById('admin').style.display = 'block';
        document.getElementById('popupPin').style.display = 'none';
        document.getElementById('btn-bulk-delete').style.display = 'inline-block';
        document.body.classList.add('admin-open');
        chargerProduits();
        document.getElementById('admin').scrollIntoView({ behavior: 'smooth' });
    } catch (err) { alert(err.message); }
};

window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    if (!card) return alert("Produit introuvable.");
    const id = card.getAttribute('data-id');
    const pin = prompt("Entrez le code PIN pour supprimer :");
    if (!pin) return;
    try {
        const { error } = await db.rpc('delete_product_secure', { prod_id: Number(id), pin_code: pin.trim() });
        if (error) { alert("Échec : " + error.message); return; }
        card.style.transition = "transform 300ms ease, opacity 300ms ease";
        card.style.transform = "scale(0)"; card.style.opacity = "0";
        setTimeout(() => { card.remove(); }, 300);
        alert("Produit supprimé!");
    } catch (err) { alert(err.message); }
};

window.deleteSelectedProducts = async function() {
    const checkboxes = document.querySelectorAll('.select-product-checkbox:checked');
    if (checkboxes.length === 0) return alert("Aucun produit sélectionné");
    const pin = prompt(`Supprimer ${checkboxes.length} produits? PIN :`);
    if (!pin) return;
    let successCount = 0;
    for (let cb of checkboxes) {
        const { error } = await db.rpc('delete_product_secure', { prod_id: cb.value, pin_code: pin });
        if (!error) successCount++;
    }
    if (successCount > 0) { alert(`${successCount} supprimé(s).`); chargerProduits(); }
    else alert("Erreur ou PIN incorrect.");
};

function appliquerRecherche() {
    const rechercheInput = document.getElementById('rechercheProduit');
    if (!rechercheInput) return;
    const recherche = rechercheInput.value.trim().toLowerCase();
    sectionsIds.forEach(id => {
        const section = document.getElementById(id); if (!section) return;
        const cartes = section.querySelectorAll('.product-card');
        let cartesVisibles = 0;
        cartes.forEach(carte => {
            const nom = carte.querySelector('.product-name');
            const correspond = nom && nom.textContent.toLowerCase().includes(recherche);
            carte.style.display = correspond? '' : 'none';
            if (correspond) cartesVisibles++;
        });
        section.style.display = recherche? (cartesVisibles > 0? 'block' : 'none') : (cartes.length > 0? 'block' : 'none');
    });
    const hasSearch =!!rechercheInput.value.trim();
    document.getElementById('default-title').style.display = hasSearch? 'none' : 'block';
    document.getElementById('category-back-button').style.display = hasSearch? 'block' : 'none';
}

const rechercheProduit = document.getElementById('rechercheProduit');
if (rechercheProduit) rechercheProduit.addEventListener('input', appliquerRecherche);

document.addEventListener('DOMContentLoaded', () => {
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) btnAdmin.onclick = () => { document.getElementById('popupPin').style.display = 'flex'; };
    const backBtn = document.getElementById('backToCatalogBtn'); if (backBtn) backBtn.onclick = showAllCategories;
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
    chargerProduits();
});

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector('input[placeholder*="Rechercher"]');
    if (!searchInput) return;
    searchInput.addEventListener("input", function () {
        const recherche = this.value.trim().toLowerCase();
        document.querySelectorAll(".product-card").forEach(function (produit) {
            const titre = produit.querySelector("h3"); if (!titre) return;
            produit.style.display = titre.textContent.toLowerCase().includes(recherche)? "" : "none";
        });
    });
});
