
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
    .select('id, name, rate, category, portion');

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
    items: order.items,
    timestamp: order.date,
    status: order.status,
    subtotal: order.sub_total,
    tax: order.gst,
    total: order.total
  }));
}

export async function updateOrderStatus(orderId: string, status: Order['status'], orderData?: any) {
  const updatePayload = orderData ? { ...orderData, status } : { status };
  
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
