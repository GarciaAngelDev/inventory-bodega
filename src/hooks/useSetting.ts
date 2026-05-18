import { getSetting } from "@/actions/setting.action";
import { useQuery } from "@tanstack/react-query";

export const useSetting = () => {
  const getSettingQuery = useQuery({
    queryKey: ["setting"],
    queryFn: () => getSetting(),
  });

  return {
    getSettingQuery,
  }
};
