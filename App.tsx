import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { Button } from './components/ui/Button';
import { products as initialProducts, blogPosts } from './data';
import { Product, CartItem, ViewState } from './types';
import { 
  ChevronRight, Zap, Shield, Truck, Play, Calendar, User, Tag, Send, 
  CheckCircle, Package, Clock, DollarSign, Hammer, Repeat, AlertTriangle, 
  X, ArrowLeft, Phone, Sliders, Briefcase, Settings, Users, MapPin, Mail, FileText
} from 'lucide-react';

// Default Images (Fallbacks)
const DEFAULT_HERO = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Checkout Form State
  const [checkoutForm, setCheckoutForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: ''
  });

  // Custom Contact Form State
  const [customContactForm, setCustomContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    fleetSize: '',
    message: ''
  });
  
  // Subscription Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);

  // State for dynamic content
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [heroImage, setHeroImage] = useState<string>(DEFAULT_HERO);

  // Helper to sanitize product names to match Drive folder naming convention
  const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9 ]/g, "");

  // Function to apply asset data to state
  const applyAssets = (data: any) => {
    if (!data.assets) return;

    // 1. Update Hero
    if (data.assets.site && data.assets.site.hero_bg) {
      setHeroImage(data.assets.site.hero_bg);
    }

    // 2. Update Products
    setProducts(prevProducts => prevProducts.map(p => {
      const folderName = sanitizeName(p.name);
      const driveImage = data.assets.products[folderName];
      if (driveImage) {
        return { ...p, image: driveImage };
      }
      return p;
    }));
  };

  // Load assets from Local Storage AND Google Drive via App Script
  useEffect(() => {
    const fetchAssets = async () => {
      // A. Try Local Storage First (Instant Load)
      const cachedData = localStorage.getItem('rfe_assets_cache_v1');
      if (cachedData) {
        try {
          console.log("Loading assets from local cache...");
          applyAssets(JSON.parse(cachedData));
        } catch (e) {
          console.warn("Invalid cache", e);
        }
      }

      // B. Fetch Fresh Data (Background Update)
      try {
        console.log("Fetching fresh assets from backend...");
        const response = await fetch('/api/assets');
        const data = await response.json();
        
        if (data.status === 'success' && data.assets) {
          // Update State
          applyAssets(data);
          // Update Cache
          localStorage.setItem('rfe_assets_cache_v1', JSON.stringify(data));
        }
      } catch (e) {
        console.warn("Could not fetch dynamic assets, using defaults or cache.", e);
      }
    };

    fetchAssets();
  }, []);

  // Pop-up Logic
  useEffect(() => {
    // Check session storage so we don't annoy user if they already closed it this session
    const sessionSeen = sessionStorage.getItem('rfe_sub_modal_seen');
    if (sessionSeen) {
        setHasSeenModal(true);
        return;
    }
    
    // Don't show modal if we are already on a sub page to avoid stacking contexts
    const isSubPage = currentView === 'SUBSCRIPTION' || currentView === 'SUB_STARTER' || currentView === 'SUB_GROWTH' || currentView === 'SUB_PREMIUM' || currentView === 'SUB_CUSTOM' || currentView === 'CHECKOUT';

    // 1. Timer Trigger (3 seconds)
    const timer = setTimeout(() => {
      if (!hasSeenModal && !isSubPage) {
        setIsSubModalOpen(true);
        setHasSeenModal(true);
        sessionStorage.setItem('rfe_sub_modal_seen', 'true');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [hasSeenModal, currentView]);

  // Cart Logic
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setNotification(`${product.name} added to cart`);
    setTimeout(() => setNotification(null), 3000);
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Form Handlers
  const handleCheckoutInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCheckoutForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCustomContactInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomContactForm(prev => ({ ...prev, [name]: value }));
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const orderData = {
      action: 'order',
      items: cartItems,
      total: cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      customerName: `${checkoutForm.firstName} ${checkoutForm.lastName}`,
      email: checkoutForm.email,
      phone: checkoutForm.phone,
      company: checkoutForm.company,
      shippingAddress: {
         address1: checkoutForm.address,
         city: checkoutForm.city,
         state: checkoutForm.state,
         zip: checkoutForm.zip,
         country: 'USA'
      },
      notes: checkoutForm.notes
    };

    try {
      await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      setCartItems([]);
      setCheckoutForm({
        firstName: '', lastName: '', email: '', phone: '', company: '', 
        address: '', city: '', state: '', zip: '', notes: ''
      });
      setCurrentView('HOME');
      setNotification("Request Received! We'll be in touch shortly.");
      setTimeout(() => setNotification(null), 5000);
    } catch (e) {
      console.error(e);
      setNotification("Error placing request. Please call us.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCustomQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const leadData = {
      action: 'lead',
      name: customContactForm.name,
      email: customContactForm.email,
      phone: customContactForm.phone,
      company: customContactForm.company,
      type: 'Custom Solution Inquiry',
      message: `Fleet Size: ${customContactForm.fleetSize}\nMessage: ${customContactForm.message}`
    };

    try {
      await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData)
      });
      setNotification("Inquiry sent! Our enterprise team will contact you shortly.");
      setTimeout(() => setNotification(null), 5000);
      setCustomContactForm({ name: '', email: '', phone: '', company: '', fleetSize: '', message: '' });
      setCurrentView('SUBSCRIPTION');
    } catch (e) {
       setNotification("Error sending request.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNewsletter = async (email: string) => {
    const leadData = {
      action: 'lead',
      name: 'Newsletter Subscriber',
      email: email,
      type: 'Newsletter',
      message: 'Subscribed via footer'
    };
    try {
       await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData)
      });
      setNotification("Subscribed to the newsletter!");
      setTimeout(() => setNotification(null), 3000);
    } catch(e) {
      // ignore
    }
  };

  // --- Views ---

  const renderHome = () => (
    <>
      {/* Hero Section */}
      <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden clip-hero">
        <div className="absolute inset-0 bg-rfe-black">
          <img src={heroImage} alt="Spray Foam Rig" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-rfe-black via-rfe-black/80 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-6 z-10 pt-20">
          <div className="max-w-4xl">
            <div className="inline-block bg-rfe-yellow text-black font-bold uppercase tracking-widest text-xs px-3 py-1 mb-6 transform -skew-x-12">
              <span className="skew-x-12 block">Family Owned. Built For Production.</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black text-white uppercase italic leading-[0.9] mb-6 drop-shadow-lg">
              Stop Being <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rfe-red to-rfe-red-dark">Dominated</span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase italic mb-4">
              By Corporate Giants & Failed Gear
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-xl font-light leading-relaxed">
              Stop feeding the machine with guns designed to fail. RFE is family-owned and built for the contractor. We share in your success—we don't profit off your misery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setCurrentView('CATALOG')} icon={<ChevronRight className="w-5 h-5" />}>
                Shop Honest Gear
              </Button>
              <Button variant="outline" onClick={() => setCurrentView('SUBSCRIPTION')}>
                View Service Plans
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Preview */}
      <section className="py-20 bg-rfe-lightGray relative">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-black text-white uppercase italic">
                Heavy Hitters <span className="text-rfe-red">.</span>
              </h2>
              <p className="text-gray-400 mt-2">Equipment built to last. No planned obsolescence.</p>
            </div>
            <Button variant="secondary" onClick={() => setCurrentView('CATALOG')}>View All</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.slice(0, 3).map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Teaser */}
      <section className="py-24 bg-rfe-red relative overflow-hidden">
        <div className="absolute inset-0 bg-industrial-pattern opacity-10" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <Zap className="w-16 h-16 text-rfe-yellow mx-auto mb-6" />
          <h2 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic mb-6">
            Zero Downtime. Maximum Yield.
          </h2>
          <p className="text-white/80 text-xl max-w-2xl mx-auto mb-10">
            Stop burning daylight rebuilding guns on the tailgate. With the RFE Subscription, you swap to a fresh gun instantly and keep the meter running. No downtime, just production.
          </p>
          <Button variant="accent" size="lg" onClick={() => setCurrentView('SUBSCRIPTION')}>
            See Plans & Pricing
          </Button>
        </div>
      </section>
    </>
  );

  const renderCatalog = () => (
    <div className="py-12 container mx-auto px-6 min-h-screen">
      <div className="mb-12 pt-10">
        <h2 className="text-4xl font-display font-black text-white uppercase italic border-l-8 border-rfe-red pl-6">
          Equipment Catalog
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {products.map(product => (
          <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
        ))}
      </div>
    </div>
  );

  const renderRigs = () => (
    <div className="py-12 container mx-auto px-6 min-h-screen">
      <div className="mb-12 pt-10 text-center max-w-4xl mx-auto">
        <h2 className="text-5xl font-display font-black text-white uppercase italic mb-4">
          Complete Rig Solutions
        </h2>
        <p className="text-xl text-gray-400 font-light mb-8">
          The industry's first true Equipment-as-a-Service (EaaS) model. Stop buying depreciate assets and start subscribing to guaranteed uptime. 
          Every RFE EaaS rig includes hot-swappable replacement equipment so your business never stops moving.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => setCurrentView('SUB_CUSTOM')} icon={<CheckCircle className="w-5 h-5" />}>Apply For Fleet Program</Button>
        </div>
      </div>

      {/* Hero Rig */}
      <div className="relative mb-24 overflow-hidden border border-white/10 group">
        <div className="absolute inset-0 bg-gradient-to-t from-rfe-black via-transparent to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1542171587-f82746430932?q=80&w=2070&auto=format&fit=crop" 
          alt="EaaS Mobile Rig" 
          className="w-full h-[600px] object-cover group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute bottom-0 left-0 p-8 md:p-16 z-20 w-full">
          <span className="bg-rfe-red text-white text-xs font-bold px-3 py-1 uppercase tracking-widest mb-4 inline-block transform -skew-x-12">
            <span className="skew-x-12 block">EaaS Flagship</span>
          </span>
          <h3 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic mb-4">
            The RFE 20' Production Series
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <div className="bg-rfe-black/80 backdrop-blur border border-white/5 p-4 transform skew-x-[-5deg]">
               <h4 className="text-rfe-yellow font-bold uppercase tracking-widest text-sm mb-1 transform skew-x-5">Zero Capital CapEx</h4>
               <p className="text-gray-300 text-sm transform skew-x-5">No massive upfront loans. Keep your cash flow healthy and predictable.</p>
            </div>
            <div className="bg-rfe-black/80 backdrop-blur border border-white/5 p-4 transform skew-x-[-5deg]">
               <h4 className="text-rfe-yellow font-bold uppercase tracking-widest text-sm mb-1 transform skew-x-5">Hot-Swap Guarantee</h4>
               <p className="text-gray-300 text-sm transform skew-x-5">If a proportioner or generator fails, we overnight a replacement. Period.</p>
            </div>
            <div className="bg-rfe-black/80 backdrop-blur border border-white/5 p-4 transform skew-x-[-5deg]">
               <h4 className="text-rfe-yellow font-bold uppercase tracking-widest text-sm mb-1 transform skew-x-5">Routine Maintenance</h4>
               <p className="text-gray-300 text-sm transform skew-x-5">All scheduled service parts and kits are included in your monthly rate.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Comparison */}
      <div className="mb-24">
        <h3 className="text-3xl font-display font-black text-white text-center uppercase italic mb-12">Choose Your Arsenal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: 'The Vanguard',
              size: "16' Bumper Pull",
              output: 'Up to 25 lbs/min',
              ideal: 'Residential insulation, entry-level commercial.',
              price: 'Contact for EaaS Pricing',
              features: ['E-20 Reactor', '40kW Generator', '150ft Heated Hose', 'Hot-Swap Gun Plan Included']
            },
            {
              name: 'The Juggernaut',
              size: "20' Gooseneck",
              output: 'Up to 30 lbs/min',
              ideal: 'High-volume residential, standard commercial.',
              price: 'Contact for EaaS Pricing',
              features: ['H-30 Reactor', '60kW Generator', '300ft Heated Hose', 'Hot-Swap Gun & Pump Plan']
            },
            {
              name: 'The Leviathan',
              size: "24' Gooseneck",
              output: 'Dual Systems (60 lbs/min total)',
              ideal: 'Large-scale commercial, roofing, maximum yield.',
              price: 'Contact for EaaS Pricing',
              features: ['Dual H-30 Reactors', '80kW Generator', '400ft Hose per system', 'Complete EaaS Coverage']
            }
          ].map((rig, idx) => (
            <div key={idx} className="bg-rfe-lightGray border border-white/5 p-8 flex flex-col relative overflow-hidden group hover:border-rfe-red/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                <Truck className="w-24 h-24" />
              </div>
              <h4 className="text-2xl font-display font-black text-white italic uppercase mb-2 relative z-10">{rig.name}</h4>
              <p className="text-rfe-red font-bold tracking-widest text-sm uppercase mb-6 relative z-10">{rig.size}</p>
              
              <div className="flex-grow relative z-10">
                <div className="mb-6">
                  <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">Max Output</span>
                  <span className="text-white font-bold">{rig.output}</span>
                </div>
                <div className="mb-6">
                  <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">Ideal For</span>
                  <span className="text-gray-300 text-sm">{rig.ideal}</span>
                </div>
                
                <div className="mb-6">
                  <span className="text-gray-500 text-xs uppercase tracking-widest block mb-3">Included in EaaS</span>
                  <ul className="space-y-2">
                    {rig.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-rfe-yellow shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 mt-auto relative z-10">
                <div className="text-lg font-bold text-white mb-4">{rig.price}</div>
                <Button onClick={() => setCurrentView('SUB_CUSTOM')} variant="outline" className="w-full">
                  Request Configuration
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* EaaS Explainer Section */}
      <div className="bg-rfe-red text-white p-12 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Repeat className="w-[400px] h-[400px]" />
        </div>
        <div className="relative z-10 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-display font-black uppercase italic mb-6">
            Stop Buying Breakdowns.
          </h2>
          <p className="text-xl mb-8 font-light">
            When you buy a traditional rig, you assume 100% of the risk. When a machine goes down, you lose the job, you lose the day's pay, and you pay for the repair. 
            <br/><br/>
            With RFE's Equipment as a Service (EaaS), we own the risk. If a component fails, we overnight a hot-swap replacement so you are back up and running immediately. You pay for uptime, not ownership of depreciating metal.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
             <div className="flex items-center gap-3">
               <Shield className="w-8 h-8 text-rfe-yellow" />
               <span className="font-bold uppercase tracking-widest">100% Covered Repairs</span>
             </div>
             <div className="flex items-center gap-3">
               <Truck className="w-8 h-8 text-rfe-yellow" />
               <span className="font-bold uppercase tracking-widest">Next-Day Hot Swaps</span>
             </div>
             <div className="flex items-center gap-3">
               <Settings className="w-8 h-8 text-rfe-yellow" />
               <span className="font-bold uppercase tracking-widest">Included Consumables</span>
             </div>
             <div className="flex items-center gap-3">
               <Briefcase className="w-8 h-8 text-rfe-yellow" />
               <span className="font-bold uppercase tracking-widest">Predictable Cashflow</span>
             </div>
          </div>
          <Button onClick={() => setCurrentView('SUB_CUSTOM')} variant="accent">
            Calculate Your EaaS ROI
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBlog = () => (
    <div className="py-12 container mx-auto px-6 min-h-screen">
      <div className="mb-12 pt-10">
        <h2 className="text-4xl font-display font-black text-white uppercase italic border-l-8 border-rfe-yellow pl-6">
          Field Notes
        </h2>
      </div>
      <div className="grid gap-12 max-w-4xl mx-auto">
        {blogPosts.map(post => (
          <article key={post.id} className="bg-rfe-lightGray border border-white/5 flex flex-col md:flex-row group hover:border-rfe-red/50 transition-colors">
            <div className="md:w-1/3 overflow-hidden relative">
               <img src={post.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={post.title} />
               <div className="absolute top-4 left-4 flex gap-2">
                 {post.tags.map(tag => (
                   <span key={tag} className="bg-black/80 text-white text-xs font-bold px-2 py-1 uppercase">{tag}</span>
                 ))}
               </div>
            </div>
            <div className="p-8 md:w-2/3">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author}</span>
              </div>
              <h3 className="text-2xl font-display font-black text-white italic uppercase mb-4 group-hover:text-rfe-red transition-colors">
                {post.title}
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {post.excerpt}
              </p>
              <button className="text-rfe-red font-bold uppercase text-sm tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                Read Article <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div className="min-h-screen pt-12 pb-24">
      {/* Header */}
      <div className="bg-rfe-lightGray py-20 border-b border-white/5">
        <div className="container mx-auto px-6 text-center">
          <span className="text-rfe-red font-bold tracking-[0.3em] uppercase mb-4 block animate-pulse">The RFE Advantage</span>
          <h1 className="text-5xl md:text-7xl font-display font-black text-white uppercase italic mb-8">
            The End Of <br /> Downtime
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Every minute you spend cleaning a gun is a minute you aren't paid. Our subscription model puts a calibrated, test-fired gun in your hand instantly. Swap it out, box up the old one, and get back to the wall.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Card 1 */}
          <div className="bg-rfe-black border border-white/10 p-8 hover:border-rfe-red/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Hammer className="w-24 h-24 text-white" />
            </div>
            <h3 className="text-rfe-yellow font-display font-black text-3xl uppercase italic mb-2">Starter</h3>
            <div className="text-4xl font-black text-white mb-2">$289<span className="text-lg text-gray-500 font-normal">/mo</span></div>
            <p className="text-xs text-gray-500 mb-6 italic">*Requires $899 initial down payment</p>
            <ul className="space-y-4 mb-8 text-gray-400 text-sm">
              <li className="flex gap-3"><CheckCircle className="text-rfe-red w-5 h-5" /> 1 Gun Swap / Month</li>
              <li className="flex gap-3"><CheckCircle className="text-rfe-red w-5 h-5" /> Standard Shipping</li>
              <li className="flex gap-3"><CheckCircle className="text-rfe-red w-5 h-5" /> Basic Support</li>
            </ul>
            <Button className="w-full" onClick={() => setCurrentView('SUB_STARTER')}>Choose Starter</Button>
          </div>

          {/* Card 2 - Featured */}
          <div className="bg-rfe-lightGray border-2 border-rfe-red p-8 transform md:-translate-y-4 shadow-glow-red relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-rfe-red text-white text-xs font-bold px-3 py-1">MOST POPULAR</div>
            <h3 className="text-white font-display font-black text-3xl uppercase italic mb-2">Growth</h3>
            <div className="text-4xl font-black text-white mb-2">$389<span className="text-lg text-gray-500 font-normal">/mo</span></div>
            <p className="text-xs text-gray-300 mb-6 italic">*Requires $1,199 initial down payment</p>
            <ul className="space-y-4 mb-8 text-white text-sm">
              <li className="flex gap-3"><CheckCircle className="text-rfe-yellow w-5 h-5" /> 3 Gun Swaps / Month</li>
              <li className="flex gap-3"><CheckCircle className="text-rfe-yellow w-5 h-5" /> Priority Shipping</li>
              <li className="flex gap-3"><CheckCircle className="text-rfe-yellow w-5 h-5" /> Phone Support</li>
            </ul>
            <Button variant="accent" className="w-full" onClick={() => setCurrentView('SUB_GROWTH')}>Choose Growth</Button>
          </div>

          {/* Card 3 */}
          <div className="bg-rfe-black border border-white/10 p-8 hover:border-rfe-red/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-24 h-24 text-white" />
            </div>
            <h3 className="text-white font-display font-black text-3xl uppercase italic mb-2">Premium</h3>
            <div className="text-4xl font-black text-white mb-2">$499<span className="text-lg text-gray-500 font-normal">/mo</span></div>
            <p className="text-xs text-gray-500 mb-6 italic">*Requires $1,400 initial down payment</p>
            <ul className="space-y-4 mb-8 text-gray-400 text-sm">
              <li className="flex gap-3"><CheckCircle className="text-rfe-red w-5 h-5" /> Unlimited Swaps</li>
              <li className="flex gap-3"><CheckCircle className="text-rfe-red w-5 h-5" /> Next Day Air Included</li>
              <li className="flex gap-3"><CheckCircle className="text-rfe-red w-5 h-5" /> 24/7 Dedicated Tech</li>
            </ul>
            <Button className="w-full" onClick={() => setCurrentView('SUB_PREMIUM')}>Choose Premium</Button>
          </div>
        </div>

        {/* NEW CUSTOM PLAN BANNER */}
        <div className="relative bg-gradient-to-r from-rfe-gray to-rfe-black border border-white/20 p-8 md:p-12 overflow-hidden group hover:border-rfe-yellow/50 transition-all duration-500">
           {/* Decorative Background */}
           <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5"></div>
           <div className="absolute right-0 bottom-0 p-4 opacity-10 transform translate-x-12 translate-y-12 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700">
             <Settings className="w-64 h-64 text-white" />
           </div>

           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex-1">
               <div className="flex items-center gap-3 mb-4">
                 <Briefcase className="text-rfe-yellow w-6 h-6" />
                 <span className="text-rfe-yellow font-bold uppercase tracking-widest text-sm">Enterprise Solutions</span>
               </div>
               <h3 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic leading-none mb-4">
                 Build Your Own <br/> Fleet Plan
               </h3>
               <p className="text-gray-300 text-lg max-w-xl">
                 Running more than 3 rigs? Need specific manufacturer configurations or custom service intervals? Build a tailored plan that scales with your contracts.
               </p>
               <ul className="flex flex-wrap gap-4 mt-6 text-sm font-bold text-gray-400 uppercase">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-rfe-red"/> Volume Discounts</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-rfe-red"/> Multi-Location</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-rfe-red"/> Dedicated Account Manager</li>
               </ul>
             </div>
             
             <div className="shrink-0">
               <Button variant="primary" className="h-16 px-10 text-lg" onClick={() => setCurrentView('SUB_CUSTOM')} icon={<Sliders className="w-5 h-5" />}>
                 Contact Enterprise Team
               </Button>
             </div>
           </div>
        </div>

      </div>
    </div>
  );

  const renderCustomSolutionContact = () => (
    <div className="min-h-screen pt-24 pb-20 container mx-auto px-6 max-w-5xl">
      <Button variant="outline" className="mb-8" onClick={() => setCurrentView('SUBSCRIPTION')} icon={<ArrowLeft className="w-4 h-4"/>}>
        Back to Plans
      </Button>

      <div className="flex flex-col md:flex-row gap-12">
         {/* Form Section */}
         <div className="flex-1 bg-rfe-lightGray border border-white/10 p-8 shadow-2xl relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rfe-yellow opacity-5 blur-3xl rounded-full translate-x-10 -translate-y-10" />

            <div className="mb-8 relative z-10">
              <h1 className="text-4xl font-display font-black text-white uppercase italic mb-2">Enterprise Solutions</h1>
              <p className="text-gray-400">Tell us about your operation. We build custom logistic and service plans for fleets of 5+ guns.</p>
            </div>

            <form onSubmit={submitCustomQuote} className="space-y-6 relative z-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-500">Name</label>
                   <input required name="name" value={customContactForm.name} onChange={handleCustomContactInput} className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-yellow focus:outline-none transition-colors" placeholder="YOUR NAME" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-500">Company</label>
                   <input name="company" value={customContactForm.company} onChange={handleCustomContactInput} className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-yellow focus:outline-none transition-colors" placeholder="COMPANY NAME" />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-500">Email</label>
                   <input required type="email" name="email" value={customContactForm.email} onChange={handleCustomContactInput} className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-yellow focus:outline-none transition-colors" placeholder="EMAIL ADDRESS" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-500">Phone</label>
                   <input required type="tel" name="phone" value={customContactForm.phone} onChange={handleCustomContactInput} className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-yellow focus:outline-none transition-colors" placeholder="PHONE NUMBER" />
                 </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Estimated Fleet Size</label>
                  <select name="fleetSize" value={customContactForm.fleetSize} onChange={handleCustomContactInput} className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-yellow focus:outline-none transition-colors">
                     <option value="">Select Fleet Size...</option>
                     <option value="5-10">5 - 10 Guns</option>
                     <option value="10-20">10 - 20 Guns</option>
                     <option value="20-50">20 - 50 Guns</option>
                     <option value="50+">50+ Guns</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Specific Requirements / Message</label>
                  <textarea name="message" value={customContactForm.message} onChange={handleCustomContactInput} className="w-full h-32 bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-yellow focus:outline-none transition-colors" placeholder="Tell us about your current pain points..." />
               </div>

               <Button className="w-full" disabled={isSubmitting}>
                 {isSubmitting ? "Sending..." : "Request Consultation"}
               </Button>
            </form>
         </div>

         {/* Sidebar info */}
         <div className="md:w-1/3 space-y-8">
             <div className="bg-rfe-yellow text-black p-6 shadow-hard-red transform skew-x-[-6deg]">
             <div className="skew-x-[6deg]">
               <h3 className="font-display font-black text-2xl uppercase italic mb-2">Why Custom?</h3>
               <p className="text-sm font-bold leading-relaxed opacity-90">
                 Large operations have unique constraints. Our custom fleet program aligns logistics with your job schedule, reducing overhead by up to 35%.
               </p>
             </div>
           </div>

           <div className="border-l-2 border-white/20 pl-6 space-y-6">
              <div>
                <h4 className="text-white font-bold uppercase mb-1">Unified Billing</h4>
                <p className="text-gray-500 text-sm">One invoice for your entire fleet's maintenance.</p>
              </div>
              <div>
                <h4 className="text-white font-bold uppercase mb-1">Asset Tracking</h4>
                <p className="text-gray-500 text-sm">Real-time portal to track which gun is with which rig.</p>
              </div>
              <div>
                <h4 className="text-white font-bold uppercase mb-1">Training Included</h4>
                <p className="text-gray-500 text-sm">On-site training days included with Elite tier custom plans.</p>
              </div>
           </div>
         </div>
      </div>
    </div>
  );

  const renderCheckout = () => (
    <div className="min-h-screen pt-24 pb-20 container mx-auto px-6 max-w-7xl">
      <Button variant="outline" className="mb-8" onClick={() => setCurrentView('CATALOG')} icon={<ArrowLeft className="w-4 h-4"/>}>
        Continue Shopping
      </Button>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Contact Form */}
        <div className="flex-1">
          <div className="bg-rfe-lightGray border border-white/10 p-8 shadow-2xl relative overflow-hidden">
             {/* Decor */}
             <div className="absolute top-0 right-0 w-24 h-24 bg-rfe-red opacity-10 blur-2xl rounded-full translate-x-10 -translate-y-10" />

             <div className="mb-8 relative z-10">
               <span className="text-rfe-yellow font-bold tracking-widest text-xs uppercase mb-2 block">Step 1 of 2</span>
               <h2 className="text-4xl font-display font-black text-white uppercase italic">Secure Your Gear</h2>
               <p className="text-gray-400 mt-2">Complete the form below to request an official invoice and shipping quote. No payment required today.</p>
             </div>

             <form onSubmit={submitOrder} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><User className="w-3 h-3"/> First Name</label>
                    <input 
                      required name="firstName" value={checkoutForm.firstName} onChange={handleCheckoutInput}
                      className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-red focus:outline-none focus:bg-black/60 transition-colors" 
                      placeholder="JOHN"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><User className="w-3 h-3"/> Last Name</label>
                    <input 
                      required name="lastName" value={checkoutForm.lastName} onChange={handleCheckoutInput}
                      className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-red focus:outline-none focus:bg-black/60 transition-colors" 
                      placeholder="DOE"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Mail className="w-3 h-3"/> Email Address</label>
                    <input 
                      required type="email" name="email" value={checkoutForm.email} onChange={handleCheckoutInput}
                      className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-red focus:outline-none focus:bg-black/60 transition-colors" 
                      placeholder="JOHN@EXAMPLE.COM"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Phone className="w-3 h-3"/> Phone Number</label>
                    <input 
                      required type="tel" name="phone" value={checkoutForm.phone} onChange={handleCheckoutInput}
                      className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-red focus:outline-none focus:bg-black/60 transition-colors" 
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Briefcase className="w-3 h-3"/> Company Name (Optional)</label>
                   <input 
                      name="company" value={checkoutForm.company} onChange={handleCheckoutInput}
                      className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-red focus:outline-none focus:bg-black/60 transition-colors" 
                      placeholder="ACME INSULATION LLC"
                    />
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><MapPin className="w-3 h-3"/> Shipping Address</label>
                   <input 
                      required name="address" value={checkoutForm.address} onChange={handleCheckoutInput}
                      className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-red focus:outline-none focus:bg-black/60 transition-colors mb-3" 
                      placeholder="123 INDUSTRIAL PARKWAY"
                    />
                    <div className="grid grid-cols-6 gap-3">
                      <input 
                        required name="city" value={checkoutForm.city} onChange={handleCheckoutInput}
                        className="col-span-3 bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-red focus:outline-none" 
                        placeholder="CITY"
                      />
                      <input 
                        required name="state" value={checkoutForm.state} onChange={handleCheckoutInput}
                        className="col-span-1 bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-red focus:outline-none" 
                        placeholder="ST"
                      />
                      <input 
                        required name="zip" value={checkoutForm.zip} onChange={handleCheckoutInput}
                        className="col-span-2 bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-red focus:outline-none" 
                        placeholder="ZIP"
                      />
                    </div>
                </div>
                
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><FileText className="w-3 h-3"/> Order Notes / PO #</label>
                   <textarea 
                      name="notes" value={checkoutForm.notes} onChange={handleCheckoutInput}
                      className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-rfe-red focus:outline-none focus:bg-black/60 transition-colors h-24" 
                      placeholder="Gate code, forklift needed, etc."
                    />
                </div>
             </form>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:w-1/3">
           <div className="bg-rfe-black border border-white/10 p-6 sticky top-24">
              <h3 className="font-display font-black text-2xl uppercase italic text-white mb-6 border-b border-white/10 pb-4">
                Order Summary
              </h3>
              
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-white/5 shrink-0">
                       <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm uppercase leading-tight">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} x ${item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {cartItems.length === 0 && <p className="text-gray-500 italic">Cart is empty.</p>}
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 uppercase text-xs font-bold">Subtotal</span>
                  <span className="text-white font-bold">${cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 uppercase text-xs font-bold">Shipping</span>
                  <span className="text-gray-500 text-xs italic">Calculated on Invoice</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <span className="text-white uppercase font-black text-lg">Estimated Total</span>
                  <span className="text-rfe-yellow font-display font-black text-2xl">${cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}</span>
                </div>
              </div>

              <Button 
                onClick={submitOrder} 
                className="w-full py-4 text-lg" 
                disabled={isSubmitting || cartItems.length === 0}
                icon={<Send className="w-5 h-5"/>}
              >
                {isSubmitting ? 'Processing...' : 'Submit Request'}
              </Button>
              <p className="text-[10px] text-gray-500 text-center mt-4">
                By submitting this request, you agree to our terms of service. An RFE representative will contact you within 24 hours to confirm shipping details and payment.
              </p>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-rfe-body min-h-screen text-white font-body selection:bg-rfe-red selection:text-white flex flex-col">
      <Navbar 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
        currentView={currentView}
        onNavigate={setCurrentView}
        onToggleCart={() => setIsCartOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-grow pt-20">
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CATALOG' && renderCatalog()}
        {currentView === 'RIGS' && renderRigs()}
        {currentView === 'BLOG' && renderBlog()}
        {currentView === 'SUBSCRIPTION' && renderSubscription()}
        {currentView === 'SUB_CUSTOM' && renderCustomSolutionContact()}
        {currentView === 'CHECKOUT' && renderCheckout()}
        
        {/* Simple placeholder for other views to prevent crashes */}
        {(currentView === 'SUB_STARTER' || currentView === 'SUB_GROWTH' || currentView === 'SUB_PREMIUM') && (
           <div className="container mx-auto px-6 py-20 text-center">
             <h2 className="text-4xl font-display font-black uppercase italic mb-6">Plan Selected</h2>
             <p className="text-gray-400 mb-8">This is where the checkout flow for standard plans would go.</p>
             <Button onClick={() => setCurrentView('SUBSCRIPTION')}>Back to Plans</Button>
           </div>
        )}
      </main>

      <Footer onSubscribe={handleNewsletter} />
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cartItems} 
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setCurrentView('CHECKOUT');
        }}
      />

      {/* Subscription Popup Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSubModalOpen(false)} />
          <div className="bg-white text-black p-1 max-w-lg w-full relative z-10 shadow-2xl transform skew-x-[-2deg] animate-in zoom-in-95 duration-300">
            <div className="bg-rfe-lightGray p-8 relative overflow-hidden">
               <button onClick={() => setIsSubModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
               <div className="relative z-10">
                 <span className="bg-rfe-red text-white text-xs font-bold px-2 py-1 uppercase tracking-widest mb-4 inline-block">New Launch</span>
                 <h2 className="font-display font-black text-4xl text-white uppercase italic mb-4">
                   Downtime Kills <br/> <span className="text-rfe-yellow">Profits.</span>
                 </h2>
                 <p className="text-gray-300 mb-8">
                   Why spend 2 hours rebuilding when you could be spraying? Join the RFE Gun Subscription. Swap guns in 5 minutes and keep the rig running. Starting at just $289/mo.
                 </p>
                 <div className="flex gap-4">
                   <Button onClick={() => { setIsSubModalOpen(false); setCurrentView('SUBSCRIPTION'); }}>
                     View Plans
                   </Button>
                   <button onClick={() => setIsSubModalOpen(false)} className="text-gray-400 text-sm font-bold uppercase hover:text-white">
                     No thanks, I love downtime
                   </button>
                 </div>
               </div>
               {/* Decor */}
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rfe-red/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-rfe-yellow text-black px-6 py-3 font-bold uppercase tracking-widest shadow-glow-red z-[100] animate-in slide-in-from-bottom-4">
          {notification}
        </div>
      )}
    </div>
  );
};

export default App;