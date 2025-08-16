
'use server';

import { MenuItem, Order, RestaurantSettings } from './data';
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Admin client for write operations
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_SUPABASE_SERVICE_ROLE_KEY')
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null;

const createSupabaseServerClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                storage: {
                    getItem: (key) => cookies().get(key)?.value,
                    setItem: (key, value) => cookies().set(key, value, { path: '/' }),
                    removeItem: (key) => cookies().delete(key),
                },
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
            },
        }
    );
};

const getSupabaseHeaders = () => {
    return {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
    };
}

const isSupabaseConfigured = () => {
    return process.env.NEXT_PUBLIC_SUPABASE_URL &&
           !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_SUPABASE_URL') &&
           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
           !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY');
}

export async function getMenuItems(): Promise<MenuItem[]> {
  if (!isSupabaseConfigured()) return [];
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?select=id,name,rate,category,portion&order=name.asc`, {
    headers: getSupabaseHeaders(),
    next: { revalidate: 60 } // Revalidate every 60 seconds
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error fetching menu items:', error);
    return [];
  }
  
  const data = await response.json();

  return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.rate,
      category: item.category,
      portion: item.portion
  }));
}

export async function createMenuItem(itemData: Omit<MenuItem, 'id'>) {
    if (!supabaseAdmin) throw new Error('Supabase admin client not initialized.');
    const { data, error } = await supabaseAdmin
        .from('menu_items')
        .insert([{ name: itemData.name, rate: itemData.price, category: itemData.category, portion: itemData.portion }])
        .select();

    if (error) {
        console.error('Error creating menu item:', error);
        throw new Error(`Error creating menu item: ${error.message}`);
    }
    revalidatePath('/menu');
    return data;
}

export async function updateMenuItem(id: number, itemData: Omit<MenuItem, 'id'>) {
    if (!supabaseAdmin) throw new Error('Supabase admin client not initialized.');
    const { data, error } = await supabaseAdmin
        .from('menu_items')
        .update({ name: itemData.name, rate: itemData.price, category: itemData.category, portion: itemData.portion })
        .eq('id', id)
        .select();
    
    if (error) {
        console.error(`Error updating menu item ${id}:`, error);
        throw new Error(`Error updating menu item: ${error.message}`);
    }
    revalidatePath('/menu');
    return data;
}

export async function deleteMenuItem(id: number) {
    if (!supabaseAdmin) throw new Error('Supabase admin client not initialized.');
    const { error } = await supabaseAdmin
        .from('menu_items')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Error deleting menu item ${id}:`, error);
        throw new Error(`Error deleting menu item: ${error.message}`);
    }
    revalidatePath('/menu');
    return { success: true };
}


export async function createOrder(orderData: any) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized.');
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select();

    if (error) {
      console.error('Error inserting order:', error);
      throw new Error(`Error creating order: ${error.message}`);
    }
    revalidatePath('/'); // Revalidate POS page
    revalidatePath('/kds'); // Revalidate KDS
    revalidatePath('/dashboard'); // Revalidate Dashboard
    revalidatePath('/history'); // Revalidate History
    return data;
  } catch(e) {
    console.error(e);
    throw e;
  }
}

export async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?select=*&order=date.desc`, {
    headers: getSupabaseHeaders(),
    next: { revalidate: 10 } // Revalidate every 10 seconds for fresh orders
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error fetching orders:', error);
    return [];
  }

  const data = await response.json();

  return data.map((order: any) => ({
    id: order.id,
    orderNumber: order.id,
    type: order.order_type,
    table: order.table_number,
    seat: order.seat_number,
    items: order.items,
    timestamp: order.date,
    status: order.status,
    subtotal: order.sub_total,
    tax: order.gst,
    total: order.total,
    phone_no: order.phone_no,
    address: order.address,
  }));
}

export async function updateOrderStatus(orderId: string, status: Order['status'], orderData?: any) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized.');
  
  const updatePayload: { [key: string]: any } = orderData ? { ...orderData } : {};
  updatePayload.status = status;

  if (updatePayload.phone_no) {
    updatePayload.phone_no = updatePayload.phone_no;
  }
  if (updatePayload.address) {
    updatePayload.address = updatePayload.address;
  }
  
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select();

  if (error) {
    console.error(`Error updating order ${orderId}:`, error);
    throw new Error('Could not update order status.');
  }
  
  revalidatePath('/'); // Revalidate POS page
  revalidatePath('/kds'); // Revalidate KDS
  revalidatePath('/dashboard'); // Revalidate Dashboard
  revalidatePath('/history'); // Revalidate History
  return data;
}

export async function getSettings(): Promise<RestaurantSettings | null> {
    if (!isSupabaseConfigured()) return null;

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/restaurant_settings?id=eq.1&select=*`, {
        headers: getSupabaseHeaders(),
        next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!response.ok) {
        console.error('Error fetching settings:', await response.text());
        return null;
    }
    
    const data = await response.json();

    if (data && data.length > 0) {
        const settings = data[0];
        return {
            id: settings.id,
            restaurant_name: settings.restaurant_name,
            address: settings.address,
            phone: settings.phone,
            tax_enabled: settings.tax_enabled,
            tax_rate: settings.tax_rate,
            tax_id: settings.tax_id,
            dark_mode: settings.dark_mode,
            theme_color: settings.theme_color
        };
    }

    if (!supabaseAdmin) {
        console.error('Supabase admin client not initialized. Cannot create default settings.');
        return null;
    }

    // If no settings, create default ones
    const { data: insertData, error: insertError } = await supabaseAdmin
        .from('restaurant_settings')
        .insert({ id: 1, restaurant_name: 'KASPA POS', address: '123 Culinary Lane, Foodie City, 10101', phone: '(123) 456-7890' })
        .select()
        .single();
    if (insertError) {
         console.error('Error inserting default settings:', insertError);
         return null
    }
    return {
        id: insertData.id,
        restaurant_name: insertData.restaurant_name,
        address: insertData.address,
        phone: insertData.phone,
        tax_enabled: insertData.tax_enabled,
        tax_rate: insertData.tax_rate,
        tax_id: insertData.tax_id,
        dark_mode: insertData.dark_mode,
        theme_color: insertData.theme_color
    };
}

export async function updateSettings(settingsData: Partial<RestaurantSettings>) {
    if (!supabaseAdmin) throw new Error('Supabase admin client not initialized.');
    const { data, error } = await supabaseAdmin
        .from('restaurant_settings')
        .update(settingsData)
        .eq('id', 1)
        .select();

    if (error) {
        console.error('Error updating settings:', error);
        throw new Error(`Error updating settings: ${error.message}`);
    }
    revalidatePath('/settings');
    return data;
}


export async function signInWithEmail(formData: FormData) {
    if (!isSupabaseConfigured()) {
        redirect('/login?message=Supabase is not configured on the server.');
        return;
    }
    const supabase = createSupabaseServerClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: { message: 'Email and password are required' } };
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Sign in error:', error);
        redirect(`/login?message=${error.message}`);
    }

    revalidatePath('/', 'layout');
    redirect('/');
}

export async function signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect('/login');
}
