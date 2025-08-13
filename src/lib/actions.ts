
'use server';

import { MenuItem, Order } from './data';
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function getMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('id, name, rate, category, portion')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }

  return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.rate,
      category: item.category,
      portion: item.portion
  }));
}

export async function createMenuItem(itemData: Omit<MenuItem, 'id'>) {
    const { data, error } = await supabaseAdmin
        .from('menu_items')
        .insert([{ name: itemData.name, rate: itemData.price, category: itemData.category, portion: itemData.portion }])
        .select();

    if (error) {
        console.error('Error creating menu item:', error);
        throw new Error(`Error creating menu item: ${error.message}`);
    }
    return data;
}

export async function updateMenuItem(id: number, itemData: Omit<MenuItem, 'id'>) {
    const { data, error } = await supabaseAdmin
        .from('menu_items')
        .update({ name: itemData.name, rate: itemData.price, category: itemData.category, portion: itemData.portion })
        .eq('id', id)
        .select();
    
    if (error) {
        console.error(`Error updating menu item ${id}:`, error);
        throw new Error(`Error updating menu item: ${error.message}`);
    }
    return data;
}

export async function deleteMenuItem(id: number) {
    const { error } = await supabaseAdmin
        .from('menu_items')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Error deleting menu item ${id}:`, error);
        throw new Error(`Error deleting menu item: ${error.message}`);
    }
    return { success: true };
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

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

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
  const updatePayload: { [key: string]: any } = orderData ? { ...orderData } : {};
  updatePayload.status = status;

  // Ensure phone and address are correctly named for the database
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

  return data;
}
