import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

interface BallotsResponse {
    ballots: any;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: number;
    totalCount: number;
    data: any[];
}

export function useAllBallots(pageParam: number = 0) {
  return useQuery<BallotsResponse>({
    queryKey: ['allBallots', pageParam],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/v1/employee/getBallots?page=${pageParam}&limit=40`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });
}

