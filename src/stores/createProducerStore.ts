import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CreateProducerData, CreateProducerDetailData, ProducerStatus } from "@/types/producer";

interface CreateProducerStore {
  producer: Omit<CreateProducerData, 'id'>;
  setProducer: (sale: Omit<CreateProducerData, 'id'>) => void;
  addProducerDetail: (detail: CreateProducerDetailData) => void;
  updateProducerDetail: (index: number, updates: Partial<CreateProducerDetailData>) => void;
  removeProducerDetail: (index: number) => void;
  removeAllProducerDetails: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetProducer: () => void;
}

const initialState: Omit<CreateProducerData, 'id'> = {
  status: ProducerStatus.PRODUCED,
  details: [] as CreateProducerDetailData[]
}

export const useCreateSaleStore = create<CreateProducerStore>()(
  persist(
    (set) => ({
      producer: initialState,
      setProducer: (producer) => set((state) => ({ ...state, producer })),
      addProducerDetail: (detail) => set((state) => {
        // Check if product already exists in details
        const productExists = state.producer.details.some(d => d.productId === detail.productId);

        if (productExists) {
          return state; // Return current state if product already exists
        }

        return {
          producer: {
            ...state.producer,
            details: [...state.producer.details, detail]
          }
        };
      }),
      updateProducerDetail: (index, updates) => set((state) => ({
        producer: {
          ...state.producer,
          details: state.producer.details.map((detail, i) =>
            i === index ? { ...detail, ...updates } : detail
          )
        }
      })),
      removeProducerDetail: (index) => set((state) => ({
        producer: {
          ...state.producer,
          details: state.producer.details.filter((_, i) => i !== index)
        }
      })),
      removeAllProducerDetails: () => set((state) => ({
        producer: {
          ...state.producer,
          details: []
        }
      })),
      resetProducer: () => set({ producer: initialState }),
      isSubmitting: false,
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    }),
    {
      name: 'create-producer-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        producer: state.producer,
      }),
    }
  )
)

export const useProducerStore = () => {
  const {
    producer,
    setProducer,
    addProducerDetail,
    updateProducerDetail,
    removeProducerDetail,
    removeAllProducerDetails,
    isSubmitting,
    setIsSubmitting,
    resetProducer
  } = useCreateSaleStore();

  return {
    // Data
    producer,
    // Actions
    setProducer,
    addProducerDetail,
    updateProducerDetail,
    removeProducerDetail,
    removeAllProducerDetails,
    // Status
    isSubmitting,
    setIsSubmitting,
    // Helpers
    resetForm: resetProducer,
  };
};
