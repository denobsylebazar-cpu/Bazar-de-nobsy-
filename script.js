// 1. CONFIGURATION
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ========== CHARGEMENT ET TRI DES SECTIONS ========== */
async function chargerProduits() {
    console.log("Mise à jour du catalogue...");
    
    const { data: products, error } = await db
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    products.forEach(product => {
        let cat = product.category.toLowerCase().trim();
        let targetId = "grid-decoration"; // Par défaut

        if (cat.includes("vaisselle")) targetId = "grid-vaisselle";
        else if (cat.includes("bijoux")) targetId = "grid-bijoux";
        else if (cat.includes("pop")) targetId = "grid-pop";
        else if (cat.includes("livre")) targetId = "grid-livre"; // NOUVEAU
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
                    <div class="product-image">
                        <img src="${product.image_url}" alt="${product.name} - Bazar de Nobsy Joliette" onerror="this.src='https://via.placeholder.com/150'">
                    </div>
                    <div class="product-body">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p class="price"><strong>${product.price}$</strong></p>
                        <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
                    </div>
                </div>`);
        }
    });

    const container = document.querySelector('#produits .container');
    // AJOUT DE 'livre' DANS LA LISTE DE TRI
    const sectionsIds = ['decoration', 'vaisselle', 'bijoux', 'jeux', 'pop', 'livre', 'jeuxvideo', 'film', 'peluche', 'vetement', 'maquillage', 'lumiere'];

    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        const grid = document.getElementById('grid-' + id);
        if (section && grid) {
            if (grid.children.length > 0) {
                container.prepend(section); 
                section.style.opacity = "1";
                section.style.display = "block";
            } else {
                container.appendChild(section);
                section.style.opacity = "0.5";
            }
        }
    });
}

/* GESTION ADMIN (Inchangée mais garde 'livre' dans filterByCategory) */
window.filterByCategory = function(cat) {
    const ids = ['decoration','vaisselle','bijoux','jeux','pop','livre','jeuxvideo','film','peluche','vetement','maquillage','lumiere'];
    ids.forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = 'none';
    });
    const selected = document.getElementById(cat);
    if (selected) {
        selected.style.display = 'block';
        selected.style.opacity = '1';
    }
    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
};

// ... (Garde le reste de ton code identique pour le formulaire, suppression, etc.)
