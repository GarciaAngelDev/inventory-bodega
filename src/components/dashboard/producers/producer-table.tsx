"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AvaliableProduct, CreateProducerData, CreateProducerDetailData, MeasureUnit } from "@/types";
import { Minus, Plus, Trash2 } from "lucide-react";

interface SaleTableProps {
  availableProducts: AvaliableProduct[];
  producer: Omit<CreateProducerData, "id">
  updateProducerDetail: (index: number, updates: Partial<CreateProducerDetailData>) => void
  removeProducerDetail: (index: number) => void
}

const ProducerTable = ({ availableProducts, producer, removeProducerDetail, updateProducerDetail }: SaleTableProps) => {

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead className="w-[220px]">Cantidad</TableHead>
          <TableHead className="w-[60px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {producer.details.map((detail, index) => {
          const availableProduct = availableProducts.find(
            ap => ap.product.id === detail.productId
          );

          if (!availableProduct) return null;

          const product = availableProduct.product;

          return (
            <TableRow key={`${product.id}-${index}`}>
              <TableCell>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.refCode}</p>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="mt-1">
                        Disponible: {availableProduct.isInputProduct ? availableProduct.availableMeasureUnitValue.toLocaleString() : availableProduct.availableQuantity} <span className="lowercase">{availableProduct.product.inputProduct ? availableProduct.product.inputProduct?.measureUnit : "UND"}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div>
                        <p className="font-bold">Unidad de medida:</p>
                        <p>
                          {
                            availableProduct.product.inputProduct
                              ? availableProduct.product.inputProduct?.measureUnit === MeasureUnit.KG ? "Kilogramos" :
                                availableProduct.product.inputProduct?.measureUnit === MeasureUnit.G ? "Gramos" :
                                  availableProduct.product.inputProduct?.measureUnit === MeasureUnit.L ? "Litros" :
                                    availableProduct.product.inputProduct?.measureUnit === MeasureUnit.ML ? "Mililitros" :
                                      ""
                              : "Unidades"
                          }
                          <span className="lowercase"> ({availableProduct.product.inputProduct ? availableProduct.product.inputProduct?.measureUnit : "UND"})</span>
                        </p>
                        <p className="font-bold">Disponibilidad:</p>
                        <p>
                          {
                            availableProduct.isInputProduct
                              ? availableProduct.availableMeasureUnitValue.toLocaleString()
                              : availableProduct.availableQuantity
                          }
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
              {
                product.inputProduct ? (

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateProducerDetail(index, { measureUnitValue: Math.max(1, detail.measureUnitValue! - 1) })}
                        disabled={!product.inputProduct}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-3 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500 sm:text-gray-400 uppercase">{product.inputProduct?.measureUnit || ""}</span>
                        </div>
                        <Input
                          type="number"
                          className="w-32 pr-8"
                          min={0}
                          max={availableProduct.availableMeasureUnitValue}
                          value={detail.measureUnitValue === 0 ? '' : detail.measureUnitValue}
                          placeholder="0"
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            if (value === 0 || (!isNaN(value) && value > 0 && value <= availableProduct.availableMeasureUnitValue)) {
                              updateProducerDetail(index, { measureUnitValue: value });
                            }
                          }}
                          disabled={!product.inputProduct}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateProducerDetail(index, { measureUnitValue: detail.measureUnitValue! + 1 })}
                        disabled={!product.inputProduct || detail.measureUnitValue! >= availableProduct.availableMeasureUnitValue}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                ) : (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateProducerDetail(index, { quantity: Math.max(1, detail.quantity - 1) })}
                        disabled={(detail.quantity <= 1) || !!product.inputProduct}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      {/* <Input
                        type="number"
                        className="w-20 text-center"
                        min={1}
                        max={availableProduct.availableQuantity}
                        value={detail.quantity}
                        disabled={!!product.inputProduct}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value) && value > 0 && value <= availableProduct.availableQuantity) {
                            updateProducerDetail(index, { quantity: value });
                          }
                        }}
                      /> */}
                      <div className="relative">
                        <div className="absolute inset-y-0 right-3 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500 sm:text-gray-400">UND</span>
                        </div>
                        <Input
                          type="number"
                          className="w-32 pr-11"
                          min={1}
                          max={availableProduct.availableQuantity}
                          value={detail.quantity === 0 ? '' : detail.quantity}
                          placeholder="0"
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            if (value === 0 || (!isNaN(value) && value > 0 && value <= availableProduct.availableQuantity)) {
                              updateProducerDetail(index, { quantity: value });
                            }
                          }}
                          disabled={!!product.inputProduct}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateProducerDetail(index, { quantity: detail.quantity + 1 })}
                        disabled={detail.quantity >= availableProduct.availableQuantity || !!product.inputProduct}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )
              }

              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProducerDetail(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  )
}

export default ProducerTable
