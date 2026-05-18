"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { productDetail } from "@/actions/products.action";
import { Category, InputProduct, ProductCharacteristics } from "@/types";
import { InventaryItem } from "@/generated/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DollarSign, Package } from "lucide-react";
import { formatPrice } from "@/lib/format-price";

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const product = await productDetail(productId);
        setProduct(product);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [])

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
            <Card className="p-4 w-full">
              <div className="flex gap-2">
                <div className="flex gap-2">
                  <div className="w-16 h-16 bg-muted flex justify-center items-center rounded-lg">
                    <DollarSign />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-muted-foreground text-sm">Precio de venta:</p>
                    <div className="flex flex-col">
                      <p className="text-sm">Al detal: {formatPrice({ price: product?.retailPrice || 0, country: { currency: 'USD', locale: 'en-US' } })}</p>
                      <p className="text-sm">Al mayor: {formatPrice({ price: product?.wholesalePrice || 0, country: { currency: 'USD', locale: 'en-US' } })}</p>
                    </div>
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
