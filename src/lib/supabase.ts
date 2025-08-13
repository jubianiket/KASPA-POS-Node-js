import { createClient } from '@supabase/supabase-js'
import { MenuItem } from './data';
import sql from './db.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const items = await sql`
      SELECT id, name, price, category, image_url, ai_hint FROM menu_items
    `;
    
    // Map data to local MenuItem type
    return items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      imageUrl: item.image_url,
      aiHint: item.ai_hint,
    }));
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return [];
  }
}
