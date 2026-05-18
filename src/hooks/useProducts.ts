import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "@/actions/products.action";

interface UseProductsProps {
  limit?: number;
  offset?: number;
  query?: string;
  type?: string;
}

export const useProducts = ({ limit = 10, offset = 0, query = '', type = '' }: UseProductsProps) => {
  
  const getProductsQuery = useQuery({
    queryKey: ["products", limit, offset, query, type],
    queryFn: () => getAllProducts({ limit, offset, query, type }),
  });

  return {
    getProductsQuery,
  }
};
