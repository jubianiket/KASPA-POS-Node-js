
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Trash2, X, Clock, Search, Phone, Home } from 'lucide-react';
import { type MenuItem, type Order, menuCategories } from '@/lib/data';
import { getMenuItems, createOrder, getOrders, updateOrderStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { Bill } from '@/components/pos/bill';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSearchParams, useRouter } from 'next/navigation';

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
  const [orderType, setOrderType] = React.useState<'dine-in' | 'delivery' | 'active-orders'>('dine-in');
  const [selectedTable, setSelectedTable] = React.useState('1');
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [deliveryPhone, setDeliveryPhone] = React.useState('');
  const [isBillVisible, setIsBillVisible] = React.useState(false);
  const { toast } = useToast();
  const prevOrderStatus = React.useRef<Order['status'] | undefined>();
  const [billOrder, setBillOrder] = React.useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeOrders, setActiveOrders] = React.useState<Order[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'active-orders') {
      setOrderType('active-orders');
    }
  }, [searchParams]);

  const occupiedTables = React.useMemo(() => {
    return activeOrders
      .filter(order => order.type === 'dine-in' && order.table && order.status !== 'completed')
      .map(order => order.table);
  }, [activeOrders]);

  const activeOrdersForList = React.useMemo(() => {
    return activeOrders.filter(order => order.status !== 'completed');
  }, [activeOrders]);
  
  React.useEffect(() => {
    if (currentOrder?.status === 'ready' && prevOrderStatus.current !== 'ready') {
       toast({
        title: `Order #${currentOrder.orderNumber} Ready`,
        description: 'The order is ready to be served or billed.',
      });
    }
    prevOrderStatus.current = currentOrder?.status;
  }, [currentOrder, toast]);


  React.useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const [items, allOrders] = await Promise.all([
          getMenuItems(),
          getOrders(),
      ]);
      setMenuItems(items);
      setActiveOrders(allOrders.filter(o => o.status !== 'completed'));
      setLoading(false);
    };
    fetchInitialData();

    const channel = supabase
      .channel('pos-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            getOrders().then(allOrders => {
              const currentActiveOrders = allOrders.filter(o => o.status !== 'completed');
              setActiveOrders(currentActiveOrders);
              
              if (currentOrder && payload.eventType === 'UPDATE' && payload.new.id === currentOrder.id) {
                 const updatedOrder = payload.new as any;
                 const formattedOrder: Order = {
                    id: updatedOrder.id,
                    orderNumber: updatedOrder.id,
                    type: updatedOrder.order_type,
                    table: updatedOrder.table_number,
                    items: updatedOrder.items,
                    timestamp: updatedOrder.date,
                    status: updatedOrder.status,
                    phone_no: updatedOrder.phone_no,
                    address: updatedOrder.address,
                 };
                 setCurrentOrder(formattedOrder);
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrder]);

  const orderItems = currentOrder?.items.map(orderItem => {
    const menuItem = menuItems.find(mi => mi.name === orderItem.name);
    return {
        ...orderItem,
        price: menuItem?.price || 0,
        id: menuItem?.id || 0,
        category: menuItem?.category || 'N/A'
    };
  }) || [];

  const billOrderItems = billOrder?.items.map(orderItem => {
    const menuItem = menuItems.find(mi => mi.name === orderItem.name);
    return {
        ...orderItem,
        price: menuItem?.price || 0,
        id: menuItem?.id || 0,
        category: menuItem?.category || 'N/A',
    };
  }) || [];


  const filteredItems = React.useMemo(() => {
    const itemsWithPrice = menuItems.filter(item => typeof item.price === 'number');
    let categoryFilteredItems = activeCategory === 'All'
        ? itemsWithPrice
        : itemsWithPrice.filter((item) => item.category === activeCategory);

    if (searchQuery) {
        return categoryFilteredItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    return categoryFilteredItems;
  }, [activeCategory, menuItems, searchQuery]);


 const handleAddToOrder = (item: MenuItem) => {
    const isOrderSent = currentOrder && currentOrder.id && !String(currentOrder.id).startsWith('temp-');
    if (currentOrder && isOrderSent && currentOrder.status !== 'received' && currentOrder.status !== 'ready' && currentOrder.status !== 'completed') return;
    
    setCurrentOrder((prevOrder) => {
       const newItems = prevOrder ? [...prevOrder.items] : [];
       const existingItemIndex = newItems.findIndex(i => i.name === item.name);

       if (existingItemIndex > -1) {
           newItems[existingItemIndex].quantity += 1;
       } else {
           newItems.push({ name: item.name, quantity: 1, price: item.price, portion: item.portion });
       }
       
       const orderStatus = prevOrder?.status === 'ready' ? 'received' : prevOrder?.status || 'received';

       if (prevOrder) {
           return { ...prevOrder, items: newItems, status: orderStatus };
       }
       return {
           id: `temp-${Date.now()}`,
           orderNumber: 0,
           items: newItems,
           status: 'received',
           timestamp: new Date().toISOString(),
           type: orderType as 'dine-in' | 'delivery',
           address: orderType === 'delivery' ? deliveryAddress : undefined,
           phone_no: orderType === 'delivery' ? deliveryPhone : undefined,
           table: orderType === 'dine-in' ? parseInt(selectedTable, 10) : undefined,
       }
    });
  };

  const handleQuantityChange = (itemName: string, newQuantity: number) => {
     const isOrderSent = currentOrder && currentOrder.id && !String(currentOrder.id).startsWith('temp-');
     if (!currentOrder || (isOrderSent && currentOrder.status !== 'received' && currentOrder.status !== 'ready' && currentOrder.status !== 'completed')) return;
    
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

    if (orderType === 'delivery' && (!deliveryPhone || !deliveryAddress)) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter phone and address for delivery orders." });
      return;
    }
    
    const orderData: any = {
      items: currentOrder.items.map(item => ({ name: item.name, quantity: item.quantity, price: menuItems.find(mi => mi.name === item.name)?.price || 0, portion: item.portion })),
      order_type: orderType,
      sub_total: orderTotal,
      gst: tax,
      total: totalWithTax,
      status: 'received',
    };

    if (orderType === 'dine-in') {
      orderData.table_number = parseInt(selectedTable, 10);
    } else {
      orderData.phone_no = deliveryPhone;
      orderData.address = deliveryAddress;
    }

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
            phone_no: newOrder.phone_no,
            address: newOrder.address,
          };
          setCurrentOrder(formattedOrder);
          
          const allOrders = await getOrders();
          setActiveOrders(allOrders.filter(o => o.status !== 'completed'));
          
          if (orderType === 'delivery') {
            setDeliveryAddress('');
            setDeliveryPhone('');
          }

          toast({ title: "Order Sent", description: "The order has been successfully sent to the kitchen." });
      } else {
        throw new Error("No data returned from the server.");
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Failed to Send Order", description: "There was a problem sending the order. Please try again." });
    }
  };
  
  const handleBillClosed = () => {
    setIsBillVisible(false);
    setBillOrder(null);
  };

  const handleGenerateBill = async () => {
    if (currentOrder) {
      try {
        await updateOrderStatus(currentOrder.id, 'completed');
        setBillOrder({ ...currentOrder, status: 'completed' }); 
        setIsBillVisible(true);
        setActiveOrders(prev => prev.filter(o => o.id !== currentOrder.id));
        setCurrentOrder(null);
      } catch (error) {
         toast({ variant: "destructive", title: "Failed to Generate Bill", description: "Could not update the order status. Please try again." });
      }
    }
  }

  const tableNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  const isOrderSent = currentOrder && currentOrder.id && !String(currentOrder.id).startsWith('temp-');

  const billSubtotal = billOrderItems.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  const billTax = billSubtotal * 0.05;
  const billTotal = billSubtotal + billTax;


  return (
    <div className="flex h-[calc(100vh-1rem)] flex-col lg:flex-row">
      {isBillVisible && billOrder && (
          <Bill order={billOrder} orderItems={billOrderItems} total={billTotal} tax={billTax} subtotal={billSubtotal} onBillClose={handleBillClosed} />
      )}
      <div className="flex-1 p-4 lg:p-6 space-y-4 lg:space-y-6 flex flex-col overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Point of Sale</h1>
            <p className="text-muted-foreground">Select items to build an order.</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={orderType} onValueChange={(v) => {
              const newOrderType = v as 'dine-in' | 'delivery' | 'active-orders';
              setOrderType(newOrderType);
              if (newOrderType === 'dine-in' || newOrderType === 'delivery') {
                setCurrentOrder(null);
                if (newOrderType === 'delivery') {
                  setSelectedTable('');
                } else {
                  setDeliveryAddress('');
                  setDeliveryPhone('');
                }
              }
              const url = new URL(window.location.href);
              url.searchParams.set('tab', newOrderType);
              router.replace(url.toString(), { scroll: false });
            }} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="dine-in">Dine In</TabsTrigger>
                <TabsTrigger value="delivery">Delivery</TabsTrigger>
                <TabsTrigger value="active-orders">Active Orders</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        {orderType === 'dine-in' && (
            <div className="flex items-center gap-2">
                <Label>Select Table:</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable} disabled={!!currentOrder}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Table" />
                </SelectTrigger>
                <SelectContent>
                    {tableNumbers.map(table => (
                    <SelectItem key={table} value={String(table)} disabled={occupiedTables.includes(table)}>
                        Table {table}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
        )}
        
        {orderType === 'active-orders' && (
            <Card>
                <CardContent className="pt-6">
                   {activeOrdersForList.length > 0 ? (
                    <div className="space-y-2">
                        {activeOrdersForList.map(order => (
                            <div key={order.id} className="flex items-center justify-between p-2 border rounded-md">
                                <div>
                                    {order.type === 'dine-in' ? (
                                      <>
                                        <p className="font-semibold">Table {order.table}</p>
                                        <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="font-semibold flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-muted-foreground" /> {order.phone_no}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                           <Home className="h-4 w-4 text-muted-foreground" /> {order.address}
                                        </p>
                                      </>
                                    )}
                                </div>
                                <Button size="sm" onClick={() => setCurrentOrder(order)}>View Order</Button>
                            </div>
                        ))}
                    </div>
                   ) : (
                    <p className="text-muted-foreground text-center">No active orders.</p>
                   )}
                </CardContent>
            </Card>
        )}

        {orderType === 'delivery' && (
            <Card>
                <CardContent className="pt-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" placeholder="Enter phone number" value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} className="text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" placeholder="Enter delivery address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="text-sm" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for an item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
                variant={activeCategory === 'All' ? 'default' : 'outline'}
                onClick={() => setActiveCategory('All')}
                className="rounded-full flex-shrink-0"
            >
                All
            </Button>
            {menuCategories.map((category) => (
                <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                onClick={() => setActiveCategory(category)}
                className="rounded-full flex-shrink-0"
                >
                {category}
                </Button>
            ))}
            </div>
        </div>
        
        <div className="flex-grow overflow-auto border rounded-lg">
          {loading ? (
             <div className="p-4 space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-5 flex-grow" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                ))}
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Portion</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} onClick={() => handleAddToOrder(item)} className="cursor-pointer">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.portion || 'Regular'}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">Rs.{item.price ? item.price.toFixed(2) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </div>
      </div>
      
      <aside className="w-full lg:w-[380px] bg-card border-l flex flex-col">
        <div className="p-4 lg:p-6 flex justify-between items-center border-b">
          <h2 className="text-2xl font-headline font-bold">Current Order</h2>
          <Button variant="ghost" size="icon" onClick={handleClearOrder} aria-label="Clear Order">
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
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-primary">Rs.{item.price ? item.price.toFixed(2) : 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.name, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                   <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.name, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
                <p className="font-bold w-16 text-right">Rs.{((item.price || 0) * item.quantity).toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" onClick={() => handleQuantityChange(item.name, 0)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))
          )}
        </div>
        
        {currentOrder && currentOrder.items.length > 0 && (
          <div className="p-4 lg:p-6 border-t bg-card space-y-4">
             {isOrderSent && (
              <div className="flex items-center justify-center font-semibold p-3 bg-blue-100 dark:bg-blue-900/50 rounded-md">
                 <Badge className={`${statusColors[currentOrder.status]} text-white`}>
                    Status: {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                 </Badge>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>Rs.{orderTotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Tax (5%)</p>
                <p>Rs.{tax.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Discount</p>
                <p>-Rs.0.00</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-xl font-bold font-headline">
              <p>Total</p>
              <p>Rs.{totalWithTax.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button size="lg" variant="secondary" onClick={handleGenerateBill} disabled={currentOrder.status !== 'completed'}>Generate Bill</Button>
              <Button size="lg" onClick={handleSendToKitchen}>Add More Items</Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
