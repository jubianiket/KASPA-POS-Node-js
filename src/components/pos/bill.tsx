
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Order } from '@/lib/data';
import { X, Printer } from 'lucide-react';

interface BillProps {
  order: Order;
  orderItems: { name: string; quantity: number; price: number, id: number; category: string; portion?: string }[];
  subtotal: number;
  tax: number;
  total: number;
  onBillClose: () => void;
}

export function Bill({ order, orderItems, subtotal, tax, total, onBillClose }: BillProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={true} onOpenChange={onBillClose}>
      <DialogContent className="max-w-sm p-0 print:shadow-none print:border-none">
        <DialogHeader className="p-6 pb-0 print:hidden">
            <DialogTitle className="font-headline text-2xl text-center">Order Bill</DialogTitle>
            <DialogDescription className="text-center">A summary of the customer's order.</DialogDescription>
        </DialogHeader>
        <div id="bill-content" className="p-6 font-mono text-sm text-black bg-white">
          <header className="text-center mb-4">
            <h2 className="text-lg font-bold font-headline">KASPA POS</h2>
            <p>123 Culinary Lane, Foodie City</p>
            <p>Tel: (123) 456-7890</p>
            <Separator className="my-2 bg-black" />
            <p>Order #{order.orderNumber}</p>
            <p>{new Date(order.timestamp).toLocaleString()}</p>
            {order.type === 'dine-in' ? (
              <p>Table: {order.table}, Seat: {order.seat}</p>
            ) : (
              <div className="text-left mt-2">
                <p className="font-bold">Delivery To:</p>
                <p>{order.address}</p>
                <p>Phone: {order.phone_no}</p>
              </div>
            )}
          </header>

          <Separator className="my-2 border-dashed bg-black" />

          <main>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 mb-2">
              <span className="font-bold">Item</span>
              <span className="font-bold text-right">Qty</span>
              <span className="font-bold text-right">Price</span>
            </div>
            {orderItems.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-x-2">
                <span>{item.name} {item.portion && `(${item.portion})`}</span>
                <span className="text-right">{item.quantity}</span>
                <span className="text-right">Rs.{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </main>

          <Separator className="my-2 border-dashed bg-black" />

          <footer className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs.{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%):</span>
              <span>Rs.{tax.toFixed(2)}</span>
            </div>
             <Separator className="my-1 bg-black" />
            <div className="flex justify-between font-bold text-base">
              <span>Total:</span>
              <span>Rs.{total.toFixed(2)}</span>
            </div>
             <Separator className="my-2 bg-black" />
            <p className="text-center">Thank you for your visit!</p>
          </footer>
        </div>
        <DialogFooter className="p-4 border-t print:hidden">
            <Button variant="outline" onClick={onBillClose}>
                <X className="mr-2 h-4 w-4" /> Close
            </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Bill
          </Button>
        </DialogFooter>
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #bill-content, #bill-content * {
              visibility: visible;
            }
            #bill-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
