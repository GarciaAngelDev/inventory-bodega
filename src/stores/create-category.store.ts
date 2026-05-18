import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Category, CategoryStatus } from '@/types/category';

interface CreateCategoryStore {
  // Category data
  category: Omit<Category, 'id' | 'slug' | 'createdAt' | 'updatedAt'>;
  // Actions
  setCategory: (category: Partial<Category>) => void;
  // Status
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  // Reset
  resetCategory: () => void;
}

const initialState = {
  name: '',
  description: '',
  status: CategoryStatus.ACTIVE
};

export const useCreateCategoryStore = create<CreateCategoryStore>()(
  persist(
    (set) => ({
      category: { ...initialState },

      setCategory: (category) =>
        set((state) => ({
          category: { ...state.category, ...category }
        })),

      isSubmitting: false,
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

      resetCategory: () => 
        set({ 
          category: { ...initialState },
          isSubmitting: false
        }),
    }),
    {
      name: 'category-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        // Only persist these properties
        category: state.category,
      }),
    }
  )
);

// Helper hook to easily access and update the category
export const useCategoryForm = () => {
  const { 
    category, 
    setCategory, 
    isSubmitting, 
    setIsSubmitting,
    resetCategory
  } = useCreateCategoryStore();

  return {
    category,
    setCategory,
    isSubmitting,
    setIsSubmitting,
    resetCategory,
  };
};