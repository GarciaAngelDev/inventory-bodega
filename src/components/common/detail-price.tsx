import { formatPrice } from "@/lib/format-price";
import { Product } from "@/types";
import { MeasureUnit } from "@/generated/prisma";
import { CreateSaleDetailData } from "@/types";
import { HTMLAttributes } from "react";

interface DetailPriceProps extends HTMLAttributes<HTMLSpanElement> {
  product: Product;
  detail: CreateSaleDetailData;
  saleType: "retail" | "wholesale"
}

const DetailPrice = ({ product, detail, saleType, ...props }: DetailPriceProps) => {
  return (
    <span {...props}>
      {
        formatPrice({
          price: product.inputProduct
            ? product.inputProduct.measureUnit === MeasureUnit.G || product.inputProduct.measureUnit === MeasureUnit.ML
              ? saleType === "retail" ? detail.retailPrice * (detail.measureUnitValue! / 1000) : detail.wholesalePrice * (detail.measureUnitValue! / 1000)
              : saleType === "retail" ? detail.retailPrice * detail.measureUnitValue! : detail.wholesalePrice * detail.measureUnitValue!
            : saleType === "retail" ? detail.retailPrice * detail.quantity! : detail.wholesalePrice * detail.quantity!,
          country: { currency: "USD", locale: "en-US" }
        })
      }
    </span>
  );
};

export default DetailPrice;
