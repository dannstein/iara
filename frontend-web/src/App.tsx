import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes/router';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';

function ThemedToaster() {
  const theme = useThemeStore((s) => s.theme);
  useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <Toaster
      position="top-right"
      theme={isDark ? 'dark' : 'light'}
      toastOptions={{
        style: {
          background: isDark ? '#111827' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
          color: isDark ? '#F0F4F8' : '#0F172A',
          fontSize: '13px',
        },
      }}
    />
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ThemedToaster />
    </QueryClientProvider>
  );
}
