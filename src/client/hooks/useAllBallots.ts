import { useQuery } from "@tanstack/react-query";

interface BallotsResponse {
  ballots: any;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor: number;
  totalCount: number;
}

type useAllBallotsParams = {
  pageParam?: number;
  q?: string;
  sortBy?: "startDate" | "endDate" | "ballotName" | "votes";
  sortDir?: "asc" | "desc";
  status?: "open" | "closed" | "all";
};

export function useAllBallots(useAllBallotsParams: useAllBallotsParams) {
  const { pageParam = 0, q = "", sortBy = "startDate", sortDir = "asc", status = "all" } = useAllBallotsParams;
  return useQuery<BallotsResponse>({
    queryKey: ['allBallots', pageParam, q, sortBy, sortDir, status],
    queryFn: async () => {
      const url = new URL(`${import.meta.env.VITE_API_URL}api/v1/employee/getBallots`);
      url.searchParams.append('page', pageParam.toString());
      url.searchParams.append('limit', '40');
      if (q.trim()) url.searchParams.set("q", q.trim());
      url.searchParams.set("sortBy", sortBy);
      url.searchParams.set("sortDir", sortDir);
      url.searchParams.set("status", status);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev
  });
}