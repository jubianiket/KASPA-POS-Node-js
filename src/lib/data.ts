

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
  seat?: number;
  phone_no?: string;
  address?: string;
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

export const menuCategories: string[] = ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Salads', 'Soups'];

export type RestaurantSettings = {
  id: number;
  restaurant_name: string;
  address: string;
  phone: string;
  tax_enabled: boolean;
  tax_rate: number;
  tax_id: string;
  dark_mode: boolean;
  theme_color: string;
};
