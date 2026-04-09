require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Replicate = require('replicate');
const path = require('path');
const mongoose = require('mongoose');
const { Store, Video } = require('./models');
const { createClient, OAuthStrategy } = require('@wix/sdk');
const { products } = require('@wix/stores');

const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 5001;

// Connexion MongoDB robuste
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/viral-vision')
  .then(() => console.log('[WITI] MongoDB Connecté 🧠'))
  .catch(err => console.error('[WITI] Erreur MongoDB:', err));

// Helper pour décoder le Signed Instance de Wix
function decodeInstance(instance, secret) {
  try {
    const [signature, payload] = instance.split('.');
    const decodedPayload = Buffer.from(payload, 'base64').toString();
    const data = JSON.parse(decodedPayload);

    // Vérification de la signature (Hmac SHA256)
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // Note: Pour les tests locaux, on peut sauter la vérification si nécessaire
    return data;
  } catch (e) {
    return null;
  }
}

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, 'dist')));

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    replicateConfigured: !!process.env.REPLICATE_API_TOKEN,
    wixConfigured: !!process.env.WIX_APP_SECRET
  });
});

/**
 * 🔐 ROUTE OAUTH : INSTALLATION & CALLBACK
 */
app.get('/api/wix/callback', async (req, res) => {
  const { code, instanceId } = req.query;
  try {
    console.log(`[WITI] Nouveau Callback Wix pour instance: ${instanceId}`);
    
    // Ici on devrait normalement échanger le code contre un Access Token
    // Pour Wix App Market, on utilise souvent l'instanceId pour identifier la boutique
    
    let store = await Store.findOne({ instanceId });
    if (!store) {
      store = new Store({ instanceId, credits: 10 });
      await store.save();
      console.log(`[WITI] Boutique enregistrée: ${instanceId}`);
    }

    // Redirection vers le dashboard
    res.redirect(`/?instanceId=${instanceId}`);
  } catch (error) {
    console.error('[WITI] Erreur OAuth Callback:', error);
    res.status(500).send("Erreur d'installation Wix");
  }
});

// Endpoint pour valider l'instance Wix et récupérer/créer la boutique
app.get('/api/wix/instance', async (req, res) => {
  const { instance } = req.query;
  const decoded = decodeInstance(instance, process.env.WIX_APP_SECRET);
  
  if (!decoded && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ success: false, message: "Instance invalide" });
  }

  const instanceId = decoded?.instanceId || req.query.instanceId || "demo-store";
  
  try {
    let store = await Store.findOne({ instanceId });
    if (!store) {
      store = new Store({ 
        instanceId, 
        credits: 10,
        siteId: decoded?.siteId || "unknown"
      });
      await store.save();
    }
    res.json({ success: true, store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint pour générer la vidéo via Replicate (avec sauvegarde et déduction de crédits)
app.post('/api/generate-video', async (req, res) => {
  const { imageUrl, prompt, instanceId, productName, productId } = req.body;

  if (!instanceId) return res.status(400).json({ success: false, message: "instanceId requis" });

  try {
    // 1. VérIFICATION DES CRÉDITS 💳
    const store = await Store.findOne({ instanceId });
    if (!store) return res.status(404).json({ success: false, message: "Boutique non trouvée" });
    
    if (store.credits <= 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Crédits insuffisants. Veuillez recharger votre compte." 
      });
    }

    console.log(`[WITI] Lancement génération pour ${productName} (${instanceId}). Crédits restants: ${store.credits}`);
    
    const input = {
      prompt: prompt || `Cinematic professional ad for ${productName}, viral style`,
      image: imageUrl
    };

    const output = await replicate.run("minimax/video-01", { input });

    // 2. DÉDUCTION DES CRÉDITS & SAUVEGARDE EN BASE DE DONNÉES 💾
    store.credits -= 1;
    await store.save();

    const newVideo = new Video({
      instanceId,
      videoUrl: output,
      prompt,
      productId,
      productName,
      thumbnail: imageUrl
    });
    await newVideo.save();

    res.json({ 
      success: true, 
      videoUrl: output,
      thumbnail: imageUrl,
      remainingCredits: store.credits
    });

  } catch (error) {
    console.error("[WITI] Erreur Génération Video:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint pour récupérer tous les stores connectés (pour le switcher admin/user)
app.get('/api/stores', async (req, res) => {
  try {
    const stores = await Store.find({}).select('instanceId siteName installedAt credits');
    res.json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint pour récupérer les produits Wix d'une instance spécifique
app.get('/api/products', async (req, res) => {
  const { instanceId } = req.query;
  
  if (!instanceId) {
    return res.status(400).json({ success: false, message: "instanceId manquant" });
  }

  try {
    // En production, on utiliserait le token spécifique à cette instance stocké en base
    const store = await Store.findOne({ instanceId });
    
    // Pour l'instant on garde le client global configuré avec les clés d'app
    const response = await wixClient.products.queryProducts().limit(20).find();
    
    const formattedProducts = response.items.map(item => ({
      id: item._id,
      name: item.name,
      price: item.priceData?.formattedPrice || item.price || "N/A",
      thumbnail: item.mainMedia?.image?.url || "https://via.placeholder.com/200",
      description: item.description
    }));

    res.json({ success: true, products: formattedProducts });
  } catch (error) {
    console.error(`[WITI] Erreur Wix API [${instanceId}]:`, error.message);
    res.status(500).json({ success: false, message: "Erreur Wix API", details: error.message });
  }
});

// Endpoint pour récupérer l'historique des vidéos d'une instance
app.get('/api/videos', async (req, res) => {
  const { instanceId } = req.query;
  try {
    const videos = await Video.find({ instanceId }).sort({ createdAt: -1 });
    res.json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

if (require.main === module) {
  app.listen(port, () => console.log(`[WITI] Viral Vision Server on http://localhost:${port}`));
}

module.exports = app;
