import { OrderTicket } from '@/components/kds/order-ticket';
import { orders } from '@/lib/data';

export default function KdsPage() {
  return (
    <div className="p-4 lg:p-6 h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Kitchen Display System</h1>
        <p className="text-muted-foreground">Real-time order tracking for the kitchen staff.</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {orders.map((order) => (
          <OrderTicket key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
