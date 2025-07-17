import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  user: null | { id: string; name: string; role: string };
  login: (user: { id: string; name: string; role: string }) => void;
  logout: () => void;
  reset: () => void;
  resetAllStores: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  user: null,
  login: (user) => set({ isLoggedIn: true, user }),
  logout: () => {
    // Reset aller Stores beim Logout
    get().resetAllStores();
    set({ isLoggedIn: false, user: null });
  },
  reset: () => set({ isLoggedIn: false, user: null }),
  resetAllStores: () => {
    // Reset authStore
    set({ isLoggedIn: false, user: null });
    
    // Reset roleContextStore (wird dynamisch importiert)
    import('@/state/roleContextStore').then(({ useRoleContextStore }) => {
      useRoleContextStore.getState().reset();
    });
    
    // Reset questionsStore (wird dynamisch importiert)
    import('@/state/questionsStore').then(({ useQuestionsStore }) => {
      useQuestionsStore.getState().reset();
    });
    
    // Lösche localStorage-Daten
    localStorage.removeItem('question-answers');
    localStorage.removeItem('followup-questions');
  },
})); 