import { useQuery } from "@tanstack/react-query";
import { getAllUsersAction } from "@/actions/user.action";

interface UseUsersProps {
  limit?: number;
  offset?: number;
  query?: string;
}

export const useUsers = ({ limit = 10, offset = 0, query = '' }: UseUsersProps) => {

  const getUsersQuery = useQuery({
    queryKey: ["users", limit, offset, query],
    queryFn: () => getAllUsersAction({ limit, offset, query }),
  });

  return {
    getUsersQuery,
  }
};
