import { useQuery } from "@tanstack/react-query";
import { getAllCriticalProducts } from "@/actions/products.action";

interface UseCriticalProductsProps {
  limit?: number;
  offset?: number;
  query?: string;
}

export const useCriticalProducts = ({ limit = 10, offset = 0, query = '' }: UseCriticalProductsProps) => {

  const getCriticalProductsQuery = useQuery({
    queryKey: ["critical-products", limit, offset, query],
    queryFn: () => getAllCriticalProducts({ limit, offset, query }),
  });

  return {
    getCriticalProductsQuery,
  }
};
