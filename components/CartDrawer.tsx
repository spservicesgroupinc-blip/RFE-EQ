import React from 'react';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';
import { Button } from './ui/Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemoveItem,
  onCheckout
}) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-rfe-gray border-l border-white/10 z-[70] shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-rfe-black/50">
          <h2 className="font-display font-black text-2xl italic uppercase text-white flex items-center gap-2">
            Gear Loadout <span className="text-rfe-red">.</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <span className="text-6xl mb-4">🛒</span>
              <p className="font-display font-bold uppercase text-xl">Your cart is empty</p>
              <p className="text-sm mt-2">Equip yourself with the best gear.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white/5 p-4 border border-white/5 relative group">
                <div className="w-20 h-20 bg-rfe-black shrink-0 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-display font-bold uppercase text-white text-sm leading-tight pr-4">
                      {item.name}
                    </h3>
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-500 hover:text-rfe-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-rfe-yellow text-xs font-bold uppercase mt-1">{item.category}</p>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                    <span className="font-display font-black text-lg">${item.price.toLocaleString()}</span>
                  </div>
                </div>
                {/* Accent border */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rfe-red transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-rfe-black border-t border-white/10">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400 uppercase font-bold text-sm">Subtotal</span>
            <span className="font-display font-black text-3xl text-white">
              ${total.toLocaleString()}
            </span>
          </div>
          <Button 
            variant="primary" 
            className="w-full" 
            onClick={onCheckout}
            disabled={items.length === 0}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Secure Your Gear
          </Button>
        </div>
      </div>
    </>
  );
};