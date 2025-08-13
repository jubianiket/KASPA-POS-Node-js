export type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  aiHint: string;
};

export type Order = {
  id: string;
  orderNumber: number;
  type: 'dine-in' | 'takeaway' | 'delivery';
  table?: number;
  items: {
    name: string;
    quantity: number;
    notes?: string;
  }[];
  timestamp: string;
  status: 'received' | 'preparing' | 'ready' | 'completed';
};

export const menuCategories: string[] = ['Appetizers', 'Main Course', 'Desserts', 'Beverages'];

export const menuItems: MenuItem[] = [
  { id: 1, name: 'Bruschetta', price: 8.99, category: 'Appetizers', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'toast tomato' },
  { id: 2, name: 'Caprese Salad', price: 10.50, category: 'Appetizers', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'salad cheese' },
  { id: 3, name: 'Garlic Bread', price: 6.00, category: 'Appetizers', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'bread garlic' },
  { id: 4, name: 'Spaghetti Carbonara', price: 15.99, category: 'Main Course', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'pasta egg' },
  { id: 5, name: 'Margherita Pizza', price: 14.50, category: 'Main Course', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'pizza cheese' },
  { id: 6, name: 'Grilled Salmon', price: 22.00, category: 'Main Course', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'fish lemon' },
  { id: 7, name: 'Steak Frites', price: 28.50, category: 'Main Course', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'beef fries' },
  { id: 8, name: 'Chicken Parmesan', price: 18.00, category: 'Main Course', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'chicken cheese' },
  { id: 9, name: 'Tiramisu', price: 9.00, category: 'Desserts', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'cake coffee' },
  { id: 10, name: 'Chocolate Lava Cake', price: 9.50, category: 'Desserts', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'chocolate cake' },
  { id: 11, name: 'Cheesecake', price: 8.50, category: 'Desserts', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'berry cake' },
  { id: 12, name: 'Espresso', price: 3.50, category: 'Beverages', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'coffee cup' },
  { id: 13, name: 'Latte', price: 4.50, category: 'Beverages', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'coffee milk' },
  { id: 14, name: 'Fresh Orange Juice', price: 5.00, category: 'Beverages', imageUrl: 'https://placehold.co/600x400.png', aiHint: 'orange juice' },
];

export const orders: Order[] = [
  {
    id: 'a1b2c3d4',
    orderNumber: 101,
    type: 'dine-in',
    table: 5,
    items: [
      { name: 'Margherita Pizza', quantity: 1 },
      { name: 'Spaghetti Carbonara', quantity: 1, notes: 'Extra cheese' },
      { name: 'Fresh Orange Juice', quantity: 2 },
    ],
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    status: 'received',
  },
  {
    id: 'e5f6g7h8',
    orderNumber: 102,
    type: 'takeaway',
    items: [
      { name: 'Steak Frites', quantity: 1, notes: 'Medium rare' },
      { name: 'Chocolate Lava Cake', quantity: 1 },
    ],
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'preparing',
  },
  {
    id: 'i9j0k1l2',
    orderNumber: 103,
    type: 'dine-in',
    table: 2,
    items: [
      { name: 'Grilled Salmon', quantity: 2 },
      { name: 'Caprese Salad', quantity: 1 },
      { name: 'Latte', quantity: 2 },
    ],
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    status: 'ready',
  },
  {
    id: 'm3n4o5p6',
    orderNumber: 104,
    type: 'delivery',
    items: [
      { name: 'Chicken Parmesan', quantity: 1 },
      { name: 'Garlic Bread', quantity: 1 },
    ],
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'completed',
  },
];
