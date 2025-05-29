// api/orders.js

// Importe le Firebase Admin SDK
import admin from 'firebase-admin';

// Importe le contenu de ta clé de compte de service depuis les variables d'environnement
// Vercel convertit automatiquement la chaîne JSON en objet JavaScript
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Initialise l'Admin SDK une seule fois
// Cela empêche l'erreur "Firebase app named '[DEFAULT]' already exists" lors du hot-reloading de Vercel
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// Référence à la base de données Firestore
const db = admin.firestore();

export default async function handler(req, res) {
    // Seules les requêtes POST sont autorisées pour soumettre des commandes
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { customer, items, total } = req.body; // Ces champs devraient venir de script.js
        
        // Validation basique des données
        if (!customer || !customer.name || !customer.address || !items || items.length === 0 || typeof total !== 'number') {
            return res.status(400).json({ error: 'Missing or invalid order data' });
        }

        const orderData = {
            customerName: customer.name,
            customerAddress: customer.address,
            items: items, // Assure-toi que 'items' est un tableau d'objets (comme ton 'cart')
            totalAmount: total,
            orderDate: admin.firestore.FieldValue.serverTimestamp(), // Firestore Timestamp
            status: 'pending' // Statut initial de la commande
        };

        // Ajoute la commande à la collection 'orders' dans Firestore
        const docRef = await db.collection('orders').add(orderData);

        // Répond au client avec un succès et l'ID de la nouvelle commande
        res.status(200).json({ success: true, orderId: docRef.id });

    } catch (err) {
        console.error('Error submitting order to Firestore:', err);
        // En cas d'erreur serveur, renvoie un statut 500
        res.status(500).json({ error: 'Failed to submit order', details: err.message });
    }
}
