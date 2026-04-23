import { useQuery } from "@tanstack/react-query";
import { getSystemReport } from "../lib/form-actions";

export function useSystemStats() {
  return useQuery({
    queryKey: ["system-stats"],
    queryFn: async () => {
      const result = await getSystemReport();
      if (!result?.success) {
        throw new Error(result?.error ?? "Failed to fetch system stats");
      }
      return result.report;
    },
    refetchOnWindowFocus: false,
    retry: (failureCount) => failureCount < 2,
  });
}
