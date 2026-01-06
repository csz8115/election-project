import { useQuery } from "@tanstack/react-query";

interface UserBallotsResponse {
  ballots: any[];
  totalCount: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

type Params = {
  userId: number;
  pageParam: number;
  limit?: number;
  q?: string;
  status?: "open" | "closed" | "all";
  sortBy?: "startDate" | "endDate" | "ballotName" | "votes";
  sortDir?: "asc" | "desc";
};

export function useUserBallots({
  userId,
  pageParam,
  limit = 40,
  q = "",
  status = "all",
  sortBy = "startDate",
  sortDir = "asc",
}: Params) {
  return useQuery<UserBallotsResponse>({
    queryKey: ["userBallots", userId, pageParam, limit, q, status, sortBy, sortDir],
    queryFn: async () => {
      const url = new URL(`${import.meta.env.VITE_API_URL}api/v1/member/getBallots`);
      url.searchParams.set("userId", String(userId));
      url.searchParams.set("page", String(pageParam));
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("q", q);
      url.searchParams.set("status", status);
      url.searchParams.set("sortBy", sortBy);
      url.searchParams.set("sortDir", sortDir);

      const res = await fetch(url.toString(), { credentials: "include" });

      // IMPORTANT: don’t “retry forever” on 404/no results
      if (res.status === 404) {
        return { ballots: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
      }

      if (!res.ok) throw new Error("Failed to load ballots");
      return res.json();
    },
    refetchOnWindowFocus: false,
    retry: (failureCount, err: any) => {
      // don’t retry on “not found” type situations; only retry a couple times on real network errors
      if (String(err?.message || "").toLowerCase().includes("404")) return false;
      return failureCount < 2;
    },
  });
}
