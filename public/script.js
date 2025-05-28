// script.js

// 1. Importe la fonction getDatabase depuis ton fichier firebase.js
// Assure-toi que le chemin './firebase.js' est CORRECT par rapport à l'emplacement de script.js
// Par exemple, si firebase.js est dans un dossier 'utils', ce serait './utils/firebase.js'
import { getDatabase } from './firebase.js'; 

let database; // Déclare database ici pour qu'elle soit accessible globalement dans le module

try {
    database = getDatabase(); // Initialise l'instance de la base de données
    console.log("Firebase Database initialisée avec succès.");
} catch (error) {
    console.error("ERREUR: Impossible d'initialiser Firebase Database. Vérifiez firebase.js et son chemin.", error);
    // Tu peux afficher un message à l'utilisateur ici si tu veux
    alert("Problème technique: Impossible de charger les produits. Veuillez contacter l'administrateur.");
}


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM entièrement chargé.");

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
        console.log("Mise à jour de l'affichage du panier. Panier actuel:", cart);
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
        console.log(`Tentative d'ajout au panier: ID=${productId}, Nom=${productName}, Prix=${productPrice}, Taille=${productSize}`);
        
        // Vérifie si le tableau 'products' est bien rempli
        if (products.length === 0) {
            console.warn("Le tableau 'products' est vide. Les produits n'ont peut-être pas été chargés.");
            alert("Les produits ne sont pas encore disponibles. Veuillez réessayer.");
            return;
        }

        // Vérifie que le produit existe dans le tableau 'products'
        const productToAdd = products.find(p => p.rtDbId === productId);
        if (!productToAdd) {
            console.error("Produit non trouvé dans le tableau des produits chargés:", productId);
            alert("Erreur: Produit sélectionné introuvable.");
            return;
        }
        console.log("Produit trouvé pour l'ajout au panier:", productToAdd);

        // Vérifie si l'article (même modèle et même taille) existe déjà dans le panier
        const existingItemIndex = cart.findIndex(item => item.id === productId && item.size === productSize);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity++;
            console.log("Quantité augmentée pour l'article existant.");
        } else {
            cart.push({
                id: productId, // L'ID Realtime DB du produit
                name: productName,
                price: productPrice,
                size: productSize,
                quantity: 1,
                imageUrl: productToAdd.imageUrl 
            });
            console.log("Nouvel article ajouté au panier.");
        }
        updateCartDisplay();
    }

    // 4. Écouteur d'événements pour les boutons "Ajouter au panier"
    if (productList) { // S'assurer que productList existe avant d'ajouter l'écouteur
        productList.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-to-cart-btn')) {
                const button = event.target;
                const productId = button.dataset.productId;
                const productName = button.dataset.productName;
                const productPrice = parseFloat(button.dataset.productPrice);

                const sizeSelectId = `size-select-${productId}`; 
                const sizeSelectElement = document.getElementById(sizeSelectId);
                const selectedSize = sizeSelectElement ? sizeSelectElement.value : 'Unique'; 

                console.log("Bouton 'Ajouter au panier' cliqué:", {
                    productId, productName, productPrice, selectedSize, sizeSelectId, sizeSelectElement: !!sizeSelectElement
                });
                
                addToCart(productId, productName, productPrice, selectedSize);
            }
        });
    } else {
        console.error("Element .product-list non trouvé dans le DOM. Impossible d'attacher l'écouteur d'événements.");
    }


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
        console.log("Début du chargement des produits depuis la DB...");
        if (!database) {
            console.error("Impossible de charger les produits: database n'est pas initialisée.");
            productList.innerHTML = '<p style="color: red;">Erreur: Base de données non connectée.</p>';
            return;
        }

        if (productList) {
            productList.innerHTML = '<p>Chargement des produits...</p>';
        } else {
            console.error("Element .product-list non trouvé pour afficher les produits.");
            return;
        }
        
        try {
            const snapshot = await database.ref('products').once('value');
            const productsData = snapshot.val(); 
            console.log("Données brutes des produits reçues:", productsData);

            products = [];
            if (productsData) {
                Object.keys(productsData).forEach(rtDbId => {
                    const product = productsData[rtDbId];
                    product.rtDbId = rtDbId; // Stocke l'ID Realtime DB
                    products.push(product);
                });
            }
            console.log("Produits formatés et prêts à l'affichage:", products);

            displayProducts(); // Affiche les produits

        } catch (error) {
            console.error("Erreur lors du chargement des produits depuis la Realtime Database:", error);
            productList.innerHTML = '<p style="color: red;">Impossible de charger les produits. Vérifiez votre connexion et les règles Firebase.</p>';
        }
    }

    // Fonction pour afficher les produits dans le HTML
    function displayProducts() {
        console.log("Affichage des produits. Nombre de produits:", products.length);
        if (productList) {
            productList.innerHTML = '';
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
    }

    // --- MODIFICATION MAJEURE : Envoi du formulaire de commande à la Realtime Database ---
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log("Soumission du formulaire de commande.");

        const customerName = document.getElementById('customer-name').value.trim();
        const customerAddress = document.getElementById('customer-address').value.trim();

        if (cart.length === 0) {
            alert("Votre panier est vide. Veuillez ajouter des articles avant de commander.");
            console.log("Panier vide, annulation de la commande.");
            return;
        }

        if (!customerName || !customerAddress) {
            alert("Veuillez remplir votre nom et votre adresse pour finaliser la commande.");
            console.log("Informations client manquantes, annulation de la commande.");
            return;
        }

        const order = {
            id: 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            customer: {
                name: customerName,
                address: customerAddress
            },
            items: cart.map(item => ({ 
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
            })
        };
        console.log("Objet commande à envoyer:", order);

        try {
            if (!database) {
                throw new Error("Base de données non connectée. Impossible d'envoyer la commande.");
            }
            await database.ref('orders').push(order); 
            
            alert("Votre commande a été envoyée avec succès !");
            console.log("Commande sauvegardée dans Realtime Database.");

            cart = [];
            updateCartDisplay();
            checkoutForm.reset();
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la commande dans la Realtime Database :", error);
            alert("Une erreur est survenue lors de l'envoi de la commande. Vérifiez la console pour plus de détails.");
        }
    });

    // --- Initialisation au chargement de la page ---
    updateCartDisplay(); // Met à jour le panier initial (vide au début)
    loadProductsAndDisplay(); // Charge et affiche les produits depuis la DB
});
