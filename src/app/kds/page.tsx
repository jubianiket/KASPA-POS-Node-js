
'use client';

import * as React from 'react';
import { OrderTicket } from '@/components/kds/order-ticket';
import { getOrders, updateOrderStatus } from '@/lib/actions';
import type { Order } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layout/page-layout';

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
      setOrders(initialOrders.filter(o => o.status !== 'completed'));
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
          const fetchAndSetOrders = async () => {
            const allOrders = await getOrders();
            // In KDS, we don't show orders that are already completed by the kitchen.
            const activeKdsOrders = allOrders.filter(o => o.status !== 'completed');
            setOrders(activeKdsOrders);
          };
          fetchAndSetOrders();
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
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
     try {
      await updateOrderStatus(orderId, newStatus);
      // The realtime subscription will handle the UI update, but we can optimistically update here too.
      // This is for KDS only. If an order is marked 'completed' here, it just means kitchen is done.
      // It will disappear from KDS screen but remain in POS until bill is generated.
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the order status.",
      });
    }
  };


  return (
    <PageLayout
      title="Kitchen Display System"
      description="Real-time order tracking for the kitchen staff."
    >
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {orders.map((order) => (
            <OrderTicket key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
