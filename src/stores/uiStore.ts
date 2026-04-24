import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState } from '@/types/store.ts';

export const useUIStore = create(
  persist<UIState>(
    (set) => ({
      theme: 'dark',
      sidebarOpen: false,
      toggleTheme: () =>
        set((s) => ({
          theme: s.theme === 'light' ? 'dark' : 'light',
        })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    { name: 'gastobot-ui' },
  ),
);
