import React, { useState } from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  onSubscribe?: (email: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSubscribe }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubscribe && email) {
      onSubscribe(email);
      setEmail('');
    }
  };

  return (
    <footer className="bg-rfe-gray border-t border-white/5 pt-16 pb-8 relative overflow-hidden">
      {/* Decorative Top Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rfe-red via-rfe-yellow to-rfe-red opacity-80" />

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-rfe-red transform -skew-x-12 flex items-center justify-center">
                <span className="font-logo font-black text-white text-lg skew-x-12">RFE</span>
              </div>
              <span className="font-display font-black text-xl italic tracking-tighter">RFE</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Family owned and built for production. We reject the corporate model of failure-based revenue. RFE exists to keep you spraying and profitable.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-white/5 flex items-center justify-center hover:bg-rfe-red hover:text-white transition-all transform -skew-x-12 group">
                  <Icon className="w-4 h-4 skew-x-12" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-black text-white uppercase italic tracking-wider mb-6 border-l-4 border-rfe-yellow pl-3">
              Explore
            </h4>
            <ul className="space-y-3">
              {['Equipment Catalog', 'Rig Financing', 'Tech Support', 'Parts & Service', 'About Us'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-rfe-red uppercase text-sm font-bold tracking-wide transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-rfe-red opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-black text-white uppercase italic tracking-wider mb-6 border-l-4 border-rfe-red pl-3">
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin className="w-5 h-5 text-rfe-red shrink-0" />
                <span>2017 W. 500 N.<br />Monon, IN 47959</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Phone className="w-5 h-5 text-rfe-red shrink-0" />
                <span>260-414-9691</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail className="w-5 h-5 text-rfe-red shrink-0" />
                <span>sales@rfe-equip.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display font-black text-white uppercase italic tracking-wider mb-6">
              Stay Pumped
            </h4>
            <p className="text-gray-400 text-xs mb-4">Subscribe for equipment deals and maintenance tips.</p>
            <form onSubmit={handleSubmit} className="flex">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS" 
                className="bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-rfe-red w-full placeholder:text-gray-600 font-bold uppercase"
              />
              <button type="submit" className="bg-rfe-red px-4 text-white hover:bg-white hover:text-rfe-red transition-colors">
                <span className="font-black text-xl">→</span>
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 font-bold uppercase tracking-widest">
          <p>© 2024 RFE Foam Equipment. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};