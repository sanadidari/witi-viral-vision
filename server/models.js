const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  instanceId: { type: String, required: true, unique: true },
  siteId: String,
  accessToken: String,
  refreshToken: String,
  siteName: String,
  ownerEmail: String,
  ownerName: { type: String, default: "Cher Partenaire" },
  installedAt: { type: Date, default: Date.now },
  credits: { type: Number, default: 10 } // Crédits gratuits à l'installation
});

const videoSchema = new mongoose.Schema({
  instanceId: { type: String, required: true },
  videoUrl: String,
  prompt: String,
  productId: String,
  productName: String,
  thumbnail: String,
  status: { type: String, default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

const Store = mongoose.model('Store', storeSchema);
const Video = mongoose.model('Video', videoSchema);

module.exports = { Store, Video };
