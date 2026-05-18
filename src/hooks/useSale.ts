import { useQuery } from "@tanstack/react-query";
import { getAllSales, getSalesByUser } from "@/actions/sales.action";

interface UseSalesProps {
  limit?: number;
  offset?: number;
  query?: string;
}

export const useSales = ({ limit = 10, offset = 0, query = '' }: UseSalesProps) => {

  const getSalesQuery = useQuery({
    queryKey: ["sales", limit, offset, query],
    queryFn: () => getAllSales({ limit, offset, query }),
  });

  return {
    getSalesQuery,
  }
};
