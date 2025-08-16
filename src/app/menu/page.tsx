
import * as React from 'react';
import { getMenuItems } from '@/lib/actions';
import { MenuClient } from './menu-client';

export default async function MenuManagementPage() {
  const menuItems = await getMenuItems();
  
  return <MenuClient initialMenuItems={menuItems} />;
}
