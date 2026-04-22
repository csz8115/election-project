import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useCompanies } from "../hooks/useCompanies";
import { useCompanyStats } from "../hooks/useCompanyStats";
import { useUserStore } from "../store/userStore";

type Company = {
  companyID?: number;
  companyName?: string;
};

function metricValue(value: unknown): string {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "N/A";
  return numberValue.toLocaleString(undefined, {
    maximumFractionDigits: Number.isInteger(numberValue) ? 0 : 2,
  });
}

export default function CompanyStats() {
  const user = useUserStore((state) => state);
  const companiesQuery = useCompanies();

  const [selectedCompanyID, setSelectedCompanyID] = React.useState<number>(user.companyID || 0);

  React.useEffect(() => {
    if (selectedCompanyID > 0) return;
    if (user.companyID && user.companyID > 0) {
      setSelectedCompanyID(user.companyID);
      return;
    }
    const firstCompanyID = (companiesQuery.data?.[0] as Company | undefined)?.companyID;
    if (firstCompanyID && firstCompanyID > 0) {
      setSelectedCompanyID(firstCompanyID);
    }
  }, [user.companyID, companiesQuery.data, selectedCompanyID]);

  const statsQuery = useCompanyStats(selectedCompanyID);

  const activeCount = Number(statsQuery.data?.active_ballots?.count ?? 0);
  const inactiveCount = Number(statsQuery.data?.inactive_ballots?.count ?? 0);
  const totalMembers = statsQuery.data?.total_members;
  const totalVotes = statsQuery.data?.total_votes;
  const avgVotesPerBallot = statsQuery.data?.avg_votes_per_ballot;
  const avgInitiativeVotesPerBallot = statsQuery.data?.avg_initiative_votes_per_ballot;

  const isLoading = companiesQuery.isLoading || statsQuery.isLoading;
  const hasError = companiesQuery.isError || statsQuery.isError;
  const errorMessage =
    (companiesQuery.error as Error | undefined)?.message ||
    (statsQuery.error as Error | undefined)?.message ||
    "Failed to load company stats.";

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        <Card className="border border-white/10 bg-slate-900/60">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-slate-100">Company Statistics</CardTitle>
            <p className="text-sm text-slate-300">
              View high-level election activity metrics for a selected company.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Company</label>
              <select
                className="h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-slate-100"
                value={selectedCompanyID || ""}
                onChange={(event) => setSelectedCompanyID(Number(event.target.value))}
                disabled={companiesQuery.isLoading || !companiesQuery.data?.length}
              >
                {!companiesQuery.data?.length ? (
                  <option value="">No companies available</option>
                ) : null}
                {(companiesQuery.data as Company[] | undefined)?.map((company) => (
                  <option key={company.companyID} value={company.companyID}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="border border-white/10 bg-slate-900/60">
            <CardContent className="py-10 text-slate-300">Loading company stats...</CardContent>
          </Card>
        ) : null}

        {hasError ? (
          <Card className="border border-red-900/40 bg-red-950/20">
            <CardContent className="py-10 text-red-200">{errorMessage}</CardContent>
          </Card>
        ) : null}

        {!isLoading && !hasError && !statsQuery.data ? (
          <Card className="border border-white/10 bg-slate-900/60">
            <CardContent className="py-10 text-slate-300">No stats available for this company.</CardContent>
          </Card>
        ) : null}

        {!isLoading && !hasError && statsQuery.data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Total Members</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(totalMembers)}</CardContent>
              </Card>

              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Active Ballots</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(activeCount)}</CardContent>
              </Card>

              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Inactive Ballots</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(inactiveCount)}</CardContent>
              </Card>

              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Total Votes</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(totalVotes)}</CardContent>
              </Card>

              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Avg Votes Per Ballot</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(avgVotesPerBallot)}</CardContent>
              </Card>

              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Avg Initiative Votes Per Ballot</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(avgInitiativeVotesPerBallot)}</CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader>
                  <CardTitle className="text-slate-100">Active Ballot List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activeCount === 0 ? (
                    <p className="text-sm text-slate-300">No active ballots.</p>
                  ) : (
                    statsQuery.data?.active_ballots?.ballots?.map((ballot: any) => (
                      <div key={ballot.ballotID} className="rounded-md border border-white/10 bg-black/20 p-3">
                        <p className="text-slate-100 font-medium">{ballot.ballotName}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(ballot.startDate).toLocaleString()} - {new Date(ballot.endDate).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader>
                  <CardTitle className="text-slate-100">Inactive Ballot List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {inactiveCount === 0 ? (
                    <p className="text-sm text-slate-300">No inactive ballots.</p>
                  ) : (
                    statsQuery.data?.inactive_ballots?.ballots?.map((ballot: any) => (
                      <div key={ballot.ballotID} className="rounded-md border border-white/10 bg-black/20 p-3">
                        <p className="text-slate-100 font-medium">{ballot.ballotName}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(ballot.startDate).toLocaleString()} - {new Date(ballot.endDate).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
