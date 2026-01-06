import { useQuery } from "@tanstack/react-query";

interface BallotsResponse {
    ballots: any;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: number;
    totalCount: number;
}

export function useAllBallots(pageParam: number = 0, q: string = "") {
  return useQuery<BallotsResponse>({
    queryKey: ['allBallots', pageParam, q],
    queryFn: async () => {
      const url = new URL(`${import.meta.env.VITE_API_URL}api/v1/employee/getBallots`);
      url.searchParams.append('page', pageParam.toString());
      url.searchParams.append('limit', '40');
      if (q.trim()) url.searchParams.set("q", q.trim());
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