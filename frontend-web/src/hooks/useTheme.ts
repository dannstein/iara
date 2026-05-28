import { useEffect } from 'react';
import { useThemeStore, type Theme } from '@/store/themeStore';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effectiveDark = theme === 'dark' || (theme === 'system' && prefersDark);

  root.classList.toggle('dark', effectiveDark);
  root.classList.toggle('light', !effectiveDark);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', effectiveDark ? '#070B14' : '#F0F4F8');
  }
}

export function useTheme() {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  function cycleTheme() {
    const order: Theme[] = ['dark', 'light', 'system'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }

  return { theme, setTheme, cycleTheme };
}

/** Called once before React renders to avoid FOUC. */
export function initTheme() {
  try {
    const stored = localStorage.getItem('iara_theme');
    const theme: Theme = stored ? (JSON.parse(stored)?.state?.theme ?? 'dark') : 'dark';
    applyTheme(theme);
  } catch {
    document.documentElement.classList.add('dark');
  }
}
