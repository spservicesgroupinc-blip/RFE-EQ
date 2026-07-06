export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  badge?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface BlogPost {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  image: string;
  tags: string[];
}

export type ViewState = 'HOME' | 'CATALOG' | 'RIGS' | 'BLOG' | 'CONTACT' | 'CHECKOUT' | 'SUBSCRIPTION' | 'SUB_STARTER' | 'SUB_GROWTH' | 'SUB_PREMIUM' | 'SUB_CUSTOM';