
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Trash2, X, Search, Phone, Home, ShoppingBag, History, Table as TableIcon } from 'lucide-react';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { format } from 'date-fns';
import { TableCard } from '@/components/pos/table-card';

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
  const [orderType, setOrderType] = React.useState<'dine-in' | 'delivery' | 'active-orders' | 'table-view'>('dine-in');
  const [selectedTable, setSelectedTable] = React.useState('');
  const [selectedSeat, setSelectedSeat] = React.useState('');
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [deliveryPhone, setDeliveryPhone] = React.useState('');
  const [isBillVisible, setIsBillVisible] = React.useState(false);
  const { toast } = useToast();
  const prevOrderStatus = React.useRef<Order['status'] | undefined>();
  const [billOrder, setBillOrder] = React.useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [allOrders, setAllOrders] = React.useState<Order[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isOrderSheetOpen, setIsOrderSheetOpen] = React.useState(false);

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'active-orders') {
      setOrderType('active-orders');
    } else if (tab === 'table-view') {
        setOrderType('table-view');
    }
  }, [searchParams]);

  const activeOrders = React.useMemo(() => {
    return allOrders.filter(o => o.status !== 'completed');
  }, [allOrders]);
  
  const completedOrders = React.useMemo(() => {
    return allOrders.filter(o => o.status === 'completed');
  }, [allOrders]);

  const occupiedTableSeats = React.useMemo(() => {
    return activeOrders
      .filter(order => order.type === 'dine-in' && order.table && order.seat && order.status !== 'completed')
      .map(order => `${order.table}-${order.seat}`);
  }, [activeOrders]);

  const tableOrderHistory = React.useMemo(() => {
    if (!selectedTable) return [];
    return completedOrders
      .filter(order => order.type === 'dine-in' && String(order.table) === selectedTable)
      .slice(0, 5); // Get last 5 completed orders for the table
  }, [completedOrders, selectedTable]);
  
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
      const [items, fetchedOrders] = await Promise.all([
          getMenuItems(),
          getOrders(),
      ]);
      setMenuItems(items);
      setAllOrders(fetchedOrders);
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
            getOrders().then(fetchedOrders => {
              setAllOrders(fetchedOrders);
              
              if (currentOrder && payload.eventType === 'UPDATE' && payload.new.id === currentOrder.id) {
                 const updatedOrder = payload.new as any;
                 const formattedOrder: Order = {
                    id: updatedOrder.id,
                    orderNumber: updatedOrder.id,
                    type: updatedOrder.order_type,
                    table: updatedOrder.table_number,
                    seat: updatedOrder.seat_number,
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
    if (isOrderSent && currentOrder.status !== 'received' && currentOrder.status !== 'ready' && currentOrder.status !== 'completed') return;
    
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
           seat: orderType === 'dine-in' ? parseInt(selectedSeat, 10) : undefined,
       }
    });
    if (isMobile) {
      setIsOrderSheetOpen(true);
    }
  };

  const handleQuantityChange = (itemName: string, newQuantity: number) => {
     const isOrderSent = currentOrder && currentOrder.id && !String(currentOrder.id).startsWith('temp-');
     if (!isOrderSent && currentOrder?.status !== 'received' && currentOrder?.status !== 'ready' && currentOrder?.status !== 'completed') return;
    
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
            handleClearOrder();
            return null;
        }

        return { ...prevOrder, items: updatedItems };
    });
  };
  
  const handleClearOrder = () => {
    setCurrentOrder(null);
    if(orderType === 'dine-in') {
      setSelectedTable('');
      setSelectedSeat('');
    }
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
    
    if (orderType === 'dine-in' && (!selectedTable || !selectedSeat)) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a table and seat for dine-in orders." });
      return;
    }
    
    const orderData: any = {
      items: currentOrder.items.map(item => ({ name: item.name, quantity: item.quantity, price: menuItems.find(mi => mi.name === item.name)?.price || 0, portion: item.portion })),
      order_type: currentOrder.type,
      sub_total: orderTotal,
      gst: tax,
      total: totalWithTax,
      status: 'received',
    };
    
    if (currentOrder.type === 'dine-in') {
      orderData.table_number = currentOrder.table;
      orderData.seat_number = currentOrder.seat;
    } else {
      orderData.phone_no = currentOrder.phone_no;
      orderData.address = currentOrder.address;
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
            seat: newOrder.seat_number,
            items: newOrder.items,
            timestamp: newOrder.date,
            status: newOrder.status,
            phone_no: newOrder.phone_no,
            address: newOrder.address,
          };
          setCurrentOrder(formattedOrder);
          
          const allOrders = await getOrders();
          setAllOrders(allOrders);
          
          if (orderType === 'delivery') {
            setDeliveryAddress('');
            setDeliveryPhone('');
          }

          toast({ title: "Order Sent", description: "The order has been successfully sent to the kitchen." });
          if(isMobile) setIsOrderSheetOpen(false);
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

  const handleGenerateBill = async (orderToBill: Order) => {
    if (orderToBill) {
      try {
        await updateOrderStatus(orderToBill.id, 'completed');
        
        // Fetch fresh orders to update the entire state
        const updatedOrders = await getOrders();
        setAllOrders(updatedOrders);

        // Set the bill for display and clear the current order if it was the one being billed
        setBillOrder({ ...orderToBill, status: 'completed' }); 
        setIsBillVisible(true);
        
        if (currentOrder && currentOrder.id === orderToBill.id) {
          handleClearOrder();
        }

        if(isMobile) setIsOrderSheetOpen(false);
      } catch (error) {
         toast({ variant: "destructive", title: "Failed to Generate Bill", description: "Could not update the order status. Please try again." });
      }
    }
  }

  const tableNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  const seatNumbers = Array.from({ length: 5 }, (_, i) => i + 1);
  const isOrderSent = currentOrder && currentOrder.id && !String(currentOrder.id).startsWith('temp-');

  const billSubtotal = billOrderItems.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  const billTax = billSubtotal * 0.05;
  const billTotal = billSubtotal + billTax;
  
  const handleNewOrder = () => {
    handleClearOrder();
    setOrderType('dine-in');
  }
  
  const handleViewTableOrder = (order: Order) => {
    setCurrentOrder(order);
    setSelectedTable(String(order.table));
    setSelectedSeat(String(order.seat));
    setOrderType('dine-in');
    
    // Update URL without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'dine-in');
    router.replace(url.toString(), { scroll: false });
  };

  const CurrentOrderContent = () => (
     <div className="flex flex-col h-full bg-card">
        <header className="p-4 lg:p-6 flex justify-between items-center border-b">
          <h2 className="text-2xl font-headline font-bold">Current Order</h2>
          {currentOrder && (
            <Button variant="ghost" size="icon" onClick={handleClearOrder} aria-label="Clear Order">
              <X className="h-5 w-5"/>
            </Button>
          )}
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {!currentOrder || currentOrder.items.length === 0 ? (
            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
              <p>No items in order.</p>
            </div>
          ) : (
            orderItems.map((item) => (
              <div key={item.name} className="flex items-center gap-2 sm:gap-4">
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-primary">Rs.{item.price ? item.price.toFixed(2) : 'N/A'}</p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.name, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                   <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.name, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
                <p className="font-bold w-14 sm:w-16 text-right">Rs.{((item.price || 0) * item.quantity).toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" onClick={() => handleQuantityChange(item.name, 0)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))
          )}
        </div>
        
        {currentOrder && currentOrder.items.length > 0 && (
          <footer className="p-4 lg:p-6 border-t bg-card space-y-4">
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
              <Button size="lg" variant="secondary" onClick={() => currentOrder && handleGenerateBill(currentOrder)} disabled={!currentOrder || !currentOrder.status || currentOrder.status !== 'ready'}>Generate Bill</Button>
              <Button size="lg" onClick={handleSendToKitchen}>{isOrderSent ? 'Add More Items' : 'Send to Kitchen'}</Button>
            </div>
          </footer>
        )}
     </div>
  );

  return (
    <div className="h-screen bg-background lg:grid lg:grid-cols-[1fr_380px]">
      {isBillVisible && billOrder && (
          <Bill order={billOrder} orderItems={billOrderItems} total={billTotal} tax={billTax} subtotal={billSubtotal} onBillClose={handleBillClosed} />
      )}
      <main className="flex flex-col h-full">
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 flex-1 flex flex-col">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden" />
                <div>
                  <h1 className="text-3xl font-headline font-bold">Point of Sale</h1>
                  <p className="text-muted-foreground">Select items to build an order.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Button onClick={handleNewOrder}>New Order</Button>
                <Tabs value={orderType} onValueChange={(v) => {
                  const newOrderType = v as 'dine-in' | 'delivery' | 'active-orders' | 'table-view';
                  setOrderType(newOrderType);
                  if (newOrderType === 'dine-in' || newOrderType === 'delivery') {
                    handleClearOrder();
                  }
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', newOrderType);
                  router.replace(url.toString(), { scroll: false });
                }} className="w-full sm:w-auto">
                  <TabsList>
                    <TabsTrigger value="dine-in">Dine In</TabsTrigger>
                    <TabsTrigger value="table-view">Table View</TabsTrigger>
                    <TabsTrigger value="delivery">Delivery</TabsTrigger>
                    <TabsTrigger value="active-orders">Active Orders</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </header>

            {orderType === 'dine-in' && (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>Table:</Label>
                      <Select value={selectedTable} onValueChange={(val) => {setSelectedTable(val); setSelectedSeat('')}} disabled={!!currentOrder}>
                      <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                          {tableNumbers.map(table => (
                          <SelectItem key={table} value={String(table)}>
                              Table {table}
                          </SelectItem>
                          ))}
                      </SelectContent>
                      </Select>
                    </div>
                    {selectedTable && (
                      <div className="flex items-center gap-2">
                        <Label>Seat:</Label>
                        <Select value={selectedSeat} onValueChange={setSelectedSeat} disabled={!!currentOrder}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {seatNumbers.map(seat => (
                              <SelectItem 
                                key={seat} 
                                value={String(seat)}
                                disabled={occupiedTableSeats.includes(`${selectedTable}-${seat}`)}
                              >
                                Seat {seat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                </div>

                {selectedTable && tableOrderHistory.length > 0 && (
                   <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-headline flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Order History for Table {selectedTable}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <Accordion type="single" collapsible className="w-full">
                            {tableOrderHistory.map(order => (
                              <AccordionItem value={`order-${order.id}`} key={order.id}>
                                <AccordionTrigger>
                                  <div className="flex justify-between w-full pr-4">
                                    <span>Order #{order.orderNumber} - {format(new Date(order.timestamp), 'dd/MM/yyyy, hh:mm a')}</span>
                                    <span className="font-semibold">Rs.{order.total?.toFixed(2)}</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                   <ul className="pl-4 space-y-1 text-muted-foreground">
                                    {order.items.map((item, index) => (
                                      <li key={index}>
                                        {item.quantity}x {item.name} {item.portion && `(${item.portion})`}
                                      </li>
                                    ))}
                                   </ul>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                      </CardContent>
                   </Card>
                )}
              </>
            )}
            
            {orderType === 'active-orders' && (
                <Card>
                    <CardContent className="pt-6 max-h-96 overflow-y-auto">
                       {activeOrders.length > 0 ? (
                        <div className="space-y-2">
                            {activeOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between p-2 border rounded-md">
                                    <div>
                                        {order.type === 'dine-in' ? (
                                          <>
                                            <p className="font-semibold">Table {order.table}, Seat {order.seat}</p>
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
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${statusColors[order.status]} text-white`}>
                                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                      </Badge>
                                      <Button size="sm" onClick={() => setCurrentOrder(order)}>View Order</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                       ) : (
                        <p className="text-muted-foreground text-center">No active orders.</p>
                       )}
                    </CardContent>
                </Card>
            )}

             {orderType === 'table-view' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {tableNumbers.map(tableNumber => {
                    const tableOrder = activeOrders.find(o => o.type === 'dine-in' && o.table === tableNumber);
                    return (
                      <TableCard 
                        key={tableNumber}
                        tableNumber={tableNumber}
                        order={tableOrder}
                        onViewOrder={handleViewTableOrder}
                        onGenerateBill={handleGenerateBill}
                      />
                    );
                  })}
                </div>
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

            {(orderType === 'dine-in' || orderType === 'delivery') && (
              <>
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
                            <TableHead className="hidden sm:table-cell">Portion</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item) => (
                            <TableRow key={item.id} onClick={() => handleAddToOrder(item)} className="cursor-pointer">
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="hidden sm:table-cell">{item.portion || 'Regular'}</TableCell>
                              <TableCell className="text-right font-semibold text-primary">Rs.{item.price ? item.price.toFixed(2) : 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                  )}
                </div>
              </>
            )}
          </div>
          {isMobile && currentOrder && currentOrder.items.length > 0 && (
            <Sheet open={isOrderSheetOpen} onOpenChange={setIsOrderSheetOpen}>
              <SheetTrigger asChild>
                  <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-lg cursor-pointer lg:hidden">
                      <div className="flex items-center gap-3">
                        <ShoppingBag />
                        <span className="font-bold">{orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}</span>
                      </div>
                      <span className="text-xl font-bold">Rs.{totalWithTax.toFixed(2)}</span>
                  </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
                  <CurrentOrderContent />
              </SheetContent>
            </Sheet>
          )}
      </main>
      
      <aside className="w-full lg:w-[380px] bg-card border-l flex-col hidden lg:flex">
        <CurrentOrderContent />
      </aside>
      
    </div>
  );
}
