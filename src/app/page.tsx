'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Trash2, X } from 'lucide-react';
import { menuCategories, menuItems, type MenuItem } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface OrderItem extends MenuItem {
  quantity: number;
}

export default function PosPage() {
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [order, setOrder] = React.useState<OrderItem[]>([]);
  const { toast } = useToast();

  const filteredItems = React.useMemo(() => {
    if (activeCategory === 'All') return menuItems;
    return menuItems.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const handleAddToOrder = (item: MenuItem) => {
    setOrder((prevOrder) => {
      const existingItem = prevOrder.find((orderItem) => orderItem.id === item.id);
      if (existingItem) {
        return prevOrder.map((orderItem) =>
          orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
        );
      }
      return [...prevOrder, { ...item, quantity: 1 }];
    });
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrder((prevOrder) => prevOrder.filter((item) => item.id !== itemId));
    } else {
      setOrder((prevOrder) =>
        prevOrder.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
      );
    }
  };
  
  const handleClearOrder = () => {
    setOrder([]);
  };

  const orderTotal = React.useMemo(() => {
    return order.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [order]);
  
  const tax = orderTotal * 0.05; // Example 5% tax
  const totalWithTax = orderTotal + tax;

  const handleSendToKitchen = () => {
    if (order.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Order",
        description: "Please add items to the order before sending.",
      });
      return;
    }
    toast({
      title: "Order Sent",
      description: "The order has been successfully sent to the kitchen.",
    });
    handleClearOrder();
  };

  return (
    <div className="flex h-[calc(100vh-1rem)] flex-col lg:flex-row">
      <div className="flex-1 p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Point of Sale</h1>
            <p className="text-muted-foreground">Select items to build an order.</p>
          </div>
          <Tabs defaultValue="dine-in" className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="dine-in">Dine In</TabsTrigger>
              <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
            </TabsList>
          </Tabs>
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
          {filteredItems.map((item) => (
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
                <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
                <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-4 w-4 mr-2"/> Add
                </Button>
              </CardFooter>
            </Card>
          ))}
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
          {order.length === 0 ? (
            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
              <p>No items in order.</p>
            </div>
          ) : (
            order.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded-md object-cover" data-ai-hint={item.aiHint} />
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-primary">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                   <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
                <p className="font-bold w-16 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" onClick={() => handleQuantityChange(item.id, 0)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))
          )}
        </div>
        
        {order.length > 0 && (
          <div className="p-4 lg:p-6 border-t bg-card space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>${orderTotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Tax (5%)</p>
                <p>${tax.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Discount</p>
                <p>-$0.00</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-xl font-bold font-headline">
              <p>Total</p>
              <p>${totalWithTax.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button size="lg" variant="outline">Charge</Button>
              <Button size="lg" onClick={handleSendToKitchen}>Send to Kitchen</Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
