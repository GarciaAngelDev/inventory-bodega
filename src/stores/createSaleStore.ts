import { CreateSaleData, CreateSaleDetailData, SaleStatus } from "@/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CreateSaleStore {
  sale: Omit<CreateSaleData, 'id'>;
  setSale: (sale: Omit<CreateSaleData, 'id'>) => void;
  addSaleDetail: (detail: CreateSaleDetailData) => void;
  updateSaleDetail: (index: number, updates: Partial<CreateSaleDetailData>) => void;
  removeSaleDetail: (index: number) => void;
  removeAllSaleDetails: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetSale: () => void;
}

const initialState: Omit<CreateSaleData, 'id'> = {
  status: SaleStatus.SOLD,
  enableIva: false,
  ivaPercentage: 0,
  discount: undefined,
  deliveryDate: undefined,
  details: [] as CreateSaleDetailData[]
}

export const useCreateSaleStore = create<CreateSaleStore>()(
  persist(
    (set) => ({
      sale: initialState,
      setSale: (sale) => set((state) => ({ ...state, sale })),
      addSaleDetail: (detail) => set((state) => {
        // Check if product already exists in details
        const productExists = state.sale.details.some(d => d.productId === detail.productId);
        
        if (productExists) {
          return state; // Return current state if product already exists
        }
        
        return {
          sale: {
            ...state.sale,
            details: [...state.sale.details, detail]
          }
        };
      }),
      updateSaleDetail: (index, updates) => set((state) => ({
        sale: {
          ...state.sale,
          details: state.sale.details.map((detail, i) =>
            i === index ? { ...detail, ...updates } : detail
          )
        }
      })),
      removeSaleDetail: (index) => set((state) => ({
        sale: {
          ...state.sale,
          details: state.sale.details.filter((_, i) => i !== index)
        }
      })),
      removeAllSaleDetails: () => set((state) => ({
        sale: {
          ...state.sale,
          details: []
        }
      })),
      resetSale: () => set({ sale: initialState }),
      isSubmitting: false,
      setIsSubmitting: (isSubmitting) => set({ isSubmitting}),
    }),
    {
      name: 'create-sale-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sale: state.sale,
      }),
    }
  )
)

export const useSaleStore = () => {
  const { 
    sale, 
    setSale,
    addSaleDetail,
    updateSaleDetail, 
    removeSaleDetail, 
    removeAllSaleDetails,
    isSubmitting, 
    setIsSubmitting,
    resetSale 
  } = useCreateSaleStore();

  return {
    // Data
    sale,
    // Actions
    setSale,
    addSaleDetail,
    updateSaleDetail,
    removeSaleDetail,
    removeAllSaleDetails,
    // Status
    isSubmitting,
    setIsSubmitting,
    // Helpers
    resetForm: resetSale,
  };
};
