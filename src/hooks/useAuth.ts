import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore.ts';
import * as authService from '@/services/authService.ts';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.initialize();

    const { data: { subscription } } = authService.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          useAuthStore.setState({ user: null, session: null });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await store.initialize();
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    user: store.user,
    session: store.session,
    loading: store.loading,
    signIn: store.signIn,
    signUp: store.signUp,
    signOut: store.signOut,
    resetPassword: authService.resetPassword,
    updateProfile: authService.updateProfile,
  };
}
