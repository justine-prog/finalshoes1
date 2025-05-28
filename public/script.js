// script.js

// 1. Importe la fonction getDatabase depuis ton fichier firebase.js
import { getDatabase } from './firebase.js'; // Assure-toi que le chemin est correct depuis ce fichier script.js
const database = getDatabase(); // Obtiens une instance de la base de données

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sélection des éléments HTML
    const productList = document.querySelector('.product-list');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalAmountSpan = document.getElementById('cart-total-amount');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const emptyCartMessage = document.querySelector('.empty-cart-message');

    let cart = []; // Tableau pour stocker les articles du panier
    let products = []; // Tableau pour stocker les produits chargés depuis la DB

    // --- Fonctions de gestion du panier (inchangées) ---

    // 2. Fonction pour mettre à jour l'affichage du panier
    function updateCartDisplay() {
        cartItemsContainer.innerHTML = ''; // Vide le contenu actuel du panier

        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block'; // Affiche le message "Panier vide"
            clearCartBtn.style.display = 'none'; // Cache le bouton Vider le panier
        } else {
            emptyCartMessage.style.display = 'none'; // Cache le message "Panier vide"
            clearCartBtn.style.display = 'block'; // Affiche le bouton Vider le panier
            cart.forEach(item => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.classList.add('cart-item');
                cartItemDiv.innerHTML = `
                    <div class="cart-item-info">
                        <span class="cart-item-name">${item.name}</span>
                        <span class="cart-item-details"> - Taille: ${item.size} - ${item.quantity} x ${item.price.toFixed(2)} €</span>
                    </div>
                    <div class="cart-item-actions">
                        <button class="remove-one-btn" data-product-id="${item.id}" data-product-size="${item.size}">-</button>
                        <span>${item.quantity}</span>
                        <button class="add-one-btn" data-product-id="${item.id}" data-product-size="${item.size}">+</button>
                        <button class="remove-item-btn" data-product-id="${item.id}" data-product-size="${item.size}">Delete</button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
            });
        }

        // Calcule et affiche le total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalAmountSpan.textContent = total.toFixed(2);
    }

    // 3. Fonction pour ajouter un article au panier
    function addToCart(productId, productName, productPrice, productSize) {
        const productToAdd = products.find(p => p.rtDbId === productId);
        if (!productToAdd) {
            console.error("Produit non trouvé :", productId);
            return;
        }

        // Vérifie si l'article (même modèle et même taille) existe déjà dans le panier
        const existingItemIndex = cart.findIndex(item => item.id === productId && item.size === productSize);

        if (existingItemIndex > -1) {
            // Si l'article existe, augmente la quantité
            cart[existingItemIndex].quantity++;
        } else {
            // Sinon, ajoute un nouvel article
            cart.push({
                id: productId, // L'ID Realtime DB du produit
                name: productName,
                price: productPrice,
                size: productSize,
                quantity: 1,
                imageUrl: productToAdd.imageUrl // Ajoute l'URL de l'image pour le panier si tu veux l'afficher plus tard
            });
        }
        updateCartDisplay(); // Met à jour l'affichage
    }

    // 4. Écouteur d'événements pour les boutons "Ajouter au panier"
    productList.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const button = event.target;
            const productId = button.dataset.productId; // C'est l'ID RTDB maintenant
            const productName = button.dataset.productName;
            const productPrice = parseFloat(button.dataset.productPrice);

            // Récupère la taille sélectionnée pour ce produit
            // Assurez-vous que l'ID du selecteur de taille est correct, ex: size-SELECT_ID_DU_PRODUIT
            const sizeSelectId = `size-select-${productId}`; 
            const sizeSelectElement = document.getElementById(sizeSelectId);
            const selectedSize = sizeSelectElement ? sizeSelectElement.value : 'Unique'; // Taille par défaut si pas de sélecteur

            addToCart(productId, productName, productPrice, selectedSize);
        }
    });

    // 5. Écouteur d'événements pour les actions dans le panier (inchangé)
    cartItemsContainer.addEventListener('click', (event) => {
        const target = event.target;
        const productId = target.dataset.productId;
        const productSize = target.dataset.productSize;

        if (target.classList.contains('remove-one-btn')) {
            const itemIndex = cart.findIndex(item => item.id === productId && item.size === productSize);
            if (itemIndex > -1) {
                if (cart[itemIndex].quantity > 1) {
                    cart[itemIndex].quantity--;
                } else {
                    cart.splice(itemIndex, 1);
                }
            }
        } else if (target.classList.contains('add-one-btn')) {
            const itemIndex = cart.findIndex(item => item.id === productId && item.size === productSize);
            if (itemIndex > -1) {
                cart[itemIndex].quantity++;
            }
        } else if (target.classList.contains('remove-item-btn')) {
            cart = cart.filter(item => !(item.id === productId && item.size === productSize));
        }
        updateCartDisplay();
    });

    // 6. Écouteur d'événements pour le bouton "Vider le panier" (inchangé)
    clearCartBtn.addEventListener('click', () => {
        cart = [];
        updateCartDisplay();
    });

    // --- NOUVELLE FONCTIONNALITÉ : Chargement des produits depuis la DB ---
    async function loadProductsAndDisplay() {
        productList.innerHTML = '<p>Chargement des produits...</p>'; // Message de chargement
        try {
            const snapshot = await database.ref('products').once('value');
            const productsData = snapshot.val(); // Récupère les données brutes

            products = []; // Réinitialise le tableau des produits
            if (productsData) {
                // Convertit l'objet d'objets en tableau pour faciliter le traitement
                Object.keys(productsData).forEach(rtDbId => {
                    const product = productsData[rtDbId];
                    product.rtDbId = rtDbId; // Stocke l'ID Realtime DB
                    products.push(product);
                });
            }

            // Affiche les produits
            displayProducts();

        } catch (error) {
            console.error("Erreur lors du chargement des produits:", error);
            productList.innerHTML = '<p>Impossible de charger les produits. Veuillez réessayer plus tard.</p>';
        }
    }

    // Fonction pour afficher les produits dans le HTML
    function displayProducts() {
        productList.innerHTML = ''; // Vide la liste actuelle
        if (products.length === 0) {
            productList.innerHTML = '<p>Aucun produit disponible pour le moment.</p>';
            return;
        }

        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product-item');
            productDiv.innerHTML = `
                <img src="${product.imageUrl || 'https://via.placeholder.com/200x200?text=Produit+N/A'}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">${product.price.toFixed(2)} €</p>
                <div class="size-selector">
                    <label for="size-select-${product.rtDbId}">Taille:</label>
                    <select id="size-select-${product.rtDbId}">
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                    </select>
                </div>
                <button class="add-to-cart-btn" 
                        data-product-id="${product.rtDbId}" 
                        data-product-name="${product.name}" 
                        data-product-price="${product.price}">
                    Ajouter au panier
                </button>
            `;
            productList.appendChild(productDiv);
        });
    }

    // --- MODIFICATION MAJEURE : Envoi du formulaire de commande à la Realtime Database ---
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const customerName = document.getElementById('customer-name').value.trim();
        const customerAddress = document.getElementById('customer-address').value.trim();

        if (cart.length === 0) {
            alert("Votre panier est vide. Veuillez ajouter des articles avant de commander.");
            return;
        }

        if (!customerName || !customerAddress) {
            alert("Veuillez remplir votre nom et votre adresse pour finaliser la commande.");
            return;
        }

        const order = {
            id: 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase(), // Un ID unique simple
            customer: {
                name: customerName,
                address: customerAddress
            },
            items: cart.map(item => ({ // Copie le panier, on peut filtrer des champs si besoin
                id: item.id,
                name: item.name,
                price: item.price,
                size: item.size,
                quantity: item.quantity
            })),
            total: parseFloat(cartTotalAmountSpan.textContent),
            date: new Date().toLocaleString('fr-FR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            }) // Date et heure formatées
        };

        try {
            // ENVOIE LA COMMANDE À LA REALTIME DATABASE
            await database.ref('orders').push(order); // Utilise la méthode push pour ajouter avec un ID généré

            alert("Votre commande a été envoyée avec succès !");
            console.log("Commande sauvegardée dans Realtime Database :", order);

            // Réinitialise le panier et le formulaire après l'envoi
            cart = [];
            updateCartDisplay();
            checkoutForm.reset();
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la commande dans la Realtime Database :", error);
            alert("Une erreur est survenue lors de l'envoi de la commande. Veuillez réessayer.");
        }
    });

    // --- Initialisation au chargement de la page ---
    updateCartDisplay(); // Met à jour le panier initial
    loadProductsAndDisplay(); // Charge et affiche les produits depuis la DB
});
