import { useSession } from "next-auth/react";
import { useQuery } from "react-query";

import { DataProps } from "../types/data.types";
import { fetchUsers } from "../services/actions/getUsers";

export const useDashboardData = () => {
   const { data: session } = useSession();
   // @ts-ignore
   const userId = session?.user?.id;

   const { data, isLoading, error } = useQuery<DataProps>(
      ["users", userId],
      () => fetchUsers(userId),
      {
         enabled: !!userId,
      }
   );

   return {
      name: data?.name,
      isLoading,
      error,
   };
};
