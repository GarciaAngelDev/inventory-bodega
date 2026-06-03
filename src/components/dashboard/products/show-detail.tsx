"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { productDetail, updateProductPrice } from "@/actions/products.action";
import { Category, InputProduct, ProductCharacteristics, UserRole } from "@/types";
import { InventaryItem } from "@/generated/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DollarSign, Package, Pencil, Check, X, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/format-price";
import { useAuthForm } from "@/stores/auth.store";
import { toast } from "sonner";

export interface ProductDetail {
  id: string;
  name: string;
  refCode: string;
  slug: string;
  description: string;
  brand: string;
  type: string;
  status: string;
  minStock: number;
  maxStock: number;
  images: any[];
  tags: any[];
  measureUnitValue: number;
  categoryId: string;
  inputProductId: string;
  createdAt: Date;
  updatedAt: Date;
  category: Category;
  characteristics: ProductCharacteristics[];
  inputProduct: InputProduct;
  inventaryItems: InventaryItem[];
  avaliableCount: number;
  retailPrice: number;
  wholesalePrice: number;
}

interface ShowDetailProps {
  productId: string;
  open: boolean;
  onClose: () => void;
}

const ShowDetail = ({ productId, open, onClose }: ShowDetailProps) => {

  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetail | null>(null);

  const { user } = useAuthForm();
  const canEditPrice = user && [UserRole.SUPER, UserRole.ADMIN, UserRole.AUXILIAR].includes(user.role as any);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempRetailPrice, setTempRetailPrice] = useState<string>("");
  const [tempWholesalePrice, setTempWholesalePrice] = useState<string>("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const product = await productDetail(productId);
        setProduct(product);
        if (product) {
          setTempRetailPrice(product.retailPrice?.toString() || "0");
          setTempWholesalePrice(product.wholesalePrice?.toString() || "0");
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  const handleSavePrices = async () => {
    if (!product) return;
    
    const retail = parseFloat(tempRetailPrice);
    const wholesale = parseFloat(tempWholesalePrice);

    if (isNaN(retail) || retail < 0) {
      toast.error("El precio al detal debe ser un número válido mayor o igual a 0");
      return;
    }

    if (isNaN(wholesale) || wholesale < 0) {
      toast.error("El precio al mayor debe ser un número válido mayor o igual a 0");
      return;
    }

    setIsSaving(true);
    try {
      const updatedProduct = await updateProductPrice(productId, retail, wholesale);
      setProduct(updatedProduct);
      toast.success("Precios actualizados exitosamente");
      setIsEditing(false);
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.message || "Error al actualizar los precios";
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl w-full max-h-[calc(100vh-10rem)]">
        <DialogHeader>
          <DialogTitle asChild>
            <div className="flex gap-2 items-center">
              <span>{product?.name || 'Producto'}</span>
              <Badge
                className={cn("", product?.avaliableCount && product?.avaliableCount > 0 ? 'bg-green-500/20 text-green-500 border-green-300' : 'bg-red-500/20 text-red-500 border-red-300')}
              >
                {
                  product?.avaliableCount && product?.avaliableCount > 0 ? 'Disponible' : 'No disponible'
                }
              </Badge>
            </div>

          </DialogTitle>
          <DialogDescription>Código: {product?.refCode || '---'}</DialogDescription>
        </DialogHeader>
        <Card className="p-4">
          <div className="flex gap-4 w-full">
            <Card className="p-4 w-full">
              <div className="flex gap-2">
                <div className="flex gap-2">
                  <div className="w-16 h-16 bg-muted flex justify-center items-center rounded-lg">
                    <Package />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-muted-foreground text-sm">Cantidad disponible:</p>
                    <div className="flex gap-2 items-center">
                      <p className="font-bold text-2xl">{product?.avaliableCount || 0}</p>
                      <span className="text-sm text-muted-foreground">{product?.inputProduct?.measureUnit || 'UND'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4 w-full relative">
              {canEditPrice && !isEditing && product && (
                <button
                  onClick={() => {
                    setTempRetailPrice(product.retailPrice?.toString() || "0");
                    setTempWholesalePrice(product.wholesalePrice?.toString() || "0");
                    setIsEditing(true);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Editar precios"
                >
                  <Pencil size={16} />
                </button>
              )}
              <div className="flex gap-2">
                <div className="flex gap-2 w-full">
                  <div className="w-16 h-16 bg-muted flex justify-center items-center rounded-lg shrink-0">
                    <DollarSign />
                  </div>
                  <div className="flex flex-col w-full">
                    <p className="text-muted-foreground text-sm font-medium mb-1">Precio de venta:</p>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 w-full mt-1">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Al detal ($):</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={tempRetailPrice}
                            onChange={(e) => setTempRetailPrice(e.target.value)}
                            disabled={isSaving}
                            className="w-full px-2 py-1 text-sm bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Al mayor ($):</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={tempWholesalePrice}
                            onChange={(e) => setTempWholesalePrice(e.target.value)}
                            disabled={isSaving}
                            className="w-full px-2 py-1 text-sm bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleSavePrices}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-md transition-colors w-full"
                          >
                            {isSaving ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <Check size={14} />
                            )}
                            Guardar
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 disabled:opacity-50 rounded-md transition-colors w-full"
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <p className="text-sm">Al detal: {formatPrice({ price: product?.retailPrice || 0, country: { currency: 'USD', locale: 'en-US' } })}</p>
                        <p className="text-sm">Al mayor: {formatPrice({ price: product?.wholesalePrice || 0, country: { currency: 'USD', locale: 'en-US' } })}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

export default ShowDetail
