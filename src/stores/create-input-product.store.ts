import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MeasureUnit, InputProduct, InputProductStatus } from '@/types';

interface CreateInputProductStore {
  // Input Product data
  inputProduct: Omit<InputProduct, 'id' | 'createdAt' | 'updatedAt'>;
  // Actions
  setInputProduct: (inputProduct: Partial<InputProduct>) => void;
  // Status
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  // Reset
  resetInputProduct: () => void;
}

const initialState: Omit<InputProduct, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  measureUnit: MeasureUnit.KG,
  minQuantity: 0,
  maxQuantity: 0,
  status: InputProductStatus.ACTIVE,
};

export const useCreateInputProductStore = create<CreateInputProductStore>()(
  persist(
    (set) => ({
      inputProduct: { ...initialState },

      setInputProduct: (inputProduct) =>
        set((state) => ({
          inputProduct: { ...state.inputProduct, ...inputProduct }
        })),

      isSubmitting: false,
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

      resetInputProduct: () => 
        set({ 
          inputProduct: { ...initialState },
          isSubmitting: false
        }),
    }),
    {
      name: 'input-product-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        // Only persist these properties
        inputProduct: state.inputProduct,
      }),
    }
  )
);

// Helper hook to easily access and update the category
export const useInputProductForm = () => {
  const { 
    inputProduct, 
    setInputProduct, 
    isSubmitting, 
    setIsSubmitting,
    resetInputProduct
  } = useCreateInputProductStore();

  return {
    inputProduct,
    setInputProduct,
    isSubmitting,
    setIsSubmitting,
    resetInputProduct,
  };
};