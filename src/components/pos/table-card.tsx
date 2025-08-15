
'use client';

import * as React from 'react';
import type { Order } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface TableCardProps {
  tableNumber: number;
  order?: Order;
  onViewOrder: (order: Order) => void;
  onGenerateBill: (order: Order) => void;
}

const statusStyles: Record<Order['status'], { border: string; bg: string; text: string }> = {
  received: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  preparing: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400' },
  ready: { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
  completed: { border: 'border-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400' },
};

export function TableCard({ tableNumber, order, onViewOrder, onGenerateBill }: TableCardProps) {
  const [time, setTime] = React.useState('');

  React.useEffect(() => {
    if (!order?.timestamp) return;
    const update = () => setTime(formatDistanceToNow(new Date(order.timestamp), { addSuffix: true }));
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, [order?.timestamp]);

  const statusStyle = order ? statusStyles[order.status] : null;

  return (
    <Card className={cn(
      "flex flex-col justify-between",
      order ? `${statusStyle?.border} border-t-4` : 'border-dashed'
    )}>
      <CardHeader>
        <CardTitle className={cn(
          "flex justify-between items-center font-headline",
           order ? statusStyle?.text : 'text-muted-foreground'
        )}>
          <span>Table {tableNumber}</span>
          {order && <Badge variant="outline">{order.status}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {order ? (
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">Order #{order.orderNumber}</p>
            <p className="font-semibold">Rs.{order.total?.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{time}</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-lg">Free</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {order && (
          <>
            <Button
              className="w-full"
              variant={order.status === 'ready' ? 'default' : 'outline'}
              onClick={() => onViewOrder(order)}
            >
              {order.status === 'ready' ? 'Add Items' : 'View Order'}
            </Button>
            {order.status === 'ready' && (
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => onGenerateBill(order)}
              >
                Generate Bill
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
