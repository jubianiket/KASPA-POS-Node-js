
export type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  portion?: string;
};

export type Order = {
  id: string;
  orderNumber: number;
  type: 'dine-in' | 'delivery';
  table?: number;
  phone_no?: string;
  flat_no?: string;
  building_no?: string;
  items: {
    name: string;
    quantity: number;
    notes?: string;
    portion?: string;
    price?: number;
  }[];
  timestamp: string;
  status: 'received' | 'preparing' | 'ready' | 'completed';
  subtotal?: number;
  tax?: number;
  total?: number;
};

export const menuCategories: string[] = ['Appetizers', 'Main Course', 'Desserts', 'Beverages'];

export const menuItems: MenuItem[] = [
  { id: 1, name: 'Bruschetta', price: 8.99, category: 'Appetizers', portion: 'Standard' },
  { id: 2, name: 'Caprese Salad', price: 10.50, category: 'Appetizers', portion: 'Standard' },
  { id: 3, name: 'Garlic Bread', price: 6.00, category: 'Appetizers', portion: 'Standard' },
  { id: 4, name: 'Spaghetti Carbonara', price: 15.99, category: 'Main Course', portion: 'Regular' },
  { id: 5, name: 'Margherita Pizza', price: 14.50, category: 'Main Course', portion: '12-inch' },
  { id: 6, name: 'Grilled Salmon', price: 22.00, category: 'Main Course', portion: 'Standard' },
  { id: 7, name: 'Steak Frites', price: 28.50, category: 'Main Course', portion: 'Standard' },
  { id: 8, name: 'Chicken Parmesan', price: 18.00, category: 'Main Course', portion: 'Standard' },
  { id: 9, name: 'Tiramisu', price: 9.00, category: 'Desserts', portion: 'Slice' },
  { id: 10, name: 'Chocolate Lava Cake', price: 9.50, category: 'Desserts', portion: 'Standard' },
  { id: 11, name: 'Cheesecake', price: 8.50, category: 'Desserts', portion: 'Slice' },
  { id: 12, name: 'Espresso', price: 3.50, category: 'Beverages', portion: 'Single' },
  { id: 13, name: 'Latte', price: 4.50, category: 'Beverages', portion: '12oz' },
  { id: 14, name: 'Fresh Orange Juice', price: 5.00, category: 'Beverages', portion: '16oz' },
];

export const orders: Omit<Order, 'phone_no' | 'flat_no' | 'building_no'>[] = [
  {
    id: 'a1b2c3d4',
    orderNumber: 101,
    type: 'dine-in',
    table: 5,
    items: [
      { name: 'Margherita Pizza', quantity: 1, portion: '12-inch' },
      { name: 'Spaghetti Carbonara', quantity: 1, notes: 'Extra cheese', portion: 'Regular' },
      { name: 'Fresh Orange Juice', quantity: 2, portion: '16oz' },
    ],
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    status: 'received',
  },
  {
    id: 'i9j0k1l2',
    orderNumber: 103,
    type: 'dine-in',
    table: 2,
    items: [
      { name: 'Grilled Salmon', quantity: 2, portion: 'Standard' },
      { name: 'Caprese Salad', quantity: 1, portion: 'Standard' },
      { name: 'Latte', quantity: 2, portion: '12oz' },
    ],
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    status: 'ready',
  },
  {
    id: 'm3n4o5p6',
    orderNumber: 104,
    type: 'delivery',
    items: [
      { name: 'Chicken Parmesan', quantity: 1, portion: 'Standard' },
      { name: 'Garlic Bread', quantity: 1, portion: 'Standard' },
    ],
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'completed',
  },
];

    
