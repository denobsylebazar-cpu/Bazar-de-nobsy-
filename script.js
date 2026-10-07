/* ========== 1. CONFIGURATION SUPABASE - NOUVELLE BASE SANS BUCKET ========== */
const SUPABASE_URL = 'https://grrlsfvttancthbnysyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycmxzZnZ0dGFuY3RoYm55c3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODk0NTcsImV4cCI6MjEwNjg2NTQ1N30.TBbrrvddtKjNQApbKXD6zrIzHL9TaujqEMLelfCxWxA';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.toggleMenu = function() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
};

const sectionsIds = ['pop','jeuxvideo','skylander','livre','film','decoration','vaisselle','bijoux','jeux','peluche','vetement','maquillage','lumiere'];

async function chargerProduits() {
    const { data: products, error } = await db.from('products').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    document.querySelectorAll('.products-grid').forEach(g => g.innerHTML = "");
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
        const grid = document.getElementById(targetId);
        if (grid) {
            grid.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">
                    <input type="checkbox" class="select-product-checkbox" value="${product.id}" style="display:${displayStyle}">
                    <button class="btn-delete-product" style="display:${displayStyle}" onclick="handleDeleteProduct(event)">✕</button>
                    <div class="product-image"><img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'"></div>
                    <div class="product-body">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <p class="product-price"><strong>${product.price}$</strong></p>
                        <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505','_blank')">Commander</button>
                    </div>
                </div>`);
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

window.toggleCatalogue = function() { document.getElementById('catContent').classList.toggle('active'); };
window.filterByCategory = function(cat) {
    document.getElementById('rechercheProduit').value = '';
    sectionsIds.forEach(id => { const s = document.getElementById(id); if (s) s.style.display = 'none'; });
    document.getElementById(cat).style.display = 'block';
    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
    document.getElementById('catContent').classList.remove('active');
};
window.showAllCategories = function() {
    document.getElementById('rechercheProduit').value = '';
    chargerProduits();
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};

/* ========== AJOUT SANS BUCKET - SIMPLE BASE64 ========== */
const form = document.getElementById('formAjoutProduit');
if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const file = document.getElementById('imageProduit').files[0];
        if (!file) return alert("Choisis une photo!");
        if (file.size > 2 * 1024 * 1024) return alert("Photo trop grosse! Prends une photo de moins de 2 Mo");
        btn.disabled = true;
        btn.innerText = "⏳ Envoi...";
        try {
            const base64 = await new Promise((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(r.result);
                r.onerror = () => reject(new Error("Lecture fichier échouée"));
                r.readAsDataURL(file);
            });
            const { data, error } = await db.from('products').insert([{
                name: document.getElementById('nomProduit').value,
                description: document.getElementById('descProduit').value,
                price: parseFloat(document.getElementById('prixProduit').value),
                image_url: base64,
                category: document.getElementById('categorieProduit').value
            }]).select();
            if (error) throw error;
            alert("Produit publié! ✅");
            form.reset();
            document.getElementById('preview-container').style.display = 'none';
            chargerProduits();
        } catch (err) {
            console.error(err);
            alert("Erreur Supabase: " + (err.message || JSON.stringify(err)));
        } finally {
            btn.disabled = false;
            btn.innerText = "🚀 Publier";
        }
    };
}

window.verifierPin = async function() {
    const pin = document.getElementById('inputPin').value.trim();
    if (!/^\d{6}$/.test(pin)) return alert("PIN 6 chiffres");
    const { data, error } = await db.rpc('verify_admin_pin', { pin_code: pin });
    if (error) return alert(error.message);
    if (data!== true) return alert("PIN incorrect");
    document.getElementById('admin').style.display = 'block';
    document.getElementById('popupPin').style.display = 'none';
    document.getElementById('btn-bulk-delete').style.display = 'inline-block';
    document.body.classList.add('admin-open');
    chargerProduits();
};
window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');
    const id = card.getAttribute('data-id');
    const pin = prompt("PIN pour supprimer :");
    if (!pin) return;
    const { error } = await db.rpc('delete_product_secure', { prod_id: Number(id), pin_code: pin.trim() });
    if (error) return alert(error.message);
    card.remove();
    alert("Supprimé!");
};
window.deleteSelectedProducts = async function() {
    const cbs = document.querySelectorAll('.select-product-checkbox:checked');
    if (!cbs.length) return alert("Aucun sélectionné");
    const pin = prompt(`Supprimer ${cbs.length}? PIN :`);
    if (!pin) return;
    let n=0;
    for (let cb of cbs) { const {error} = await db.rpc('delete_product_secure', { prod_id: cb.value, pin_code: pin }); if (!error) n++; }
    alert(n+" supprimé(s)"); chargerProduits();
};
function appliquerRecherche() {
    const val = document.getElementById('rechercheProduit').value.trim().toLowerCase();
    sectionsIds.forEach(id => {
        const sec = document.getElementById(id); if (!sec) return;
        let visible=0;
        sec.querySelectorAll('.product-card').forEach(c => {
            const ok = c.querySelector('.product-name').textContent.toLowerCase().includes(val);
            c.style.display = ok? '' : 'none'; if (ok) visible++;
        });
        sec.style.display = val? (visible?'block':'none') : (sec.querySelectorAll('.product-card').length?'block':'none');
    });
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnAdmin').onclick = () => document.getElementById('popupPin').style.display = 'flex';
    document.getElementById('backToCatalogBtn').onclick = showAllCategories;
    document.getElementById('imageProduit').onchange = function() {
        const [f] = this.files;
        if (f) { document.getElementById('preview-container').style.display = 'block'; document.getElementById('imagePreview').src = URL.createObjectURL(f); }
    };
    chargerProduits();
    const s = document.querySelector('input[placeholder*="Rechercher"]');
    if (s) s.addEventListener("input", function() {
        const r = this.value.trim().toLowerCase();
        document.querySelectorAll(".product-card").forEach(p => {
            const t = p.querySelector("h3"); if (!t) return;
            p.style.display = t.textContent.toLowerCase().includes(r)? "" : "none";
        });
    });
});
