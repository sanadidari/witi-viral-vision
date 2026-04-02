import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video as VideoIcon, 
  Zap, 
  Sparkles, 
  Layout, 
  Play, 
  Download, 
  Share2, 
  History,
  Settings,
  Store as StoreIcon,
  ChevronDown,
  RefreshCw,
  Clock,
  Video,
  CreditCard
} from 'lucide-react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStoreSwitcher, setShowStoreSwitcher] = useState(false);
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' or 'plans' or 'history'

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setLoadingProducts(true);
    try {
      // 1. Récupérer l'instance depuis l'URL (envoyée par Wix)
      const urlParams = new URLSearchParams(window.location.search);
      const instance = urlParams.get('instance');
      
      // 2. Valider l'instance et identifier la boutique
      const res = await axios.get(`/api/wix/instance?instance=${instance || ''}`);
      if (res.data.success) {
        setCurrentStore(res.data.store);
        // Après avoir identifié le store, on récupère tous les stores pour le switcher
        fetchStores();
      }
    } catch (e) {
      console.error("Initialization failed", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await axios.get('/api/stores');
      if (response.data.success) {
        setStores(response.data.stores);
        if (response.data.stores.length > 0) {
          setCurrentStore(response.data.stores[0]);
        }
      }
    } catch (e) {
      console.error("Store fetch failed", e);
    }
  };

  useEffect(() => {
    if (currentStore) {
      fetchWixProducts();
      fetchVideoHistory();
    }
  }, [currentStore]);

  const fetchWixProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await axios.get(`/api/products?instanceId=${currentStore.instanceId}`);
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error("Wix fetch failed", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchVideoHistory = async () => {
    try {
      const response = await axios.get(`/api/videos?instanceId=${currentStore.instanceId}`);
      if (response.data.success) {
        setProjects(response.data.videos);
      }
    } catch (error) {
      console.error("History fetch failed", error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProduct) return;

    setIsGenerating(true);
    try {
      const response = await axios.post('/api/generate-video', {
        instanceId: currentStore.instanceId,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        imageUrl: selectedProduct.thumbnail,
        prompt: `Premium viral social media ad for ${selectedProduct.name}, high fashion lighting, fluid motion, 4k cinematic`
      });

      if (response.data.success) {
        fetchVideoHistory();
        setSelectedProduct(null);
      }
    } catch (error) {
      alert("La génération a échoué. Vérifie tes clés.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand" style={{ marginBottom: '2.5rem' }}>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem', fontWeight: 900 }}
          >
            <VideoIcon size={32} fill="var(--primary)" stroke="none" /> WITI VIRAL
          </motion.h2>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ padding: '2px 6px', background: 'var(--primary)', color: 'white', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900 }}>PRO</div>
            <p style={{ fontSize: '0.6rem', opacity: 0.5, letterSpacing: '1px' }}>CHATWITI</p>
          </div>
        </div>

        {/* Store Switcher */}
        <div style={{ position: 'relative' }}>
          <div 
            className="store-switcher" 
            onClick={() => setShowStoreSwitcher(!showStoreSwitcher)}
          >
            <StoreIcon size={16} />
            <span style={{ flex: 1 }}>{currentStore?.instanceId === 'demo-store' ? 'Boutique Démo' : (currentStore?.siteName || 'Ma Boutique')}</span>
            <ChevronDown size={14} />
          </div>
          
          <AnimatePresence>
            {showStoreSwitcher && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card"
                style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 10, padding: '8px' }}
              >
                {stores.map(s => (
                  <div 
                    key={s.instanceId}
                    onClick={() => { setCurrentStore(s); setShowStoreSwitcher(false); }}
                    style={{ padding: '10px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '8px', background: currentStore?.instanceId === s.instanceId ? 'var(--card-bg)' : 'transparent' }}
                  >
                    {s.instanceId}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav style={{ flex: 1 }}>
          <p className="section-title" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Principal</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button className={`btn-sidebar ${activeTab === 'studio' ? 'active' : ''}`} onClick={() => setActiveTab('studio')}><Layout size={18} /> Studio Hub</button>
            <button className={`btn-sidebar ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><History size={18} /> Mes Vidéos</button>
            <button className={`btn-sidebar ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}><CreditCard size={18} /> Plans & Crédits</button>
            <button className="btn-sidebar"><Settings size={18} /> Paramètres</button>
          </div>
        </nav>

        <div className="glass-card" style={{ padding: '1.2rem', marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Crédits PRO</p>
            <Sparkles size={14} color="var(--primary)" />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '15px' }}>{currentStore?.credits || 0}</p>
          <button className="btn-primary" style={{ width: '100%', fontSize: '0.8rem' }}>Recharger</button>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem' }}>
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>Bonjour, {currentStore?.ownerName || 'Cher Partenaire'} 👋</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-dim)' }}>
              {selectedProduct ? `Prêt à propulser ${selectedProduct.name} avec CHATWITI ?` : "Transformez vos produits en publicités de classe mondiale."}
            </p>
          </div>
          <AnimatePresence>
            {selectedProduct && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1.2rem 2.5rem', fontSize: '1.1rem' }}
              >
                {isGenerating ? <RefreshCw className="spinner" size={20} /> : <Zap size={20} />}
                {isGenerating ? "Moteur IA en cours..." : "Lancer la Génération AI"}
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {activeTab === 'studio' && (
          <>
            <section style={{ marginBottom: '5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><StoreIcon size={20} /> Choisissez un produit</h3>
                {loadingProducts && <div className="spinner" />}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {products.map(product => (
                  <motion.div 
                    key={product.id}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedProduct(product)}
                    className={`glass-card product-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                    style={{ padding: '15px', cursor: 'pointer' }}
                  >
                    <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', aspectRatio: '1' }}>
                      <img src={product.thumbnail} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h4>
                    <p style={{ color: 'var(--primary)', fontWeight: 800 }}>{product.price}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          </>
        )}

        {(activeTab === 'history' || activeTab === 'studio') && (
          <section style={{ marginTop: activeTab === 'history' ? '0' : '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <Clock size={20} />
              <h3>Historique de vos campagnes</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {projects.map(video => (
                <motion.div 
                  key={video._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card video-card"
                >
                  <div className="video-preview">
                    <video src={video.videoUrl} controls poster={video.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '0.5rem' }}>
                    <h4 style={{ marginBottom: '4px', fontSize: '1rem' }}>{video.productName}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Généré le {new Date(video.createdAt).toLocaleDateString()}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-primary" style={{ flex: 2, fontSize: '0.8rem', padding: '10px' }}>Télécharger</button>
                      <button className="btn-sidebar" style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)' }}><Share2 size={16} /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'plans' && (
          <section>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Choisissez votre Plan</h2>
              <p style={{ color: 'var(--text-dim)' }}>Passez à la vitesse supérieure avec les outils de CHATWITI.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Starter</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 900 }}>$19<span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.5 }}>/mois</span></p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                  <li>✅ 50 Vidéos / mois</li>
                  <li>✅ Résolution SD</li>
                  <li>✅ Support Standard</li>
                </ul>
                <button className="btn-primary" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.1)', color: 'white' }}>Choisir Starter</button>
              </div>

              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '2px solid var(--primary)', transform: 'scale(1.05)' }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900, alignSelf: 'flex-start' }}>RECOMMANDÉ</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Professional</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 900 }}>$49<span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.5 }}>/mois</span></p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                  <li>✅ Vidéos Illimitées*</li>
                  <li>✅ Résolution HD 4K</li>
                  <li>✅ Support Prioritaire</li>
                  <li>✅ Suppression du Logo</li>
                </ul>
                <button className="btn-primary" style={{ marginTop: 'auto' }}>Choisir Pro</button>
              </div>

              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Enterprise</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 900 }}>$99<span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.5 }}>/mois</span></p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                  <li>✅ Tout dans Pro</li>
                  <li>✅ API Access</li>
                  <li>✅ Consultant Dédié</li>
                </ul>
                <button className="btn-primary" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.1)', color: 'white' }}>Choisir Enterprise</button>
              </div>
            </div>

            <div style={{ marginTop: '5rem', textAlign: 'center', opacity: 0.8 }}>
              <p style={{ color: 'var(--text-dim)' }}>Besoin d'aide ? Contactez Samir à <a href="mailto:supportsanad@sanadidari.com" style={{ color: 'var(--primary)' }}>supportsanad@sanadidari.com</a></p>
            </div>
          </section>
        )}
      </main>

      {isGenerating && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="loading-overlay"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div className="spinner" style={{ width: '80px', height: '80px', borderWidth: '5px' }} />
          <h2 style={{ fontSize: '2rem', marginTop: '3rem' }}>L'IA sculpte votre publicité...</h2>
          <p style={{ color: 'var(--text-dim)', marginTop: '1rem', width: '300px', textAlign: 'center' }}>Nous stylisons {selectedProduct?.name} avec des algorithmes cinématographiques.</p>
        </motion.div>
      )}
    </div>
  );
}

function CreditCardIcon({ size }) { return <Sparkles size={size} />; }

export default App;
