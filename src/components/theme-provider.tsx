
'use client';

import { getSettings } from '@/lib/actions';
import { generateTheme } from '@/lib/theme';
import * as React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const applySavedTheme = async () => {
      const settings = await getSettings();
      
      if (settings?.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      if (settings?.theme_color) {
        const theme = generateTheme(settings.theme_color);
        Object.entries(theme).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--${key}`, value);
        });
      }
    };
    applySavedTheme();
  }, []);

  return <>{children}</>;
}
