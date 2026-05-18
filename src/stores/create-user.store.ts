import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface CreateUserStore {
  // Category data
  user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
  // Actions
  setUser: (user: Partial<User>) => void;
  // Status
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  // Reset
  resetUser: () => void;
}

const initialState: User = {
  name: '',
  email: '',
  password: '',
  role: UserRole.AUXILIAR
};

export const useCreateUserStore = create<CreateUserStore>()(
  persist(
    (set) => ({
      user: { ...initialState },

      setUser: (user) =>
        set((state) => ({
          user: { ...state.user, ...user }
        })),

      isSubmitting: false,
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

      resetUser: () => 
        set({ 
          user: { ...initialState },
          isSubmitting: false
        }),
    }),
    {
      name: 'user-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        // Only persist these properties
        user: state.user,
      }),
    }
  )
);

// Helper hook to easily access and update the category
export const useUserForm = () => {
  const { 
    user, 
    setUser, 
    isSubmitting, 
    setIsSubmitting,
    resetUser
  } = useCreateUserStore();

  return {
    user,
    setUser,
    isSubmitting,
    setIsSubmitting,
    resetUser,
  };
};