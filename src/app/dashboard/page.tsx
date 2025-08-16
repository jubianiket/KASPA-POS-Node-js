
'use client';

import * as React from 'react';
import { getOrders } from '@/lib/actions';
import type { Order } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DollarSign, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';
import { subDays, format, startOfDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';

const statusColors: Record<string, string> = {
  received: 'bg-blue-500',
  preparing: 'bg-yellow-500',
  ready: 'bg-green-500',
  completed: 'bg-gray-500',
};

export default function DashboardPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const allOrders = await getOrders();
      setOrders(allOrders);
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
    topSellingItems,
    revenueGrowth,
    todayOrdersByType,
    todayOrdersByStatus,
    totalOrdersToday
  } = React.useMemo(() => {
    if (orders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        revenueToday: 0,
        ordersToday: 0,
        revenueOverTime: [],
        topSellingItems: [],
        revenueGrowth: 0,
        todayOrdersByType: {},
        todayOrdersByStatus: {},
        totalOrdersToday: 0
      };
    }

    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));

    let revenueToday = 0;
    let ordersToday = 0; // Completed orders today
    let revenueYesterday = 0;

    const completedOrders = orders.filter(o => o.status === 'completed');

    const totalRevenue = completedOrders.reduce((acc, order) => acc + (order.total || 0), 0);
    const totalOrders = completedOrders.length;
    
    const todayOrders = orders.filter(order => startOfDay(new Date(order.timestamp)).getTime() === today.getTime());
    const totalOrdersToday = todayOrders.length;

    const todayOrdersByType: Record<string, number> = {};
    const todayOrdersByStatus: Record<string, number> = {};


    todayOrders.forEach(order => {
        // Type bifurcation
        todayOrdersByType[order.type] = (todayOrdersByType[order.type] || 0) + 1;
        
        // Status bifurcation
        todayOrdersByStatus[order.status] = (todayOrdersByStatus[order.status] || 0) + 1;

        if (order.status === 'completed') {
            revenueToday += order.total || 0;
            ordersToday++;
        }
    });

    completedOrders.forEach(order => {
      const orderDate = startOfDay(new Date(order.timestamp));
      if (orderDate.getTime() === yesterday.getTime()) {
        revenueYesterday += order.total || 0;
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
        
    const revenueGrowth = revenueYesterday > 0
      ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
      : revenueToday > 0 ? 100 : 0;


    return {
      totalRevenue,
      totalOrders,
      revenueToday,
      ordersToday,
      revenueOverTime: revenueOverTimeData,
      topSellingItems: topSellingItemsData,
      revenueGrowth,
      todayOrdersByType,
      todayOrdersByStatus,
      totalOrdersToday
    };
  }, [orders]);

  if (loading) {
    return (
      <PageLayout
        title="Dashboard"
        description="Loading analytics..."
      >
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
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Dashboard"
      description="A quick overview of your restaurant's performance."
    >
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
               <p className={cn("text-xs text-muted-foreground flex items-center", revenueGrowth >= 0 ? "text-green-600" : "text-red-600")}>
                {revenueGrowth >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                {revenueGrowth.toFixed(1)}% from yesterday
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{totalOrdersToday}</div>
              <div className="space-y-1 mt-1 text-xs">
                 <div className="text-muted-foreground font-semibold">By Type:</div>
                 <div className="flex gap-2">
                    {Object.entries(todayOrdersByType).map(([type, count]) => (
                        <span key={type}>{type.charAt(0).toUpperCase() + type.slice(1)}: {count}</span>
                    ))}
                 </div>
                 <div className="text-muted-foreground font-semibold pt-1">By Status:</div>
                 <div className="flex flex-wrap gap-1">
                    {Object.entries(todayOrdersByStatus).map(([status, count]) => {
                       const href = status === 'completed' ? '/history' : '/?tab=active-orders';
                       return (
                         <Link key={status} href={href}>
                           <Badge className={`${statusColors[status]} text-white text-xs cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-ring`}>
                               {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
                           </Badge>
                         </Link>
                       )
                    })}
                 </div>
              </div>
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
    </PageLayout>
  );
}
