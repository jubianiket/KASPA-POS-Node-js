'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/lib/data';
import { Button } from '../ui/button';
import { UtensilsCrossed, Check } from 'lucide-react';
import { Separator } from '../ui/separator';
import { formatDistanceToNow } from 'date-fns';

type OrderStatus = 'New' | 'Preparing' | 'Ready';

const statusColors: Record<OrderStatus, string> = {
  New: 'bg-blue-500',
  Preparing: 'bg-yellow-500',
  Ready: 'bg-green-500',
};

const statusBorderColors: Record<OrderStatus, string> = {
    New: 'border-blue-500',
    Preparing: 'border-yellow-500',
    Ready: 'border-green-500',
};

export function OrderTicket({ order }: { order: Order }) {
  const [status, setStatus] = React.useState<OrderStatus>('New');
  const [time, setTime] = React.useState('');

  React.useEffect(() => {
    const update = () => setTime(formatDistanceToNow(new Date(order.timestamp), { addSuffix: true }));
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, [order.timestamp]);
  
  const handleStatusChange = () => {
    setStatus((prevStatus) => {
      if (prevStatus === 'New') return 'Preparing';
      if (prevStatus === 'Preparing') return 'Ready';
      return 'Ready';
    });
  };

  const getAction = () => {
    switch (status) {
      case 'New':
        return (
          <Button className="w-full" onClick={handleStatusChange}>
            <UtensilsCrossed className="mr-2 h-4 w-4" /> Start Preparing
          </Button>
        );
      case 'Preparing':
        return (
          <Button className="w-full" variant="secondary" onClick={handleStatusChange}>
            <Check className="mr-2 h-4 w-4" /> Mark as Ready
          </Button>
        );
      case 'Ready':
        return (
          <Button className="w-full" disabled variant="ghost" >
            Completed
          </Button>
        );
    }
  };

  return (
    <Card className={`flex flex-col border-t-4 ${statusBorderColors[status]}`}>
      <CardHeader className="flex flex-row justify-between items-start pb-2">
        <div>
          <CardTitle className="font-headline text-2xl">
            {order.type === 'Dine In' ? `Table ${order.table}` : order.type}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
        </div>
        <Badge className={statusColors[status]}>{status}</Badge>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p className="text-sm text-muted-foreground">{time}</p>
        <Separator />
        <ul className="space-y-2">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between items-start">
              <div>
                <span className="font-semibold">{item.quantity}x {item.name}</span>
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
