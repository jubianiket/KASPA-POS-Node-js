
'use client';

import * as React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return <>{children}</>;
}
