import { useQuery } from "@tanstack/react-query";
import { getAllInventary } from "@/actions/inventary.action";
import { DateRange } from "react-day-picker";

interface UseInventaryProps {
  limit?: number;
  offset?: number;
  query?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const useInventary = ({ limit = 10, offset = 0, query = '', dateFrom, dateTo }: UseInventaryProps) => {

  const getInventaryQuery = useQuery({
    queryKey: ["inventaries", limit, offset, query, dateFrom, dateTo],
    queryFn: () => getAllInventary({ limit, offset, query, dateFrom, dateTo }),
  });

  return {
    getInventaryQuery,
  }
};
