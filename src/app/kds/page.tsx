
import * as React from 'react';
import { KdsClient } from './kds-client';
import { getOrders } from '@/lib/actions';

export default async function KdsPage() {
  const initialOrders = await getOrders();
  const activeOrders = initialOrders.filter(o => o.status !== 'completed');

  return (
    <KdsClient initialOrders={activeOrders} />
  );
}
