import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ballots } from "@prisma/client";

type UseBallotOptions = {
  enabled?: boolean;
  initialData?: ballots;
};

function unwrapBallot(json: any): any {
  // Handle many shapes, including nested wrappers (like your getBallot wrapper)
  return (
    json?.ballot?.ballot ??
    json?.ballot?.results?.ballot ??
    json?.ballot?.results ??
    json?.ballot ??
    json?.data ??
    json?.results?.ballot ??
    json?.results ??
    json
  );
}

async function fetchBallotById(ballotID: number): Promise<ballots> {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}api/v1/employee/getBallot?ballotID=${ballotID}`,
    { credentials: "include" }
  );

  const json: any = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.error || json?.message || `Failed to fetch ballot (HTTP ${res.status})`);
  }

  const b = unwrapBallot(json);

  if (!b || typeof b !== "object") {
    // eslint-disable-next-line no-console
    console.log("fetchBallotById unexpected payload:", json);
    throw new Error("Ballot not found (unexpected response shape).");
  }

  if (typeof (b as any).ballotID !== "number") {
    // eslint-disable-next-line no-console
    console.log("fetchBallotById missing ballotID, payload:", json);
    throw new Error("Invalid ballot payload (missing ballotID).");
  }

  return b as ballots;
}

export function useBallot(ballotID?: number, options: UseBallotOptions = {}) {
  const queryClient = useQueryClient();

  const enabled =
    options.enabled ??
    (typeof ballotID === "number" && Number.isFinite(ballotID) && ballotID > 0);

  const query = useQuery({
    queryKey: ["ballot", ballotID],
    enabled,
    initialData: options.initialData,

    queryFn: async () => {
      if (!ballotID) throw new Error("Missing ballotID");
      return fetchBallotById(ballotID);
    },

    // ✅ prevents “error cache” from making 2nd open instantly fail
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,

    retry: 2,
    staleTime: 2_000,
  });

  const refreshBallot = async () => {
    if (!ballotID) return;
    await queryClient.invalidateQueries({ queryKey: ["ballot", ballotID] });
  };

  return { ...query, refreshBallot };
}
