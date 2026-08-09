
// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://ghcaswgaghkzvyvmzkyb.supabase.co';

const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ3hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4';

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ============================================================
// MENU MOBILE
// ============================================================

window.toggleMenu = function() {
    const menu = document.getElementById('navMenu');

    if (menu) {
        menu.classList.toggle('active');
    }
};


// ============================================================
// TIROIR CATALOGUE
// ============================================================

window.toggleCatalogue = function() {
    const content = document.getElementById('catContent');

    if (content) {
        content.classList.toggle('active');
    }
};


// ============================================================
// CHARGEMENT DES PRODUITS
// ============================================================

async function chargerProduits() {

    const { data: products, error } = await db
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(
            "Erreur lors du chargement des produits :",
            error
        );
        return;
    }

    const grilles = document.querySelectorAll('.products-grid');

    grilles.forEach(grid => {
        grid.innerHTML = "";
    });


    products.forEach(product => {

        let cat = String(product.category || '')
            .toLowerCase()
            .trim();

        let targetId = "grid-decoration";


        if (cat.includes("vaisselle")) {
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

        else if (
            cat.includes("jeuxvideo") ||
            cat.includes("jeux vidéo")
        ) {
            targetId = "grid-jeuxvideo";
        }

        else if (cat.includes("film")) {
            targetId = "grid-film";
        }

        else if (
            cat.includes("jeux") ||
            cat.includes("casse")
        ) {
            targetId = "grid-jeux";
        }

        else if (cat.includes("peluche")) {
            targetId = "grid-peluche";
        }

        else if (
            cat.includes("vetement") ||
            cat.includes("vêtement")
        ) {
            targetId = "grid-vetement";
        }

        else if (cat.includes("maquillage")) {
            targetId = "grid-maquillage";
        }

        else if (cat.includes("lumiere") || cat.includes("lumière")) {
            targetId = "grid-lumiere";
        }


        const gridElement =
            document.getElementById(targetId);


        if (gridElement) {

            const adminMode =
                document.body.classList.contains('admin-open');


            gridElement.insertAdjacentHTML(
                'beforeend',
                `

                <div
                    class="product-card"
                    data-id="${product.id}"
                >

                    ${
                        adminMode
                        ?
                        `
                        <div
                            class="admin-select-product"
                            style="
                                display:block;
                                padding:8px;
                                margin-bottom:5px;
                            "
                        >

                            <label
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:8px;
                                    cursor:pointer;
                                    font-weight:bold;
                                "
                            >

                                <input
                                    type="checkbox"
                                    class="product-checkbox"
                                    value="${product.id}"
                                    onchange="updateDeleteButton()"
                                    style="
                                        width:20px;
                                        height:20px;
                                        cursor:pointer;
                                    "
                                >

                                Sélectionner

                            </label>

                        </div>
                        `
                        :
                        ''
                    }


                    <div class="product-image">

                        <img
                            src="${product.image_url}"
                            onerror="
                                this.src='https://via.placeholder.com/150'
                            "
                        >

                    </div>


                    <div class="product-body">

                        <h3 class="product-name">
                            ${product.name}
                        </h3>


                        <p class="product-description">
                            ${product.description}
                        </p>


                        <p class="product-price">

                            <strong class="price">
                                ${product.price}$
                            </strong>

                        </p>


                        <button
                            class="btn-hero"
                            style="max-width:100%;"
                            onclick="
                                window.open(
                                    'https://www.facebook.com/noemie.nadeau.705505',
                                    '_blank'
                                )
                            "
                        >
                            Commander
                        </button>

                    </div>

                </div>

                `
            );
        }

    });


    // ========================================================
    // TRI : REMONTER LES SECTIONS QUI CONTIENNENT DES PRODUITS
    // ========================================================

    const container =
        document.querySelector('#produits .container');


    const sectionsIds = [
        'pop',
        'jeuxvideo',
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


    sectionsIds.forEach(id => {

        const section =
            document.getElementById(id);

        const grid =
            document.getElementById('grid-' + id);


        if (
            section &&
            grid &&
            grid.children.length > 0
        ) {

            container.prepend(section);

            section.style.display = "block";
        }

    });


    updateDeleteButton();
}


// ============================================================
// FILTRE PAR CATÉGORIE
// ============================================================

window.filterByCategory = function(cat) {

    const ids = [
        'pop',
        'jeuxvideo',
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


    ids.forEach(id => {

        const section =
            document.getElementById(id);

        if (section) {
            section.style.display = 'none';
        }

    });


    const selected =
        document.getElementById(cat);


    if (selected) {

        selected.style.display = 'block';


        window.scrollTo({
            top: selected.offsetTop - 130,
            behavior: 'smooth'
        });

    }


    const backButton =
        document.getElementById(
            'category-back-button'
        );

    if (backButton) {
        backButton.style.display = 'block';
    }


    const defaultTitle =
        document.getElementById(
            'default-title'
        );

    if (defaultTitle) {
        defaultTitle.style.display = 'none';
    }


    const catContent =
        document.getElementById('catContent');

    if (catContent) {
        catContent.classList.remove('active');
    }
};


// ============================================================
// AFFICHER TOUTES LES CATÉGORIES
// ============================================================

window.showAllCategories = function() {

    chargerProduits();


    const backButton =
        document.getElementById(
            'category-back-button'
        );

    if (backButton) {
        backButton.style.display = 'none';
    }


    const defaultTitle =
        document.getElementById(
            'default-title'
        );

    if (defaultTitle) {
        defaultTitle.style.display = 'block';
    }
};


// ============================================================
// ADMIN : VÉRIFICATION DU PIN
// ============================================================

window.verifierPin = function() {

    const pin =
        document.getElementById(
            'inputPin'
        ).value;


    if (pin === "200611") {

        const adminSection =
            document.getElementById(
                'admin'
            );


        adminSection.style.display =
            'block';


        document.getElementById(
            'popupPin'
        ).style.display = 'none';


        document.body.classList.add(
            'admin-open'
        );


        // ----------------------------------------------------
        // IMPORTANT :
        // On NE recharge PAS les produits ici.
        // Les produits déjà affichés restent présents.
        // ----------------------------------------------------

        ajouterSelectionsAuxProduits();


        afficherBoutonSuppression();


        adminSection.scrollIntoView({
            behavior: 'smooth'
        });


    }

    else {

        alert(
            "Code PIN incorrect"
        );

    }
};


// ============================================================
// AJOUTER LES CASES À COCHER AUX PRODUITS EXISTANTS
// ============================================================

function ajouterSelectionsAuxProduits() {

    const cards =
        document.querySelectorAll(
            '.product-card'
        );


    cards.forEach(card => {

        // Éviter de créer deux cases
        if (
            card.querySelector(
                '.admin-select-product'
            )
        ) {
            return;
        }


        const productId =
            card.getAttribute(
                'data-id'
            );


        const selection =
            document.createElement(
                'div'
            );


        selection.className =
            'admin-select-product';


        selection.style.display =
            'block';


        selection.style.padding =
            '8px';


        selection.style.marginBottom =
            '5px';


        selection.innerHTML = `

            <label
                style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    cursor:pointer;
                    font-weight:bold;
                "
            >

                <input
                    type="checkbox"
                    class="product-checkbox"
                    value="${productId}"
                    onchange="updateDeleteButton()"
                    style="
                        width:20px;
                        height:20px;
                        cursor:pointer;
                    "
                >

                Sélectionner

            </label>

        `;


        card.prepend(
            selection
        );

    });


    updateDeleteButton();
}


// ============================================================
// CRÉER LE BOUTON DE SUPPRESSION MULTIPLE
// ============================================================

function afficherBoutonSuppression() {

    // Si le bouton existe déjà, ne rien faire
    if (
        document.getElementById(
            'btnDeleteSelected'
        )
    ) {
        return;
    }


    const adminSection =
        document.getElementById(
            'admin'
        );


    if (!adminSection) {
        return;
    }


    const button =
        document.createElement(
            'button'
        );


    button.id =
        'btnDeleteSelected';


    button.className =
        'btn-hero';


    button.style.maxWidth =
        '100%';


    button.style.marginTop =
        '15px';


    button.style.background =
        '#dc3545';


    button.style.display =
        'block';


    button.innerHTML =
        '🗑️ Supprimer les produits sélectionnés';


    button.onclick =
        supprimerProduitsSelectionnes;


    adminSection.appendChild(
        button
    );
}


// ============================================================
// METTRE À JOUR LE BOUTON DE SUPPRESSION
// ============================================================

window.updateDeleteButton = function() {

    const selected =
        document.querySelectorAll(
            '.product-checkbox:checked'
        );


    const button =
        document.getElementById(
            'btnDeleteSelected'
        );


    if (!button) {
        return;
    }


    if (selected.length === 0) {

        button.innerHTML =
            '🗑️ Supprimer les produits sélectionnés';

    }

    else {

        button.innerHTML =
            `🗑️ Supprimer ${selected.length} produit${
                selected.length > 1 ? 's' : ''
            } sélectionné${
                selected.length > 1 ? 's' : ''
            }`;

    }
};


// ============================================================
// SUPPRESSION MULTIPLE
// ============================================================

window.supprimerProduitsSelectionnes =
    async function() {


    const selected =
        document.querySelectorAll(
            '.product-checkbox:checked'
        );


    if (selected.length === 0) {

        alert(
            "Sélectionne au moins un produit."
        );

        return;
    }


    const nombre =
        selected.length;


    const confirmation =
        confirm(
            `Voulez-vous vraiment supprimer ${nombre} produit${
                nombre > 1 ? 's' : ''
            } ?`
        );


    if (!confirmation) {
        return;
    }


    const ids =
        Array.from(selected).map(
            checkbox =>
                checkbox.value
        );


    const button =
        document.getElementById(
            'btnDeleteSelected'
        );


    if (button) {

        button.disabled =
            true;

        button.innerText =
            "⏳ Suppression...";
    }


    try {

        // ----------------------------------------------------
        // Le PIN n'est plus demandé ici.
        // Le mode admin a déjà été validé.
        // ----------------------------------------------------

        for (
            const id of ids
        ) {

            const { error } =
                await db.rpc(
                    'delete_product_secure',
                    {
                        prod_id: id,
                        pin_code: "200611"
                    }
                );


            if (error) {
                throw error;
            }

        }


        // ----------------------------------------------------
        // Retirer les produits de l'écran sans recharger
        // toute la liste.
        // ----------------------------------------------------

        ids.forEach(id => {

            const card =
                document.querySelector(
                    `.product-card[data-id="${id}"]`
                );


            if (card) {

                card.style.transform =
                    'scale(0)';

                card.style.transition =
                    'transform 0.3s';


                setTimeout(
                    () => {

                        card.remove();

                    },
                    300
                );

            }

        });


        alert(
            `${nombre} produit${
                nombre > 1 ? 's' : ''
            } supprimé${
                nombre > 1 ? 's' : ''
            } avec succès !`
        );


        setTimeout(
            () => {

                updateDeleteButton();

            },
            350
        );


    }

    catch (error) {

        console.error(
            "Erreur suppression :",
            error
        );


        alert(
            "Erreur lors de la suppression : " +
            error.message
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;

            updateDeleteButton();

        }

    }

};


// ============================================================
// AJOUTER UN PRODUIT
// ============================================================

const form =
    document.getElementById(
        'formAjoutProduit'
    );


if (form) {

    form.onsubmit =
        async function(e) {

        e.preventDefault();


        const submitBtn =
            form.querySelector(
                'button[type="submit"]'
            );


        const file =
            document.getElementById(
                'imageProduit'
            ).files[0];


        if (!file) {

            alert(
                "Photo requise"
            );

            return;
        }


        submitBtn.disabled =
            true;


        submitBtn.innerText =
            "⏳ Envoi...";


        try {

            const fileName =
                Date.now() +
                "-" +
                file.name;


            const uploadResult =
                await db.storage
                    .from('product-images')
                    .upload(
                        fileName,
                        file
                    );


            if (uploadResult.error) {
                throw uploadResult.error;
            }


            const { data: linkData } =
                db.storage
                    .from('product-images')
                    .getPublicUrl(
                        fileName
                    );


            const { error: insertError } =
                await db
                    .from('products')
                    .insert([
                        {
                            name:
                                document.getElementById(
                                    'nomProduit'
                                ).value,

                            description:
                                document.getElementById(
                                    'descProduit'
                                ).value,

                            price:
                                parseFloat(
                                    document.getElementById(
                                        'prixProduit'
                                    ).value
                                ),

                            image_url:
                                linkData.publicUrl,

                            category:
                                document.getElementById(
                                    'categorieProduit'
                                ).value
 
