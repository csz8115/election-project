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
  companyName?: string;
};

export function useUserBallots({
  userId,
  pageParam,
  limit = 40,
  q = "",
  status = "all",
  sortBy = "startDate",
  sortDir = "asc",
  companyName,
}: Params) {
  return useQuery<UserBallotsResponse>({
    queryKey: [
      "userBallots",
      userId,
      pageParam,
      limit,
      q,
      status,
      sortBy,
      sortDir,
      companyName ?? "",
    ],
    queryFn: async () => {
      const url = new URL(`${import.meta.env.VITE_API_URL}api/v1/member/getBallots`);

      url.searchParams.set("userId", String(userId));

      // ✅ don’t send "undefined"
      if (companyName && companyName.trim().length > 0) {
        url.searchParams.set("companyName", companyName);
      }

      url.searchParams.set("page", String(pageParam));
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("q", q);
      url.searchParams.set("status", status);
      url.searchParams.set("sortBy", sortBy);
      url.searchParams.set("sortDir", sortDir);

      const res = await fetch(url.toString(), { credentials: "include" });

      if (res.status === 404) {
        return { ballots: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
      }

      if (!res.ok) throw new Error("Failed to load ballots");
      return res.json();
    },

    // ✅ KEY FIX: keep previous results on screen while new query loads
    placeholderData: (prev) => prev,

    refetchOnWindowFocus: false,
    retry: (failureCount, err: any) => {
      if (String(err?.message || "").toLowerCase().includes("404")) return false;
      return failureCount < 2;
    },

    // optional: makes it refetch less aggressively
    staleTime: 10_000,
    gcTime: 5 * 60_000,
  });
}
