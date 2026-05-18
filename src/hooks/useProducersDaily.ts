import { useQuery } from "@tanstack/react-query";
import { getProducersDaily } from "@/actions/producer.action";

export const useProducersDaily = () => {

  const getProducersDailyQuery = useQuery({
    queryKey: ["producers-daily"],
    queryFn: () => getProducersDaily(),
  });

  return {
    getProducersDailyQuery,
  }
};
