import { useQuery } from "@tanstack/react-query";

type SortBy = "startDate" | "endDate" | "ballotName" | "votes";
type SortDir = "asc" | "desc";
type Status = "open" | "closed" | "all";

export interface UseBallotIdsParams {
  q?: string;
  sortBy?: SortBy;
  sortDir?: SortDir;
  status?: Status;
  companies?: Set<number> | number[];
  enabled?: boolean; // let UI control when it runs
}

export interface BallotIdsResponse {
  ballots: number[]; // <-- IDs only (recommended). If your API returns objects, see note below.
  totalCount?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  nextCursor?: number | null;
}

function normalizeCompanyIds(companies?: Set<number> | number[]) {
  const ids = Array.isArray(companies)
    ? companies.slice()
    : companies
    ? Array.from(companies)
    : [];
  ids.sort((a, b) => a - b);
  return ids;
}

export function useBallotIds(params: UseBallotIdsParams) {
  const {
    q = "",
    sortBy = "startDate",
    sortDir = "asc",
    status = "all",
    companies,
    enabled = false, // default false so it only runs when you click "Select All"
  } = params;

  const companyIds = normalizeCompanyIds(companies);
  const companyKey = companyIds.length ? companyIds.join(",") : "all";

  return useQuery<BallotIdsResponse>({
    queryKey: ["ballotIds", q.trim(), sortBy, sortDir, status, companyKey],
    enabled,
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}api/v1/employee/getBallotIDs`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          q: q.trim() || undefined,
          sortBy,
          sortDir,
          status,
          companies: companyIds.length ? companyIds : undefined,
        }),
      });

      if (res.status === 404 || res.status === 204) {
        return { ballots: [], totalCount: 0 };
      }

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();

      /**
       * Your route currently returns:
       * { ballots: ballots.ballots, nextCursor, hasNextPage, ... }
       *
       * Make sure "ballots" is an array of NUMBER ids.
       * If db.getBallotIDs returns objects like { id: number }, map them:
       *
       * const ids = Array.isArray(data.ballots) ? data.ballots.map((b:any)=> b.id) : [];
       * return { ...data, ballots: ids };
       */

      return data;
    },
    refetchOnWindowFocus: false,
    retry: (failureCount) => failureCount < 1,
    staleTime: 60_000, // optional: cache for 1 min
  });
}
