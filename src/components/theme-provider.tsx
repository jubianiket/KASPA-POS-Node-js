
'use client';

import { getSettings } from '@/lib/actions';
import * as React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const applyTheme = async () => {
      const settings = await getSettings();
      if (settings?.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    applyTheme();
  }, []);

  return <>{children}</>;
}
