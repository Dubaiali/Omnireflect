import { create } from 'zustand';
import type { RoleContext } from '@/lib/gpt';

interface RoleContextState {
  roleContext: RoleContext | null;
  setRoleContext: (roleContext: RoleContext) => void;
  reset: () => void;
}

export const useRoleContextStore = create<RoleContextState>((set) => ({
  roleContext: null,
  setRoleContext: (roleContext) => set({ roleContext }),
  reset: () => set({ roleContext: null }),
})); 