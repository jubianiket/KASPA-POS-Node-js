'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Trash2, X, CheckCircle, Clock } from 'lucide-react';
import { type MenuItem, type Order, menuCategories } from '@/lib/data';
import { getMenuItems, createOrder, getOrders, updateOrderStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { Bill } from '@/components/pos/bill';

interface OrderItem extends MenuItem {
  quantity: number;
}

const statusColors: Record<Order['status'], string> = {
  received: 'bg-blue-500',
  preparing: 'bg-yellow-500',
  ready: 'bg-green-500',
  completed: 'bg-gray-500',
};


export default function PosPage() {
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [currentOrder, setCurrentOrder] = React.useState<Order | null>(null);
  const [orderType, setOrderType] = React.useState('dine-in');
  const [selectedTable, setSelectedTable] = React.useState('1');
  const [isBillVisible, setIsBillVisible] = React.useState(false);
  const { toast } = useToast();

  const fetchActiveOrder = async () => {
    const allOrders = await getOrders();
    // In a real multi-user environment, you'd scope this to the current cashier/terminal
    const lastActiveOrder = allOrders.find(o => o.status !== 'completed');
    if (lastActiveOrder) {
      setCurrentOrder(lastActiveOrder);
    }
  };

  React.useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const items = await getMenuItems();
      setMenuItems(items);
      // Not fetching active order initially to start with a clean slate.
      // await fetchActiveOrder();
      setLoading(false);
    };
    fetchInitialData();

    const channel = supabase
      .channel('pos-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('POS Change received!', payload);
          if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as any;
             const formattedOrder: Order = {
              id: updatedOrder.id,
              orderNumber: updatedOrder.id,
              type: updatedOrder.order_type,
              table: updatedOrder.table_number,
              items: updatedOrder.items,
              timestamp: updatedOrder.date,
              status: updatedOrder.status,
            };

            setCurrentOrder(prevOrder => {
              if (prevOrder && prevOrder.id === formattedOrder.id) {
                 if (prevOrder.status !== 'completed' && formattedOrder.status === 'completed') {
                   toast({
                    title: `Order #${formattedOrder.orderNumber} Ready for Billing`,
                    description: 'You can now generate the bill or add more items.',
                  });
                }
                return formattedOrder;
              }
              return prevOrder;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const orderItems = currentOrder?.items.map(orderItem => {
    const menuItem = menuItems.find(mi => mi.name === orderItem.name);
    return {
        ...orderItem,
        imageUrl: menuItem?.imageUrl || 'https://placehold.co/600x400.png',
        aiHint: menuItem?.aiHint || '',
        price: menuItem?.price || 0,
        id: menuItem?.id || 0,
        category: menuItem?.category || 'N/A'
    };
  }) || [];


  const filteredItems = React.useMemo(() => {
    const itemsWithPrice = menuItems.filter(item => typeof item.price === 'number');
    if (activeCategory === 'All') return itemsWithPrice;
    return itemsWithPrice.filter((item) => item.category === activeCategory);
  }, [activeCategory, menuItems]);

 const handleAddToOrder = (item: MenuItem) => {
    const isOrderSent = currentOrder && currentOrder.id && !String(currentOrder.id).startsWith('temp-');
    if (currentOrder && isOrderSent && currentOrder.status !== 'received' && currentOrder.status !== 'completed') return;
    
    setCurrentOrder((prevOrder) => {
       const newItems = prevOrder ? [...prevOrder.items] : [];
       const existingItemIndex = newItems.findIndex(i => i.name === item.name);

       if (existingItemIndex > -1) {
           newItems[existingItemIndex].quantity += 1;
       } else {
           newItems.push({ name: item.name, quantity: 1, price: item.price });
       }
       
       const orderStatus = prevOrder?.status === 'completed' ? 'received' : prevOrder?.status || 'received';

       if (prevOrder) {
           return { ...prevOrder, items: newItems, status: orderStatus };
       }
       return {
           id: `temp-${Date.now()}`,
           orderNumber: 0,
           items: newItems,
           status: 'received',
           timestamp: new Date().toISOString(),
           type: 'dine-in',
       }
    });
  };

  const handleQuantityChange = (itemName: string, newQuantity: number) => {
     const isOrderSent = currentOrder && currentOrder.id && !String(currentOrder.id).startsWith('temp-');
     if (!currentOrder || (isOrderSent && currentOrder.status !== 'received' && currentOrder.status !== 'completed')) return;
    
    setCurrentOrder(prevOrder => {
        if (!prevOrder) return null;
        
        let updatedItems;
        if (newQuantity <= 0) {
            updatedItems = prevOrder.items.filter(item => item.name !== itemName);
        } else {
            updatedItems = prevOrder.items.map(item =>
                item.name === itemName ? { ...item, quantity: newQuantity } : item
            );
        }

        if (updatedItems.length === 0) {
            return null; 
        }

        return { ...prevOrder, items: updatedItems };
    });
  };
  
  const handleClearOrder = () => {
    setCurrentOrder(null);
  };

  const orderTotal = React.useMemo(() => {
    return orderItems.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  }, [orderItems]);
  
  const tax = orderTotal * 0.05;
  const totalWithTax = orderTotal + tax;

  const handleSendToKitchen = async () => {
    if (!currentOrder || currentOrder.items.length === 0) {
      toast({ variant: "destructive", title: "Empty Order", description: "Please add items to the order before sending." });
      return;
    }
    
    const orderData = {
      items: currentOrder.items.map(item => ({ name: item.name, quantity: item.quantity, price: menuItems.find(mi => mi.name === item.name)?.price || 0 })),
      table_number: orderType === 'dine-in' ? parseInt(selectedTable, 10) : null,
      order_type: orderType,
      sub_total: orderTotal,
      gst: tax,
      total: totalWithTax,
      status: 'received',
    };

    try {
      const isNewOrder = String(currentOrder.id).startsWith('temp-');
      const result = isNewOrder
        ? await createOrder(orderData)
        : await updateOrderStatus(currentOrder.id, 'received', orderData);

      if (result && result.length > 0) {
          const newOrder = result[0];
          const formattedOrder: Order = {
            id: newOrder.id,
            orderNumber: newOrder.id,
            type: newOrder.order_type,
            table: newOrder.table_number,
            items: newOrder.items,
            timestamp: newOrder.date,
            status: newOrder.status,
          };
          setCurrentOrder(formattedOrder);
          toast({ title: "Order Sent", description: "The order has been successfully sent to the kitchen." });
      } else {
        throw new Error("No data returned from the server.");
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Failed to Send Order", description: "There was a problem sending the order. Please try again." });
    }
  };

  const handleAddMoreItems = () => {
    if (!currentOrder) return;
    setCurrentOrder({ ...currentOrder, status: 'received' });
     toast({ title: "Order Unlocked", description: "You can now add more items." });
  };
  
  const handleBillClosed = () => {
    setIsBillVisible(false);
    // The order is no longer cleared when the bill is closed.
    // It will persist until manually cleared or a new order is made.
  };

  const tableNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  const isOrderSent = currentOrder && currentOrder.id && !String(currentOrder.id).startsWith('temp-');
  const canEditOrder = !isOrderSent || currentOrder?.status === 'received' || currentOrder?.status === 'completed';

  return (
    <div className="flex h-[calc(100vh-1rem)] flex-col lg:flex-row">
      {isBillVisible && currentOrder && (
          <Bill order={currentOrder} orderItems={orderItems} total={totalWithTax} tax={tax} subtotal={orderTotal} onBillClose={handleBillClosed} />
      )}
      <div className="flex-1 p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Point of Sale</h1>
            <p className="text-muted-foreground">Select items to build an order.</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={orderType} onValueChange={setOrderType} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="dine-in">Dine In</TabsTrigger>
                <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
                <TabsTrigger value="delivery">Delivery</TabsTrigger>
              </TabsList>
            </Tabs>
            {orderType === 'dine-in' && (
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Table" />
                </SelectTrigger>
                <SelectContent>
                  {tableNumbers.map(table => (
                    <SelectItem key={table} value={String(table)}>Table {table}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCategory === 'All' ? 'default' : 'outline'}
            onClick={() => setActiveCategory('All')}
            className="rounded-full"
          >
            All
          </Button>
          {menuCategories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              onClick={() => setActiveCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden flex flex-col">
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-4 flex-grow space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Skeleton className="h-6 w-1/4" />
                </CardFooter>
              </Card>
            ))
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden flex flex-col group cursor-pointer" onClick={() => handleAddToOrder(item)}>
                <CardHeader className="p-0">
                  <div className="relative h-40 w-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={item.aiHint}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <h3 className="text-lg font-semibold font-headline">{item.name}</h3>
                  <p className="text-muted-foreground text-sm">{item.category}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center p-4 pt-0">
                   <p className="text-lg font-bold text-primary">₹{item.price ? item.price.toFixed(2) : 'N/A'}</p>
                  <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-4 w-4 mr-2"/> Add
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <aside className="w-full lg:w-[380px] bg-card border-l flex flex-col">
        <div className="p-4 lg:p-6 flex justify-between items-center border-b">
          <h2 className="text-2xl font-headline font-bold">Current Order</h2>
          <Button variant="ghost" size="icon" onClick={handleClearOrder} aria-label="Clear Order" disabled={isOrderSent && currentOrder?.status !== 'completed'}>
            <X className="h-5 w-5"/>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {!currentOrder || currentOrder.items.length === 0 ? (
            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
              <p>No items in order.</p>
            </div>
          ) : (
            orderItems.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded-md object-cover" data-ai-hint={item.aiHint} />
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-primary">₹{item.price ? item.price.toFixed(2) : 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button disabled={!canEditOrder} variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.name, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                   <Button disabled={!canEditOrder} variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.name, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
                <p className="font-bold w-16 text-right">₹{((item.price || 0) * item.quantity).toFixed(2)}</p>
                <Button disabled={!canEditOrder} variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" onClick={() => handleQuantityChange(item.name, 0)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))
          )}
        </div>
        
        {currentOrder && currentOrder.items.length > 0 && (
          <div className="p-4 lg:p-6 border-t bg-card space-y-4">
             {isOrderSent && currentOrder.status !== 'completed' && (
              <div className="flex items-center justify-center font-semibold p-3 bg-blue-100 dark:bg-blue-900/50 rounded-md">
                 <Badge className={`${statusColors[currentOrder.status]} text-white`}>
                    Status: {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                 </Badge>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>₹{orderTotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Tax (5%)</p>
                <p>₹{tax.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Discount</p>
                <p>-₹0.00</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-xl font-bold font-headline">
              <p>Total</p>
              <p>₹{totalWithTax.toFixed(2)}</p>
            </div>
             {(!isOrderSent || currentOrder.status === 'received') && (
              <div className="grid grid-cols-2 gap-4">
                <Button size="lg" variant="outline">Charge</Button>
                <Button size="lg" onClick={handleSendToKitchen}>Send to Kitchen</Button>
              </div>
            )}
            {isOrderSent && currentOrder.status !== 'received' && currentOrder.status !== 'completed' && (
               <Button size="lg" disabled className="w-full">
                 <Clock className="mr-2 h-4 w-4" />
                 Order in Progress...
                </Button>
            )}
             {isOrderSent && currentOrder.status === 'completed' && (
               <div className="grid grid-cols-2 gap-4">
                <Button size="lg" variant="secondary" onClick={() => setIsBillVisible(true)}>Generate Bill</Button>
                <Button size="lg" onClick={handleAddMoreItems}>Add More Items</Button>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
