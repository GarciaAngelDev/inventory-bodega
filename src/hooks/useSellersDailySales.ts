import { useQuery } from "@tanstack/react-query";
import { getSellersDailySales } from "@/actions/sales.action";

export const useSellersDailySales = (limit = 10, offset = 0) => {

  const getSalesDailyQuery = useQuery({
    queryKey: ["sales-daily", limit, offset],
    queryFn: () => getSellersDailySales(limit, offset),
  });

  return {
    getSalesDailyQuery,
  }
};
