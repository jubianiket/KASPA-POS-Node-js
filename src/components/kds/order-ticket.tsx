
'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/lib/data';
import { Button } from '../ui/button';
import { UtensilsCrossed, Check } from 'lucide-react';
import { Separator } from '../ui/separator';
import { formatDistanceToNow } from 'date-fns';

type OrderStatus = Order['status'];

const statusColors: Record<NonNullable<OrderStatus>, string> = {
  received: 'bg-blue-500',
  preparing: 'bg-yellow-500',
  ready: 'bg-green-500',
  completed: 'bg-gray-500',
};

const statusBorderColors: Record<NonNullable<OrderStatus>, string> = {
  received: 'border-blue-500',
  preparing: 'border-yellow-500',
  ready: 'border-green-500',
  completed: 'border-gray-500',
};

export function OrderTicket({ order, onStatusUpdate }: { order: Order; onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void; }) {
  const [time, setTime] = React.useState('');

  React.useEffect(() => {
    if (!order.timestamp) return;
    const update = () => setTime(formatDistanceToNow(new Date(order.timestamp), { addSuffix: true }));
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, [order.timestamp]);
  
  const handleStatusChange = (newStatus: OrderStatus) => {
    onStatusUpdate(order.id, newStatus);
  };

  const getAction = () => {
    switch (order.status) {
      case 'received':
        return (
          <Button className="w-full" onClick={() => handleStatusChange('preparing')}>
            <UtensilsCrossed className="mr-2 h-4 w-4" /> Start Preparing
          </Button>
        );
      case 'preparing':
        return (
          <Button className="w-full" variant="secondary" onClick={() => handleStatusChange('ready')}>
            <Check className="mr-2 h-4 w-4" /> Mark as Ready
          </Button>
        );
      case 'ready':
         return (
          <Button className="w-full" variant="default" disabled>
            <Check className="mr-2 h-4 w-4" /> Ready for Pickup
          </Button>
        );
      case 'completed':
        return (
          <Button className="w-full" disabled variant="ghost" >
            Completed
          </Button>
        );
      default:
        return null;
    }
  };
  
  const statusText = order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown';

  return (
    <Card className={`flex flex-col border-t-4 ${order.status ? statusBorderColors[order.status] : 'border-gray-500'}`}>
      <CardHeader className="flex flex-row justify-between items-start pb-2">
        <div>
          <CardTitle className="font-headline text-2xl">
            {order.type === 'dine-in' ? `Table ${order.table}` : order.type}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
        </div>
        <Badge className={order.status ? statusColors[order.status] : 'bg-gray-500'}>{statusText}</Badge>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p className="text-sm text-muted-foreground">{time}</p>
        <Separator />
        <ul className="space-y-2">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between items-start">
              <div>
                <span className="font-semibold">{item.quantity}x {item.name} {item.portion && `(${item.portion})`}</span>
                {item.notes && <p className="text-sm text-accent pl-4">&quot;{item.notes}&quot;</p>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {getAction()}
      </CardFooter>
    </Card>
  );
}
