"use client";

import { Grid2X2Plus, ListX, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import SaleTable from "./producer-table";

import { AvaliableProduct, CreateProducerData, CreateProducerDetailData, ProducerStatus } from "@/types";

interface CartProducerProps {
  availableProducts: AvaliableProduct[]
  handleProcessSale: (status: ProducerStatus) => Promise<void>
  producer: Omit<CreateProducerData, "id">
  removeAllProducerDetails: () => void
  updateProducerDetail: (index: number, updates: Partial<CreateProducerDetailData>) => void
  removeProducerDetail: (index: number) => void
  submitting: boolean
}

const CartProducer = ({ availableProducts, submitting, handleProcessSale, producer, removeAllProducerDetails, updateProducerDetail, removeProducerDetail }: CartProducerProps) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Lista de producción</h2>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-2 my-2 sm:my-0">
            <Button
              variant="outline"
              size="sm"
              onClick={removeAllProducerDetails}
              disabled={producer.details.length === 0}
              className="cursor-pointer"
            >
              <ListX className="h-4 w-4 mr-1" />
              Vaciar
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {producer.details.length} {producer.details.length === 1 ? 'producto' : 'productos'}
          </span>

        </div>
      </div>

      {producer.details.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <p>No hay productos en producción</p>
          <p className="text-sm">Busca y agrega productos para comenzar</p>
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <SaleTable
              availableProducts={availableProducts}
              producer={producer}
              updateProducerDetail={updateProducerDetail}
              removeProducerDetail={removeProducerDetail}
            />
          </div>

          <div className="border-t p-4">

            <div className="flex justify-end gap-4 mt-6">
              <Button
                onClick={() => handleProcessSale(ProducerStatus.PRODUCED)}
                disabled={producer.details.length === 0}
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
              >
                {
                  submitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando producción...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Grid2X2Plus className="size-4" />
                      Procesar producción
                    </div>
                  )
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartProducer;
