import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Search, Zap } from 'lucide-react';
import { ViewState } from '../types';

interface NavbarProps {
  cartCount: number;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onToggleCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, currentView, onNavigate, onToggleCart }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    scrolled 
      ? 'bg-rfe-black/90 backdrop-blur-xl border-b border-white/10 py-3' 
      : 'bg-transparent py-6'
  }`;

  return (
    <nav className={navClasses}>
      <div className="container mx-auto px-6 flex justify-between items-center max-w-7xl">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onNavigate('HOME')}
        >
          <div className="w-10 h-10 bg-rfe-red transform -skew-x-12 flex items-center justify-center shadow-glow-red group-hover:scale-105 transition-transform">
            <span className="font-logo font-black text-white text-xl skew-x-12">RFE</span>
          </div>
          <div className="hidden md:block">
            <h1 className="font-display font-black text-2xl italic tracking-tighter leading-none">
              RFE <span className="text-rfe-red">.</span>
            </h1>
            <p className="text-[0.6rem] font-bold tracking-[0.2em] text-rfe-yellow uppercase">Foam Equipment</p>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {['Home', 'Catalog', 'Rigs', 'Blog'].map((item) => (
            <button
              key={item}
              onClick={() => {
                if (item === 'Home') onNavigate('HOME');
                if (item === 'Catalog') onNavigate('CATALOG');
                if (item === 'Rigs') onNavigate('RIGS');
                if (item === 'Blog') onNavigate('BLOG');
              }}
              className="text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-rfe-red transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rfe-red transition-all group-hover:w-full" />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          
          {/* Eye Catching Subscription Button */}
          <button 
            onClick={() => onNavigate('SUBSCRIPTION')}
            className="hidden md:flex bg-rfe-yellow text-black px-4 py-2 font-black uppercase italic transform -skew-x-12 hover:scale-105 transition-all shadow-hard-red animate-pulse hover:animate-none items-center gap-2 border-2 border-transparent hover:border-white"
          >
            <Zap className="w-4 h-4 skew-x-12 fill-black" />
            <span className="skew-x-12 text-xs tracking-wider">New! Gun Subscription</span>
          </button>

          <button className="hidden md:flex p-2 text-white hover:text-rfe-yellow transition-colors">
            <Search className="w-5 h-5" />
          </button>
          
          <button 
            onClick={onToggleCart}
            className="relative p-2 text-white hover:text-rfe-red transition-colors group"
          >
            <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rfe-red text-white text-xs font-bold flex items-center justify-center rounded-sm transform -skew-x-12 shadow-glow-red">
                <span className="skew-x-12">{cartCount}</span>
              </span>
            )}
          </button>

          <button 
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-rfe-black/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-4">
           <button
            onClick={() => {
              onNavigate('SUBSCRIPTION');
              setMobileMenuOpen(false);
            }}
            className="bg-rfe-yellow text-black px-4 py-3 font-black uppercase italic text-center"
          >
            NEW! Gun Subscription
          </button>
          {['Home', 'Catalog', 'Rigs', 'Blog'].map((item) => (
            <button
              key={item}
              onClick={() => {
                if (item === 'Home') onNavigate('HOME');
                if (item === 'Catalog') onNavigate('CATALOG');
                if (item === 'Rigs') onNavigate('RIGS');
                if (item === 'Blog') onNavigate('BLOG');
                setMobileMenuOpen(false);
              }}
              className="text-left text-lg font-display font-black uppercase text-white hover:text-rfe-red"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};