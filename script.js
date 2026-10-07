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
    if (!products) return;
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
        else if (cat.includes("jeuxvideo") || cat.includes("jeux video")) targetId = "grid-jeuxvideo";
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
                    <div class="product-image"><img src="${product.image_url}" alt="${product.name}"></div>
                    <div class="product-body">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <p class="product-price"><strong>${product.price}$</strong></p>
                        <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505','_blank')">Commander</button>
                    </div>
                </div>`);
        }
    });
    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        const grid = document.getElementById('grid-' + id);
        if (section && grid) {
            section.style.display = grid.children.length > 0? "block" : "none";
        }
    });
    appliquerRecherche();
}

window.toggleCatalogue = function() { const c = document.getElementById('catContent'); if (c) c.classList.toggle('active'); };
window.filterByCategory = function(cat) {
    const r = document.getElementById('rechercheProduit'); if (r) r.value = '';
    sectionsIds.forEach(id => { const s = document.getElementById(id); if (s) s.style.display = 'none'; });
    const selected = document.getElementById(cat);
    if (selected) { selected.style.display = 'block'; selected.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    const backBtn = document.getElementById('category-back-button'); const defTitle = document.getElementById('default-title');
    if (backBtn) backBtn.style.display = 'block'; if (defTitle) defTitle.style.display = 'none';
    const catContent = document.getElementById('catContent'); if (catContent) catContent.classList.remove('active');
};
window.showAllCategories = function() {
    const r = document.getElementById('rechercheProduit'); if (r) r.value = '';
    sectionsIds.forEach(id => {
        const section = document.getElementById(id); const grid = document.getElementById('grid-' + id);
        if (section && grid) section.style.display = grid.children.length > 0? "block" : "none";
    });
    const backBtn = document.getElementById('category-back-button'); const defTitle = document.getElementById('default-title');
    if (backBtn) backBtn.style.display = 'none'; if (defTitle) defTitle.style.display = 'block';
    appliquerRecherche();
};

// CONVERSION IMAGE ROBUSTE POUR MOBILE
function fileToBase64Compressed(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            const MAX = 800;
            if (w > MAX || h > MAX) {
                if (w > h) { h = h * MAX / w; w = MAX; } else { w = w * MAX / h; h = MAX; }
            }
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            // Fallback simple si canvas échoue
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Impossible de lire l'image"));
            reader.readAsDataURL(file);
        };
        img.src = url;
    });
}

const form = document.getElementById('formAjoutProduit');
if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const file = document.getElementById('imageProduit').files[0];
        if (!file) return alert("Choisis une photo!");
        btn.disabled = true;
        btn.innerText = "⏳ Compression...";
        try {
            const base64 = await fileToBase64Compressed(file);
            btn.innerText = "⏳ Envoi...";
            const { error } = await db.from('products').insert([{
                name: document.getElementById('nomProduit').value,
                description: document.getElementById('descProduit').value,
                price: parseFloat(document.getElementById('prixProduit').value),
                image_url: base64,
                category: document.getElementById('categorieProduit').value
            }]);
            if (error) throw error;
            alert("Publié! ✅");
            form.reset();
            document.getElementById('preview-container').style.display = 'none';
            chargerProduits();
        } catch (err) {
            console.error(err);
            alert("Erreur: " + (err.message || JSON.stringify(err)));
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
    const pin = prompt("PIN:"); if (!pin) return;
    const { error } = await db.rpc('delete_product_secure', { prod_id: Number(id), pin_code: pin.trim() });
    if (error) return alert(error.message); card.remove();
};
window.deleteSelectedProducts = async function() {
    const cbs = document.querySelectorAll('.select-product-checkbox:checked');
    if (!cbs.length) return alert("Aucun");
    const pin = prompt(`Supprimer ${cbs.length}? PIN:`); if (!pin) return;
    let n = 0; for (let cb of cbs) { const { error } = await db.rpc('delete_product_secure', { prod_id: cb.value, pin_code: pin }); if (!error) n++; }
    alert(n + " supprimé(s)"); chargerProduits();
};
function appliquerRecherche() {
    const input = document.getElementById('rechercheProduit'); if (!input) return;
    const recherche = input.value.trim().toLowerCase();
    if (!recherche) {
        sectionsIds.forEach(id => { const sec = document.getElementById(id); const grid = document.getElementById('grid-' + id); if (sec && grid) sec.style.display = grid.children.length > 0? 'block' : 'none'; });
        return;
    }
    sectionsIds.forEach(id => {
        const section = document.getElementById(id); if (!section) return;
        let visibles = 0;
        section.querySelectorAll('.product-card').forEach(c => {
            const nom = c.querySelector('.product-name'); const ok = nom && nom.textContent.toLowerCase().includes(recherche);
            c.style.display = ok? '' : 'none'; if (ok) visibles++;
        });
        section.style.display = visibles > 0? 'block' : 'none';
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const btnAdmin = document.getElementById('btnAdmin'); if (btnAdmin) btnAdmin.onclick = () => document.getElementById('popupPin').style.display = 'flex';
    const backBtn = document.getElementById('backToCatalogBtn'); if (backBtn) backBtn.onclick = showAllCategories;
    const imgInput = document.getElementById('imageProduit');
    if (imgInput) {
        imgInput.onchange = function() { const [f] = this.files; if (f) { document.getElementById('preview-container').style.display = 'block'; document.getElementById('imagePreview').src = URL.createObjectURL(f); } };
    }
    const rechercheInput = document.getElementById('rechercheProduit'); if (rechercheInput) rechercheInput.addEventListener('input', appliquerRecherche);
    chargerProduits();
});
