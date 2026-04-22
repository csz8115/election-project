import { useQuery } from "@tanstack/react-query";
import { getCompanyStats } from "../lib/form-actions";

export function useCompanyStats(companyID?: number) {
  return useQuery({
    queryKey: ["company-stats", companyID],
    queryFn: async () => {
      if (!companyID) {
        throw new Error("Missing company ID");
      }
      const result = await getCompanyStats(companyID);
      if (!result?.success) {
        throw new Error(result?.error ?? "Failed to fetch company stats");
      }
      return result.stats;
    },
    enabled: !!companyID && companyID > 0,
    refetchOnWindowFocus: false,
    retry: (failureCount) => failureCount < 2,
  });
}
