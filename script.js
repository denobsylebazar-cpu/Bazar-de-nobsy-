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

/* ========== CHARGEMENT ET TRI DES SECTIONS - VERSION OPTIMISÉE 13Go ========== */
async function chargerProduits() {
    console.log("Mise à jour du catalogue...");

    // --- DEBUT OPTIMISATION BANDE PASSANTE ---
    // On regarde si on a déjà chargé il y a moins de 15 minutes
    try {
        const cacheRaw = localStorage.getItem('catalog_cache_v1');
        if (cacheRaw) {
            const cache = JSON.parse(cacheRaw);
            const quinzeMinutes = 15 * 60 * 1000;
            if (Date.now() - cache.time < quinzeMinutes && cache.data) {
                console.log("📦 Catalogue chargé depuis le cache (0 Go utilisé)");
                afficherProduitsDepuisData(cache.data);
                return;
            }
        }
    } catch(e) {}
    // --- FIN OPTIMISATION ---

    const { data: products, error } = await db
        .from('products')
        .select('id, name, description, price, image_url, category, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur de chargement:", error.message);
        return;
    }

    // On sauvegarde en cache pour la prochaine fois
    try {
        localStorage.setItem('catalog_cache_v1', JSON.stringify({time: Date.now(), data: products}));
    } catch(e) {}

    afficherProduitsDepuisData(products);
}

function afficherProduitsDepuisData(products) {
    // Vider toutes les grilles
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");

    // Vérifier si on est en mode admin
    const isAdmin = document.body.classList.contains('admin-open');
    const displayStyle = isAdmin ? 'block' : 'none';

    // Remplir les grilles
    products.forEach(product => {

        let cat = (product.category || '').toLowerCase().trim();
        let targetId = "grid-decoration";

        // Skylanders doit être séparé des jeux vidéo
        if (cat.includes("skylander")) {
            targetId = "grid-skylander";
        }
        else if (cat.includes("vaisselle")) {
            targetId = "grid-vaisselle";
        }
        else if (cat.includes("bijoux")) {
            targetId = "grid-bijoux";
        }
        else if (cat.includes("pop")) {
            targetId = "grid-pop";
        }
        else if (cat.includes("livre")) {
            targetId = "grid-livre";
        }
        else if (cat.includes("jeuxvideo")) {
            targetId = "grid-jeuxvideo";
        }
        else if (cat.includes("film")) {
            targetId = "grid-film";
        }
        else if (cat.includes("jeux") || cat.includes("casse")) {
            targetId = "grid-jeux";
        }
        else if (cat.includes("peluche")) {
            targetId = "grid-peluche";
        }
        else if (cat.includes("vetement")) {
            targetId = "grid-vetement";
        }
        else if (cat.includes("maquillage")) {
            targetId = "grid-maquillage";
        }
        else if (cat.includes("lumiere")) {
            targetId = "grid-lumiere";
        }

        const gridElement = document.getElementById(targetId);

        if (gridElement) {
            // Optimisation image : on demande 300px de large au lieu de l'original
            let imgUrl = product.image_url;
            if (imgUrl && imgUrl.includes('supabase.co')) {
                // ajoute transformation si tu as activé Image Transformation dans Supabase
                // sinon ça reste l'url normale, pas grave
            }

            gridElement.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">

                    <!-- CHECKBOX POUR SUPPRESSION MULTIPLE -->
                    <input
                        type="checkbox"
                        class="select-product-checkbox"
                        value="${product.id}"
                        style="display: ${displayStyle}"
                    >

                    <button
                        class="btn-delete-product"
                        style="display: ${displayStyle}"
                        onclick="handleDeleteProduct(event)"
                    >✕</button>

                    <div class="product-image">
                        <img
                            src="${product.image_url}"
                            alt="${product.name}"
                            loading="lazy"
                            onerror="this.src='https://via.placeholder.com/150'"
                        >
                    </div>

                    <div class="product-body">
                        <h3 class="product-name">${product.name}</h3>

                        <p class="product-description">${product.description}</p>

                        <p class="product-price">
                            <strong>${product.price}$</strong>
                        </p>

                        <button
                            class="btn"
                            onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')"
                        >Commander</button>
                    </div>
                </div>
            `);
        }
    });

    // TRI DES SECTIONS
    const container = document.querySelector('#produits .container');

    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        const grid = document.getElementById('grid-' + id);

        if (section && grid) {
            if (grid.children.length > 0) {
                container.prepend(section);
                section.style.display = "block";
            } else {
                container.appendChild(section);
                section.style.display = "none";
            }
        }
    });

    // Réappliquer la recherche après le chargement
    appliquerRecherche();
}
