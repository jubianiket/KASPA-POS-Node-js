
'use client';

import * as React from 'react';
import type { Order } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Search } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';

const statusColors: Record<Order['status'], string> = {
  received: 'bg-blue-500',
  preparing: 'bg-yellow-500',
  ready: 'bg-green-500',
  completed: 'bg-gray-500',
};

type SortKey = 'orderNumber' | 'timestamp' | 'total';
type SortDirection = 'asc' | 'desc';

export function HistoryClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = React.useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sortKey, setSortKey] = React.useState<SortKey>('timestamp');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');


  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedOrders = React.useMemo(() => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter((order) =>
        String(order.orderNumber).includes(searchQuery)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    return [...filtered].sort((a, b) => {
      let valA: any, valB: any;

      if (sortKey === 'total') {
        valA = a.total || 0;
        valB = b.total || 0;
      } else {
        valA = a[sortKey];
        valB = b[sortKey];
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, searchQuery, statusFilter, sortKey, sortDirection]);

  return (
    <PageLayout
      title="Order History"
      description="Review past transaction records."
    >
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-grow overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('orderNumber')}>
                    Order ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                   <Button variant="ghost" onClick={() => handleSort('timestamp')}>
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('total')}>
                    Total
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                  <TableCell>
                    {format(new Date(order.timestamp), 'dd/MM/yyyy, hh:mm a')}
                  </TableCell>
                  <TableCell>
                    {order.type === 'dine-in' ? `Dine-In (T${order.table}, S${order.seat})` : order.type}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[order.status]} text-white`}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">Rs.{order.total?.toFixed(2) || '0.00'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>
    </PageLayout>
  );
}
