import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "relative font-display font-black uppercase tracking-widest transition-all duration-300 transform skew-x-[-12deg] group flex items-center justify-center gap-2";
  
  const sizes = {
    sm: "px-6 py-2 text-xs",
    md: "px-8 py-3 text-sm",
    lg: "px-10 py-4 text-base"
  };

  const variants = {
    primary: "bg-rfe-red text-white shadow-hard hover:shadow-hard-yellow hover:-translate-y-1 hover:bg-rfe-red-dark border-2 border-transparent",
    secondary: "bg-white text-rfe-black shadow-hard-red hover:shadow-hard hover:-translate-y-1",
    outline: "bg-transparent text-white border border-white/30 hover:bg-white/10 hover:border-rfe-red hover:text-rfe-red shadow-none",
    accent: "bg-rfe-yellow text-rfe-black shadow-hard-red hover:bg-white hover:text-rfe-red hover:-translate-y-1"
  };

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      <div className="skew-x-[12deg] flex items-center gap-2">
        {children}
        {icon && <span className="transition-transform group-hover:translate-x-1">{icon}</span>}
      </div>
    </button>
  );
};