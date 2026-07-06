import React from 'react';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../types';
import { Button } from './ui/Button';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="group relative w-full">
      {/* Card Background with Glassmorphism */}
      <div className="relative h-full bg-rfe-lightGray/60 backdrop-blur-md border border-white/10 hover:border-rfe-red/50 transition-all duration-300 overflow-hidden skew-x-[-6deg] hover:-translate-y-2 hover:shadow-glow-red">
        
        {/* Un-skew internal content wrapper */}
        <div className="skew-x-[6deg] h-full flex flex-col">
          
          {/* Image Area */}
          <div className="relative h-64 overflow-hidden bg-rfe-black">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rfe-black via-transparent to-transparent opacity-80" />
            
            {/* Badge */}
            {product.badge && (
              <div className="absolute top-4 right-0 bg-rfe-yellow text-black font-display font-black text-xs px-3 py-1 -skew-x-12 translate-x-2">
                <span className="block skew-x-12">{product.badge}</span>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-6 flex flex-col flex-grow relative">
            {/* Red Accent Border */}
            <div className="absolute left-0 top-6 bottom-6 w-1 bg-rfe-red transform -skew-x-6 origin-left" />

            <div className="pl-4">
              <span className="text-rfe-yellow text-xs font-bold tracking-[0.2em] uppercase mb-1 block">
                {product.category}
              </span>
              <h3 className="text-white font-display font-black text-xl italic uppercase leading-none mb-3 group-hover:text-rfe-red transition-colors">
                {product.name}
              </h3>
              <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                {product.description}
              </p>
            </div>

            <div className="mt-auto pl-4 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Price</span>
                <span className="text-2xl font-display font-black text-white">
                  ${product.price.toLocaleString()}
                </span>
              </div>
              
              <button 
                onClick={() => onAddToCart(product)}
                className="bg-rfe-red p-3 hover:bg-white hover:text-rfe-red transition-colors duration-300 transform -skew-x-12 shadow-hard hover:shadow-hard-yellow group/btn"
              >
                <ShoppingCart className="w-5 h-5 skew-x-12" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};