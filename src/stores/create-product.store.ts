import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CreateProductData, ProductType } from '@/types';

interface CreateProductStore {
  // Product data
  product: Omit<CreateProductData, 'id' | 'slug' | 'createdAt' | 'updatedAt'>;
  // Actions
  setProduct: (product: Partial<CreateProductData>) => void;
  // Characteristic management
  addCharacteristic: (name: string) => void;
  removeCharacteristic: (index: number) => void;
  addCharacteristicItem: (charIndex: number, value: string) => void;
  removeCharacteristicItem: (charIndex: number, itemIndex: number) => void;
  // Tag management
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  // Product actions
  resetProduct: () => void;
  // Status
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

const initialState: CreateProductData = {
  name: '',
  type: ProductType.PRODUCT,
  description: '',
  brand: '',
  refCode: '',
  category: '',
  inputProductId: '',
  measureUnitValue: 0,
  images: [],
  tags: [],
  characteristics: [],
  minStock: 0,
};

export const useCreateProductStore = create<CreateProductStore>()(
  persist(
    (set) => ({
      product: { ...initialState },

      setProduct: (product) =>
        set((state) => ({
          product: { ...state.product, ...product }
        })),

      addCharacteristic: (name) =>
        set((state) => {
          const characteristics = [...(state.product.characteristics || [])];
          characteristics.push({ name, items: [] });
          return {
            product: { ...state.product, characteristics }
          };
        }),

      removeCharacteristic: (index) =>
        set((state) => {
          const characteristics = [...(state.product.characteristics || [])];
          characteristics.splice(index, 1);
          return {
            product: { ...state.product, characteristics }
          };
        }),

      addCharacteristicItem: (charIndex, value) =>
        set((state) => {
          const characteristics = [...(state.product.characteristics || [])];
          if (characteristics[charIndex]) {
            const items = [...(characteristics[charIndex].items || [])];
            if (!items.some(item => item.value === value)) {
              items.push({ value });
              characteristics[charIndex] = {
                ...characteristics[charIndex],
                items
              };
            }
          }
          return {
            product: { ...state.product, characteristics }
          };
        }),

      removeCharacteristicItem: (charIndex, itemIndex) =>
        set((state) => {
          const characteristics = [...(state.product.characteristics || [])];
          if (characteristics[charIndex]?.items) {
            const items = [...characteristics[charIndex].items];
            items.splice(itemIndex, 1);
            characteristics[charIndex] = {
              ...characteristics[charIndex],
              items
            };
          }
          return {
            product: { ...state.product, characteristics }
          };
        }),

      addTag: (tag) =>
        set((state) => {
          const tags = [...(state.product.tags || [])];
          if (!tags.includes(tag)) {
            tags.push(tag);
          }
          return {
            product: { ...state.product, tags }
          };
        }),

      removeTag: (tag) =>
        set((state) => ({
          product: {
            ...state.product,
            tags: (state.product.tags || []).filter((t) => t !== tag)
          }
        })),

      resetProduct: () =>
        set({
          product: { ...initialState }
        }),

      isSubmitting: false,
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    }),
    {
      name: 'product-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        product: state.product,
        // Don't persist the submitting state
      }),
    }
  )
);

// Helper hook to easily access and update the product
export const useProductForm = () => {
  const {
    product,
    setProduct,
    addCharacteristic,
    removeCharacteristic,
    addCharacteristicItem,
    removeCharacteristicItem,
    resetProduct,
    addTag,
    removeTag,
    isSubmitting,
    setIsSubmitting
  } = useCreateProductStore();

  return {
    product,
    setProduct,
    addCharacteristic,
    removeCharacteristic,
    addCharacteristicItem,
    removeCharacteristicItem,
    resetProduct,
    addTag,
    removeTag,
    isSubmitting,
    setIsSubmitting,
  };
};