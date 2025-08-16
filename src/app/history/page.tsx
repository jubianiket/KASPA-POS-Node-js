
import * as React from 'react';
import { getOrders } from '@/lib/actions';
import { HistoryClient } from './history-client';

export default async function HistoryPage() {
  const allOrders = await getOrders();
  return <HistoryClient initialOrders={allOrders} />;
}
