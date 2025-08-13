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
    .select('id, name, price, category, image_url, ai_hint');

  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }

  // Map data to local MenuItem type
  return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      imageUrl: item.image_url,
      aiHint: item.ai_hint,
  }));
}
