import { useQuery } from "@tanstack/react-query";

type SortBy = "startDate" | "endDate" | "ballotName" | "votes";
type SortDir = "asc" | "desc";
type Status = "open" | "closed" | "all";

export interface UseAllBallotsParams {
  pageParam?: number;
  q?: string;
  sortBy?: SortBy;
  sortDir?: SortDir;
  status?: Status;

  // Accept either a Set (your UI) or a plain array
  companies?: Set<number> | number[];
}

interface BallotsResponse {
  ballots: any[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor: number;
}

export function useAllBallots(params: UseAllBallotsParams) {
  const {
    pageParam = 0,
    q = "",
    sortBy = "startDate",
    sortDir = "asc",
    status = "all",
    companies,
  } = params;

  // Normalize companies to a stable, sorted array (important for queryKey stability)
  const companyIds = Array.isArray(companies)
    ? companies
    : companies
    ? Array.from(companies)
    : [];

  companyIds.sort((a, b) => a - b);

  // Stable cache key: join to avoid referential identity problems
  const companyKey = companyIds.length ? companyIds.join(",") : "all";

  return useQuery<BallotsResponse>({
    queryKey: ["allBallots", pageParam, q.trim(), sortBy, sortDir, status, companyKey],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}api/v1/employee/getBallots`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // keep if you use cookies/auth
        body: JSON.stringify({
          page: pageParam,
          limit: 40,
          q: q.trim() || undefined,
          sortBy,
          sortDir,
          status,
          companies: companyIds.length ? companyIds : undefined,
        }),
      });

      // Optional: treat 404/204 as "no results" instead of throwing (prevents retry spam)
      if (res.status === 404 || res.status === 204) {
        return {
          ballots: [],
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          nextCursor: pageParam,
        };
      }

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      return res.json();
    },

    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,

    // Optional: stop React Query from retrying on “no results” type statuses
    retry: (failureCount, err) => {
      // keep retries minimal for real errors
      return failureCount < 1;
    },
  });
}
