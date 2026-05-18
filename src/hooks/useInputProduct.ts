import { useQuery } from "@tanstack/react-query";
import { getAllInputProducts } from "@/actions/input-product.action";

interface UseInputProductsProps {
  limit?: number;
  offset?: number;
  search?: string;
}

export const useInputProducts = ({ limit = 10, offset = 0, search = "" }: UseInputProductsProps) => {

  const getInputProductsQuery = useQuery({
    queryKey: ["input-products", limit, offset, search],
    queryFn: () => getAllInputProducts({ limit, offset, search }),
  });

  return {
    getInputProductsQuery,
  }
};
