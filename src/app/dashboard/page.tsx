
import * as React from 'react';
import { getOrders } from '@/lib/actions';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const allOrders = await getOrders();
  
  return <DashboardClient orders={allOrders} />;
}
