// script.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sélection des éléments HTML
    const productList = document.querySelector('.product-list');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalAmountSpan = document.getElementById('cart-total-amount');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const emptyCartMessage = document.querySelector('.empty-cart-message');

    let cart = []; // Tableau pour stocker les articles du panier

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
                        <button class="remove-item-btn" data-product-id="${item.id}" data-product-size="${item.size}">Supprimer</button>
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
        // Vérifie si l'article (même modèle et même taille) existe déjà dans le panier
        const existingItemIndex = cart.findIndex(item => item.id === productId && item.size === productSize);

        if (existingItemIndex > -1) {
            // Si l'article existe, augmente la quantité
            cart[existingItemIndex].quantity++;
        } else {
            // Sinon, ajoute un nouvel article
            cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                size: productSize,
                quantity: 1
            });
        }
        updateCartDisplay(); // Met à jour l'affichage
    }

    // 4. Écouteur d'événements pour les boutons "Ajouter au panier"
    productList.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const button = event.target;
            const productId = button.dataset.productId;
            const productName = button.dataset.productName;
            const productPrice = parseFloat(button.dataset.productPrice); // Convertit le prix en nombre

            // Récupère la taille sélectionnée pour ce produit
            const sizeSelectId = `size-${productId}`;
            const sizeSelectElement = document.getElementById(sizeSelectId);
            const selectedSize = sizeSelectElement.value;

            addToCart(productId, productName, productPrice, selectedSize);
        }
    });

    // 5. Écouteur d'événements pour les actions dans le panier (supprimer un, ajouter un, supprimer tout)
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
                    cart.splice(itemIndex, 1); // Supprime l'article si la quantité est 1
                }
            }
        } else if (target.classList.contains('add-one-btn')) {
            const itemIndex = cart.findIndex(item => item.id === productId && item.size === productSize);
            if (itemIndex > -1) {
                cart[itemIndex].quantity++;
            }
        } else if (target.classList.contains('remove-item-btn')) {
            cart = cart.filter(item => !(item.id === productId && item.size === productSize)); // Supprime complètement l'article
        }
        updateCartDisplay();
    });

    // 6. Écouteur d'événements pour le bouton "Vider le panier"
    clearCartBtn.addEventListener('click', () => {
        cart = []; // Vide complètement le tableau du panier
        updateCartDisplay(); // Met à jour l'affichage
    });

    // 7. Écouteur d'événements pour la soumission du formulaire de commande
    checkoutForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Empêche le rechargement de la page par défaut du formulaire

        const customerName = document.getElementById('customer-name').value;
        const customerAddress = document.getElementById('customer-address').value;

        if (cart.length === 0) {
            alert("Your basket is empty. Please add items before ordering.");
            return;
        }

        if (!customerName || !customerAddress) {
            alert("Please fill in your name and address to finalize the order.");
            return;
        }

        // Ici, tu simules l'envoi de la commande (pour l'instant, on l'affiche dans la console)
        const order = {
            customer: {
                name: customerName,
                address: customerAddress
            },
            items: cart,
            total: parseFloat(cartTotalAmountSpan.textContent)
        };

        console.log("Order sent :", order);
        alert("Your order has been sent successfully!");

        // Réinitialise le panier et le formulaire après l'envoi
        cart = [];
        updateCartDisplay();
        checkoutForm.reset(); // Vide les champs du formulaire
    });

    // Initialisation de l'affichage du panier au chargement de la page
    updateCartDisplay();
});