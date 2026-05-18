import { useQuery } from "@tanstack/react-query";
import { getAllProducers } from "@/actions/producer.action";

interface UseProducersProps {
  limit?: number;
  offset?: number;
  query?: string;
}

export const useProducers = ({ limit = 10, offset = 0, query = '' }: UseProducersProps) => {

  const getProducersQuery = useQuery({
    queryKey: ["producers", limit, offset, query],
    queryFn: () => getAllProducers({ limit, offset, query }),
  });

  return {
    getProducersQuery,
  }
};
