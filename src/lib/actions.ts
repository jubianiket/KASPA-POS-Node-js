'use server';

import { MenuItem } from './data';
import { createClient } from '@supabase/supabase-js'

// Create a new Supabase client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function getMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('id, name, rate, category');

  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }

  // Map data to local MenuItem type
  return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.rate, // map rate to price
      category: item.category,
      imageUrl: 'https://placehold.co/600x400.png', // Add placeholder
      aiHint: item.name.toLowerCase().split(' ').slice(0,2).join(' '), // Generate hint from name
  }));
}

export async function createOrder(orderData: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select();

    if (error) {
      console.error('Error inserting order:', error);
      throw new Error(`Error creating order: ${error.message}`);
    }
    
    return data;
  } catch(e) {
    console.error(e);
    throw e;
  }
}
