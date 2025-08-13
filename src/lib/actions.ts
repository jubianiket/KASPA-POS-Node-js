'use server';

import { MenuItem } from './data';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
let sql: postgres.Sql<{}>;

if (connectionString) {
  sql = postgres(connectionString);
} else {
  console.warn("DATABASE_URL is not set. Database queries will fail.");
  // Provide a mock sql instance to avoid crashing during initialization
  sql = postgres({}); 
}

export async function getMenuItems(): Promise<MenuItem[]> {
  if (!connectionString) {
    console.error('DATABASE_URL is not configured.');
    return [];
  }
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
