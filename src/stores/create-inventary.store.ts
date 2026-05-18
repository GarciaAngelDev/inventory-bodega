import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CreateInventoryData, InventoryType, CreateInventoryItem } from '@/types/inventary';

interface CreateInventaryStore {
  // Inventory data
  inventory: Omit<CreateInventoryData, 'id'>;
  // Actions
  setInventory: (inventory: Partial<CreateInventoryData>) => void;
  // Item management
  addEmptyItem: () => void;
  updateItem: (index: number, item: Partial<CreateInventoryItem>) => void;
  removeItem: (index: number) => void;
  removeAllItems: () => void;
  // Status
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  // Reset
  resetInventory: () => void;
}

const initialState: Omit<CreateInventoryData, 'id'> = {
  name: '',
  invoiceNumber: '',
  providerName: '',
  type: InventoryType.SALE,
  items: [] as CreateInventoryItem[]
};

const createEmptyItem = (): Omit<CreateInventoryItem, 'id'> => ({
  retailPrice: '',
  wholesalePrice: '',
  stock: '',
  initialStock: 0, // This can stay as 0 since it's not directly edited
  productId: '',
  ivaPercentage: 0,
  measureUnitValue: 1, // Changed from 0 to 1 as it's a better default
  initialMeasureUnitValue: 1, // Changed from 0 to 1 as it's a better default
  enabledIva: false
});

export const useCreateInventaryStore = create<CreateInventaryStore>()(
  persist(
    (set) => ({
      inventory: { ...initialState },

      setInventory: (inventory) =>
        set((state) => {
          if(inventory.items && inventory.items.length > 0) {
            inventory.items.forEach((item) => {
              if(item.ivaPercentage && item.ivaPercentage > 0) {
                item.enabledIva = true;
              }
            })
          }
          return {
            inventory: { ...state.inventory, ...inventory }
          }
        }),

      addEmptyItem: () =>
        set((state) => ({
          inventory: {
            ...state.inventory,
            items: [...state.inventory.items, createEmptyItem()]
          }
        })),

      updateItem: (index, updates) =>
        set((state) => {
          const items = [...state.inventory.items];
          if (items[index]) {
            items[index] = { ...items[index], ...updates };
          }
          return {
            inventory: {
              ...state.inventory,
              items,
            }
          };
        }),

      removeItem: (index) =>
        set((state) => {
          const items = [...state.inventory.items];
          items.splice(index, 1);
          return {
            inventory: {
              ...state.inventory,
              items
            }
          };
        }),
      
      removeAllItems: () =>
        set((state) => ({
          inventory: {
            ...state.inventory,
            items: []
          }
        })),

      isSubmitting: false,
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

      resetInventory: () => set({ inventory: { ...initialState } }),
    }),
    {
      name: 'inventory-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ inventory: state.inventory }),
    }
  )
);

// Helper hook para acceder fácilmente al inventario
export const useInventaryForm = () => {
  const { 
    inventory, 
    setInventory, 
    addEmptyItem, 
    updateItem, 
    removeItem, 
    removeAllItems,
    isSubmitting, 
    setIsSubmitting,
    resetInventory 
  } = useCreateInventaryStore();

  return {
    // Data
    inventory,
    // Actions
    setInventory,
    addEmptyItem,
    updateItem,
    removeItem,
    removeAllItems,
    // Status
    isSubmitting,
    setIsSubmitting,
    // Helpers
    resetForm: resetInventory,
  };
};