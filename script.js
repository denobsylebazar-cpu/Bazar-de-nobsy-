/* ========== 1. CONFIGURATION SUPABASE ========== */
const SUPABASE_URL = 'https://grrlsfvttancthbnysyn.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycmxzZnZ0dGFuY3RoYm55c3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODk0NTcsImV4cCI6MjEwNjg2NTQ1N30.TBbrrvddtKjNQApbKXD6zrIzHL9TaujqEMLelfCxWxA';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Deuxième projet Supabase
const SUPABASE_URL_2 = 'https://exhlnudmbnounidmxqhh.supabase.co';
const SUPABASE_ANON_KEY_2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJleGhsbnVkbWJub3VuaWRteHFoaGgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc5MTYxMDA5NSwiZXhwIjoyMTA3MTg2MDk1fQ.PXx9Ovv651ESeyX6-ZHAunEWhnf3pH_xNiC87r52FfA';

const db2 = supabase.createClient(SUPABASE_URL_2, SUPABASE_ANON_KEY_2);

const basesSupabase = [
    { key: 'db1', nom: 'Supabase 1', client: db },
    { key: 'db2', nom: 'Supabase 2', client: db2 }
];

const produitsAffiches = new Map();

function normaliserTexte(texte) {
    return (texte || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

async function recupererTousLesProduits() {
    const resultats = await Promise.all(
        basesSupabase.map(async base => {
            const { data, error } = await base.client
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(base.nom + ' : ' + error.message);
            }

            return (data || []).map(product => ({
                ...product,
                _source: base.key,
                _client: base.client
            }));
        })
    );

    const tous = resultats.flat();
    const uniques = new Map();

    tous.forEach(product => {
        const cle = [
            normaliserTexte(product.name),
            normaliserTexte(product.category),
            String(Number(product.price || 0))
        ].join('|');

        if (!uniques.has(cle)) {
            uniques.set(cle, {
                ...product,
                _records: [product]
            });
        } else {
            uniques.get(cle)._records.push(product);
        }
    });

    return Array.from(uniques.values());
}

async function actualiserTableauAdmin() {
    const stats = [];

    for (const base of basesSupabase) {
        const { count, error } = await base.client
            .from('products')
            .select('id', { count: 'exact', head: true });

        stats.push({
            nom: base.nom,
            count: error ? null : count,
            erreur: error ? error.message : null
        });
    }

    let panel = document.getElementById('tableau-stats-supabase');

    if (!panel) {
        const admin = document.getElementById('admin');
        if (!admin) return;

        panel = document.createElement('div');
        panel.id = 'tableau-stats-supabase';
        panel.style.cssText =
            'margin:15px 0;padding:12px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#222;';
        admin.prepend(panel);
    }

    panel.innerHTML = `
        <h3 style="margin:0 0 10px;">📊 État des bases de données</h3>
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr>
                    <th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Base</th>
                    <th style="text-align:right;padding:6px;border-bottom:1px solid #ddd;">Produits</th>
                </tr>
            </thead>
            <tbody>
                ${stats.map((stat, index) => `
                    <tr>
                        <td style="padding:6px;border-bottom:1px solid #eee;">
                            ${stat.nom}${index === 0 ? ' (limite 80)' : ''}
                        </td>
                        <td style="text-align:right;padding:6px;border-bottom:1px solid #eee;">
                            ${stat.erreur ? 'Erreur de lecture' : stat.count}
                            ${index === 0 && stat.count !== null ? ' / 80' : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="margin:8px 0 0;font-size:12px;">
            Les nouveaux produits vont dans Supabase 1 jusqu’à 80 produits, puis dans Supabase 2.
        </p>
    `;
}

function extraireCheminPhoto(imageUrl) {
    if (!imageUrl) return null;

    try {
        const url = new URL(imageUrl);
        const marqueur = '/storage/v1/object/public/product-images/';
        const position = url.pathname.indexOf(marqueur);

        if (position === -1) return null;

        return decodeURIComponent(
            url.pathname.slice(position + marqueur.length)
        );
    } catch {
        return null;
    }
}

async function supprimerPhotoSiInutilisee(base, imageUrl) {
    if (!imageUrl) return;

    const { data: encoreUtilisee, error: rechercheErreur } =
        await base.client
            .from('products')
            .select('id')
            .eq('image_url', imageUrl)
            .limit(1);

    if (rechercheErreur ||
        (encoreUtilisee && encoreUtilisee.length > 0)) {
        return;
    }

    const chemin = extraireCheminPhoto(imageUrl);
    if (!chemin) return;

    const { error } = await base.client.storage
        .from('product-images')
        .remove([chemin]);

    if (error) {
        console.warn(
            'Produit supprimé, mais la photo n’a pas pu être supprimée du bucket ' +
            base.nom + ':',
            error.message
        );
    }
}

async function supprimerEnregistrementProduit(product, pin) {
    const base = basesSupabase.find(
        item => item.key === product._source
    );

    if (!base) {
        throw new Error('Base de données du produit introuvable.');
    }

    const { error } = await base.client.rpc('delete_product_secure', {
        prod_id: Number(product.id),
        pin_code: pin.trim()
    });

    if (error) {
        throw new Error(base.nom + ' : ' + error.message);
    }

    await supprimerPhotoSiInutilisee(base, product.image_url);
}


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


/* ========== CHARGEMENT DES PRODUITS ========== */
async function chargerProduits() {
    console.log('Mise à jour du catalogue...');

    let products;

    try {
        products = await recupererTousLesProduits();
    } catch (error) {
        console.error('Erreur de chargement:', error.message);
        alert('Erreur lors du chargement des produits : ' + error.message);
        return;
    }

    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = '');

    produitsAffiches.clear();

    const isAdmin = document.body.classList.contains('admin-open');
    const displayStyle = isAdmin ? 'block' : 'none';

    products.forEach((product, index) => {
        const cat = (product.category || '').toLowerCase().trim();
        let targetId = 'grid-decoration';

        if (cat.includes('skylander')) {
            targetId = 'grid-skylander';
        } else if (cat.includes('vaisselle')) {
            targetId = 'grid-vaisselle';
        } else if (cat.includes('bijoux')) {
            targetId = 'grid-bijoux';
        } else if (cat.includes('pop')) {
            targetId = 'grid-pop';
        } else if (cat.includes('livre')) {
            targetId = 'grid-livre';
        } else if (cat.includes('jeuxvideo')) {
            targetId = 'grid-jeuxvideo';
        } else if (cat.includes('film')) {
            targetId = 'grid-film';
        } else if (cat.includes('jeux') || cat.includes('casse')) {
            targetId = 'grid-jeux';
        } else if (cat.includes('peluche')) {
            targetId = 'grid-peluche';
        } else if (cat.includes('vetement')) {
            targetId = 'grid-vetement';
        } else if (cat.includes('maquillage')) {
            targetId = 'grid-maquillage';
        } else if (cat.includes('lumiere')) {
            targetId = 'grid-lumiere';
        }

        const gridElement = document.getElementById(targetId);
        const cardToken = 'produit-' + index;

        produitsAffiches.set(
            cardToken,
            product._records || [product]
        );

        if (!gridElement) return;

        const escapeHtml = value =>
            String(value ?? '').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char]));

        const safeName = escapeHtml(product.name);
        const safeDescription = escapeHtml(product.description);
        const safeImage = escapeHtml(product.image_url);

        gridElement.insertAdjacentHTML('beforeend', `
            <div class="product-card"
                 data-id="${product.id}"
                 data-card-token="${cardToken}">

                <input
                    type="checkbox"
                    class="select-product-checkbox"
                    value="${cardToken}"
                    style="display:${displayStyle}"
                >

                <button
                    class="btn-delete-product"
                    style="display:${displayStyle}"
                    onclick="handleDeleteProduct(event)"
                >✕</button>

                <div class="product-image">
                    <img
                        src="${safeImage}"
                        alt="${safeName}"
                        onerror="this.src='https://via.placeholder.com/150'"
                    >
                </div>

                <div class="product-body">
                    <h3 class="product-name">${safeName}</h3>
                    <p class="product-description">${safeDescription}</p>
                    <p class="product-price">
                        <strong>${product.price}$</strong>
                    </p>
                    <button
                        class="btn"
                        onclick="window.open('https://www.facebook.com/noemie.nadeau.705505','_blank')"
                    >Commander</button>
                </div>
            </div>
        `);
    });

    const container = document.querySelector('#produits .container');

    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        const grid = document.getElementById('grid-' + id);

        if (section && grid && container) {
            if (grid.children.length > 0) {
                container.prepend(section);
                section.style.display = 'block';
            } else {
                container.appendChild(section);
                section.style.display = 'none';
            }
        }
    });

    appliquerRecherche();

    if (document.body.classList.contains('admin-open')) {
        await actualiserTableauAdmin();
    }
}


/* ========== CATALOGUE DU BAS ========== */
window.toggleCatalogue = function() {
    const content = document.getElementById('catContent');
    if (content) content.classList.toggle('active');
};


/* ========== FILTRAGE PAR CATÉGORIE ========== */
window.filterByCategory = function(cat) {
    const recherche = document.getElementById('rechercheProduit');
    if (recherche) recherche.value = '';

    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
    });

    const selected = document.getElementById(cat);

    if (selected) {
        selected.style.display = 'block';
        window.scrollTo({
            top: selected.offsetTop - 120,
            behavior: 'smooth'
        });
    }

    const backButton = document.getElementById('category-back-button');
    const title = document.getElementById('default-title');

    if (backButton) backButton.style.display = 'block';
    if (title) title.style.display = 'none';

    const content = document.getElementById('catContent');
    if (content) content.classList.remove('active');
};


/* ========== AFFICHER TOUTES LES CATÉGORIES ========== */
window.showAllCategories = function() {
    const recherche = document.getElementById('rechercheProduit');
    if (recherche) recherche.value = '';

    chargerProduits();

    const backButton = document.getElementById('category-back-button');
    const title = document.getElementById('default-title');

    if (backButton) backButton.style.display = 'none';
    if (title) title.style.display = 'block';
};


/* ========== AJOUTER UN PRODUIT ========== */
const form = document.getElementById('formAjoutProduit');

if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const fileInput = document.getElementById('imageProduit');
        const file = fileInput.files[0];

        if (!file) return alert('Choisis une photo !');

        submitBtn.disabled = true;
        submitBtn.innerText = '⏳ Envoi...';

        let baseChoisie = null;
        let cheminPhoto = null;

        try {
            const { count, error: countError } = await db
                .from('products')
                .select('id', { count: 'exact', head: true });

            if (countError) {
                throw new Error(
                    'Impossible de compter les produits de la première base : ' +
                    countError.message
                );
            }

            baseChoisie = count < 80 ? basesSupabase[0] : basesSupabase[1];

            const fileName =
                Date.now() + '-' +
                Math.random().toString(36).slice(2, 8) + '-' +
                file.name;

            cheminPhoto = fileName;

            const { error: uploadError } = await baseChoisie.client.storage
                .from('product-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: linkData } = baseChoisie.client.storage
                .from('product-images')
                .getPublicUrl(fileName);

            const { error: insertError } = await baseChoisie.client
                .from('products')
                .insert([{
                    name: document.getElementById('nomProduit').value,
                    description: document.getElementById('descProduit').value,
                    price: parseFloat(document.getElementById('prixProduit').value),
                    image_url: linkData.publicUrl,
                    category: document.getElementById('categorieProduit').value
                }]);

            if (insertError) throw insertError;

            alert('Produit publié dans ' + baseChoisie.nom + ' ! ✅');
            form.reset();

            const preview = document.getElementById('preview-container');
            if (preview) preview.style.display = 'none';

            await chargerProduits();

        } catch (err) {
            if (baseChoisie && cheminPhoto) {
                await baseChoisie.client.storage
                    .from('product-images')
                    .remove([cheminPhoto]);
            }

            alert('Erreur lors de la publication : ' + err.message);

        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = '🚀 Publier';
        }
    };
}


/* ========== GESTION ADMIN & SUPPRESSION ========== */
window.verifierPin = async function() {
    const input = document.getElementById('inputPin');
    const pin = input.value.trim();

    if (!/^\d{6}$/.test(pin)) {
        alert('Veuillez entrer un PIN de 6 chiffres.');
        return;
    }

    try {
        let pinValide = false;
        let derniereErreur = null;

        for (const base of basesSupabase) {
            const { data, error } = await base.client.rpc('verify_admin_pin', {
                pin_code: pin
            });

            if (!error && data === true) {
                pinValide = true;
                break;
            }

            if (error) derniereErreur = error;
        }

        if (!pinValide) {
            if (derniereErreur) {
                console.error('Erreur vérification PIN :', derniereErreur);
            }

            alert(
                'Code PIN incorrect ou vérification indisponible. ' +
                'Vérifie que verify_admin_pin est configurée dans les deux bases.'
            );

            input.value = '';
            input.focus();
            return;
        }

        document.getElementById('admin').style.display = 'block';
        document.getElementById('popupPin').style.display = 'none';
        document.getElementById('btn-bulk-delete').style.display = 'inline-block';
        document.body.classList.add('admin-open');

        await chargerProduits();
        await actualiserTableauAdmin();

        document.getElementById('admin').scrollIntoView({
            behavior: 'smooth'
        });

    } catch (err) {
        console.error('Erreur inattendue :', err);
        alert('Une erreur est survenue : ' + (err.message || err));
    }
};


window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card');

    if (!card) {
        alert('Impossible de trouver le produit à supprimer.');
        return;
    }

    const cardToken = card.getAttribute('data-card-token');
    const records = produitsAffiches.get(cardToken) || [];

    if (!records.length) {
        alert('Identifiant du produit introuvable.');
        return;
    }

    const pin = prompt('Entrez le code PIN pour supprimer :');
    if (!pin) return;

    try {
        for (const product of records) {
            await supprimerEnregistrementProduit(product, pin);
        }

        card.style.transition = 'transform 300ms ease, opacity 300ms ease';
        card.style.transform = 'scale(0)';
        card.style.opacity = '0';

        setTimeout(() => card.remove(), 300);

        produitsAffiches.delete(cardToken);

        alert('Produit supprimé avec succès !');

        await actualiserTableauAdmin();

    } catch (err) {
        console.error('Erreur Supabase lors de la suppression :', err);
        alert('Échec de la suppression :\n' + err.message);
    }
};


/* ========== SUPPRESSION GROUPÉE ========== */
window.deleteSelectedProducts = async function() {
    const checkboxes = document.querySelectorAll(
        '.select-product-checkbox:checked'
    );

    if (checkboxes.length === 0) {
        return alert('Aucun produit sélectionné');
    }

    const pin = prompt(
        `Supprimer ${checkboxes.length} produits ? Entrez le code PIN :`
    );

    if (!pin) return;

    let successCount = 0;
    const errors = [];

    for (const cb of checkboxes) {
        const cardToken = cb.value;
        const records = produitsAffiches.get(cardToken) || [];

        try {
            for (const product of records) {
                await supprimerEnregistrementProduit(product, pin);
            }

            successCount++;

        } catch (err) {
            errors.push(err.message);
        }
    }

    if (successCount > 0) {
        alert(`${successCount} produit(s) supprimé(s).`);
        await chargerProduits();
    } else {
        alert(
            'Aucun produit supprimé. ' +
            (errors[0] || 'Vérifie le PIN et les autorisations Supabase.')
        );
    }

    if (errors.length) {
        console.error('Erreurs de suppression groupée :', errors);
    }
};


/* ========== RECHERCHE RAPIDE ========== */
function appliquerRecherche() {
    const rechercheInput = document.getElementById('rechercheProduit')
        || document.querySelector('input[placeholder*="Rechercher" i]');

    if (!rechercheInput) return;

    const recherche = normaliserTexte(rechercheInput.value);

    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        if (!section) return;

        const cartes = section.querySelectorAll('.product-card');
        let cartesVisibles = 0;

        cartes.forEach(carte => {
            const nom = carte.querySelector('.product-name, h3, h2');

            const correspond = !recherche ||
                (nom && normaliserTexte(nom.textContent).includes(recherche));

            carte.style.display = correspond ? '' : 'none';

            if (correspond) cartesVisibles++;
        });

        section.style.display = cartesVisibles > 0 ? 'block' : 'none';
    });

    const titre = document.getElementById('default-title');
    const boutonRetour = document.getElementById('category-back-button');

    if (titre) titre.style.display = recherche ? 'none' : 'block';
    if (boutonRetour) boutonRetour.style.display = recherche ? 'block' : 'none';
}


/* ========== INITIALISATION ========== */
document.addEventListener('DOMContentLoaded', () => {
    const rechercheInput = document.getElementById('rechercheProduit')
        || document.querySelector('input[placeholder*="Rechercher" i]');

    if (rechercheInput) {
        rechercheInput.addEventListener('input', appliquerRecherche);
    }

    const btnAdmin = document.getElementById('btnAdmin');

    if (btnAdmin) {
        btnAdmin.onclick = () => {
            const popup = document.getElementById('popupPin');
            if (popup) popup.style.display = 'flex';
        };
    }

    const backBtn = document.getElementById('backToCatalogBtn');
    if (backBtn) backBtn.onclick = showAllCategories;

    const imgInput = document.getElementById('imageProduit');

    if (imgInput) {
        imgInput.onchange = function() {
            const [file] = this.files;

            if (file) {
                const previewContainer = document.getElementById('preview-container');
                const imagePreview = document.getElementById('imagePreview');

                if (previewContainer) previewContainer.style.display = 'block';
                if (imagePreview) imagePreview.src = URL.createObjectURL(file);
            }
        };
    }

    chargerProduits();
});
