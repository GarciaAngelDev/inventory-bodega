import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "@/actions/categories.action";

interface UseCategoriesProps {
  limit?: number;
  offset?: number;
  query?: string;
}

export const useCategories = ({ limit = 10, offset = 0, query = "" }: UseCategoriesProps) => {

  const getCategoriesQuery = useQuery({
    queryKey: ["categories", limit, offset, query],
    queryFn: () => getAllCategories({ limit, offset, query }),
  });

  return {
    getCategoriesQuery,
  }
};
