
'use client';

import * as React from 'react';
import { getOrders } from '@/lib/actions';
import type { Order } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DollarSign, ShoppingCart } from 'lucide-react';
import { subDays, format, startOfDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const allOrders = await getOrders();
      setOrders(allOrders.filter(o => o.status === 'completed'));
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const {
    totalRevenue,
    totalOrders,
    revenueToday,
    ordersToday,
    revenueOverTime,
    topSellingItems
  } = React.useMemo(() => {
    if (orders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        revenueToday: 0,
        ordersToday: 0,
        revenueOverTime: [],
        topSellingItems: [],
      };
    }

    const today = startOfDay(new Date());

    let revenueToday = 0;
    let ordersToday = 0;

    const completedOrders = orders.filter(o => o.status === 'completed');

    const totalRevenue = completedOrders.reduce((acc, order) => acc + (order.total || 0), 0);
    const totalOrders = completedOrders.length;

    completedOrders.forEach(order => {
      if (new Date(order.timestamp) >= today) {
        revenueToday += order.total || 0;
        ordersToday++;
      }
    });

    // Revenue over last 7 days
    const revenueOverTimeData: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dailyRevenue = completedOrders
        .filter(order => startOfDay(new Date(order.timestamp)).getTime() === date.getTime())
        .reduce((acc, order) => acc + (order.total || 0), 0);
      revenueOverTimeData.push({
        date: format(date, 'MMM dd'),
        revenue: dailyRevenue,
      });
    }

    // Top selling items
    const itemCounts: { [name: string]: number } = {};
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    const topSellingItemsData = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    return {
      totalRevenue,
      totalOrders,
      revenueToday,
      ordersToday,
      revenueOverTime: revenueOverTimeData,
      topSellingItems: topSellingItemsData,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 h-full">
        <header className="mb-6">
          <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading analytics...</p>
        </header>
         <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Skeleton className="h-28" />
             <Skeleton className="h-28" />
             <Skeleton className="h-28" />
             <Skeleton className="h-28" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[350px]" />
            <Skeleton className="h-[350px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 h-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
        <p className="text-muted-foreground">A quick overview of your restaurant's performance.</p>
      </header>
      
      <main className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs.{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">All-time revenue from completed orders.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{totalOrders}</div>
              <p className="text-xs text-muted-foreground">All-time completed orders.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs.{revenueToday.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Revenue from today's completed orders.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{ordersToday}</div>
              <p className="text-xs text-muted-foreground">Completed orders today.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Revenue Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `Rs.${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Selling Items Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSellingItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12}} />
                  <Tooltip formatter={(value: number) => `${value} units`} />
                  <Legend />
                  <Bar dataKey="quantity" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
