import { Product, BlogPost } from './types';

export const products: Product[] = [
  {
    id: 1,
    name: "Pro-Force Air Purge Gun",
    category: "Spray Guns",
    price: 1299.00,
    image: "https://picsum.photos/400/400?random=10",
    description: "Lightweight, easy-to-handle air purge gun designed for high-volume residential applications.",
    badge: "Best Seller"
  },
  {
    id: 2,
    name: "R-10 Air Proportioner",
    category: "Machines",
    price: 8900.00,
    image: "https://picsum.photos/400/400?random=11",
    description: "Entry level Starter Machine. A reliable, compact air-driven proportioner perfect for new contractors.",
    badge: "Starter Special"
  },
  {
    id: 3,
    name: "Heated Hose Assembly (50ft)",
    category: "Hoses",
    price: 699.00,
    image: "https://picsum.photos/400/400?random=12",
    description: "Low-pressure heated hose with copper heating element for uniform material viscosity.",
  },
  {
    id: 4,
    name: "Turn-Key Mobile Spray Rig",
    category: "Rigs",
    price: 22985.00,
    image: "https://picsum.photos/400/400?random=13",
    description: "20ft Custom Trailer fully equipped with generator, compressor, and E-30 reactor.",
    badge: "Complete System"
  },
  {
    id: 5,
    name: "R2 Transfer Pump",
    category: "Pumps",
    price: 499.99,
    image: "https://picsum.photos/400/400?random=14",
    description: "Reliable 2:1 ratio transfer pump constructed from stainless steel for long life.",
  },
  {
    id: 6,
    name: "Gun Service Kit (O-Rings)",
    category: "Parts",
    price: 89.99,
    image: "https://picsum.photos/400/400?random=15",
    description: "Complete seal and O-ring replacement kit to keep your gun firing without downtime.",
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Optimizing Yield: Temperature Control in Winter",
    date: "March 15, 2024",
    author: "Mike 'Tex' Henderson",
    excerpt: "Cold substrates are the enemy of yield. Learn how to adjust your H-25 delta-T settings to maintain profile thickness when ambient temps drop below 40°F.",
    image: "https://picsum.photos/800/600?random=20",
    tags: ["Technical", "Field Guide"]
  },
  {
    id: 2,
    title: "Maintenance Bulletin: O-Ring Failure Analysis",
    date: "February 28, 2024",
    author: "RFE Engineering",
    excerpt: "Are you blowing through seals? We analyze the top 3 causes of premature O-ring failure in air purge guns and how proper lubrication schedules save thousands.",
    image: "https://picsum.photos/800/600?random=21",
    tags: ["Maintenance", "Service"]
  },
  {
    id: 3,
    title: "Rig Layouts: Maximizing Workflow Efficiency",
    date: "January 10, 2024",
    author: "Sarah Jenkins",
    excerpt: "Time is money. A look inside our new 20ft custom trailer layout designed to cut setup time by 35% using ergonomic drum placement and hose racking.",
    image: "https://picsum.photos/800/600?random=22",
    tags: ["Rigs", "Design"]
  }
];