import { create } from 'zustand';
import type { AuthState } from '@/types/store.ts';
import * as authService from '@/services/authService.ts';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    try {
      const session = await authService.getSession();
      if (session) {
        const profile = await authService.getProfile(session.user.id);
        set({
          user: profile,
          session: { access_token: session.access_token, user: session.user },
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    const data = await authService.signIn(email, password);
    const profile = await authService.getProfile(data.session.user.id);
    set({
      user: profile,
      session: { access_token: data.session.access_token, user: data.session.user },
    });
  },

  signUp: async (email, password, fullName) => {
    await authService.signUp(email, password, fullName);
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, session: null });
  },
}));
