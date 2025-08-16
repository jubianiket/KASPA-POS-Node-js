
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
import { X, Printer, Share2 } from 'lucide-react';

interface BillProps {
  order: Order;
  orderItems: { name: string; quantity: number; price: number, id: number; category: string; portion?: string }[];
  subtotal: number;
  tax: number;
  total: number;
  onBillClose: () => void;
}

const WhatsAppIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
      className="mr-2 h-4 w-4"
    >
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
    </svg>
);


export function Bill({ order, orderItems, subtotal, tax, total, onBillClose }: BillProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleShareToWhatsApp = () => {
    let message = `*KASPA POS Bill*\n`;
    message += `Order #${order.orderNumber}\n`;
    message += `${new Date(order.timestamp).toLocaleString()}\n\n`;

    if (order.type === 'dine-in') {
      message += `Table: ${order.table}, Seat: ${order.seat}\n\n`;
    } else {
      message += `*Delivery To:*\n${order.address}\nPhone: ${order.phone_no}\n\n`;
    }

    message += `*Items:*\n`;
    orderItems.forEach(item => {
      message += `- ${item.quantity}x ${item.name} @ Rs.${item.price.toFixed(2)} = Rs.${(item.price * item.quantity).toFixed(2)}\n`;
    });

    message += `\n*Subtotal:* Rs.${subtotal.toFixed(2)}`;
    message += `\n*Tax (5%):* Rs.${tax.toFixed(2)}`;
    message += `\n*Total:* *Rs.${total.toFixed(2)}*\n\n`;
    message += `Thank you for your visit!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
              <span>Rs.${tax.toFixed(2)}</span>
            </div>
             <Separator className="my-1 bg-black" />
            <div className="flex justify-between font-bold text-base">
              <span>Total:</span>
              <span>Rs.${total.toFixed(2)}</span>
            </div>
             <Separator className="my-2 bg-black" />
            <p className="text-center">Thank you for your visit!</p>
          </footer>
        </div>
        <DialogFooter className="p-4 border-t print:hidden flex-row justify-end gap-2">
            <Button variant="outline" onClick={onBillClose}>
                <X className="mr-2 h-4 w-4" /> Close
            </Button>
            <Button onClick={handleShareToWhatsApp} variant="secondary">
                <WhatsAppIcon /> Share
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
