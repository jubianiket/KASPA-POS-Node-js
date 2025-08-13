'use client';

import * as React from 'react';
import { OrderTicket } from '@/components/kds/order-ticket';
import { getOrders, updateOrderStatus } from '@/lib/actions';
import type { Order } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function KdsPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  // Using a ref to hold the channel so it's stable across re-renders.
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);

  React.useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const initialOrders = await getOrders();
      setOrders(initialOrders);
      setLoading(false);
    };

    fetchOrders();
    
    // Ensure we only have one subscription active.
    if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel('kds-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Change received!', payload);
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as any;
             const formattedOrder: Order = {
              id: newOrder.id,
              orderNumber: newOrder.id,
              type: newOrder.order_type,
              table: newOrder.table_number,
              items: newOrder.items,
              timestamp: newOrder.date,
              status: newOrder.status,
            };
            setOrders((prevOrders) => [formattedOrder, ...prevOrders]);
          } else if (payload.eventType === 'UPDATE') {
             setOrders((prevOrders) =>
              prevOrders.map((order) =>
                order.id === payload.new.id
                  ? { ...order, status: payload.new.status }
                  : order
              )
            );
          }
        }
      )
      .subscribe();

    const channel = channelRef.current;
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        channelRef.current = null;
      }
    };
  }, [toast]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
     try {
      await updateOrderStatus(orderId, newStatus);
      // The realtime subscription will handle the UI update
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the order status.",
      });
    }
  };


  return (
    <div className="p-4 lg:p-6 h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Kitchen Display System</h1>
        <p className="text-muted-foreground">Real-time order tracking for the kitchen staff.</p>
      </header>
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {orders.filter(o => o.status !== 'completed').map((order) => (
            <OrderTicket key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
