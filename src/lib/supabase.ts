import { createClient } from '@supabase/supabase-js'
import { MenuItem } from './data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      
    if (error) {
        console.error('Error fetching menu items:', error)
        return [];
    }
    
    // Map Supabase data to local MenuItem type
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      imageUrl: item.image_url,
      aiHint: item.ai_hint,
    }));
}
