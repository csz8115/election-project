import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { company as CompanyModel } from "@prisma/client";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import SelectCompany from "../components/createBallot/selectCompany";
import { useCompanies } from "../hooks/useCompanies";
import { useCompanyStats } from "../hooks/useCompanyStats";
import { useUserStore } from "../store/userStore";
import SearchInput from "../components/searchInput";

type Company = {
  companyID?: number;
  companyName?: string;
};

type BallotStat = {
  ballotID: number;
  ballotName: string;
  description?: string;
  startDate: string;
  endDate: string;
  voteCount?: number;
  status?: "active" | "closed";
};

type CompanyStatsData = {
  active_ballots?: { count?: number; ballots?: BallotStat[] };
  inactive_ballots?: { count?: number; ballots?: BallotStat[] };
  total_members?: number;
  total_votes?: number;
  avg_votes_per_ballot?: number;
  avg_initiative_votes_per_ballot?: number;
  ballot_vote_ranking?: BallotStat[];
  vote_trend?: Array<{ date: string; totalVotes: number }>;
};

function metricValue(value: unknown): string {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "N/A";
  return numberValue.toLocaleString(undefined, {
    maximumFractionDigits: Number.isInteger(numberValue) ? 0 : 2,
  });
}

function HorizontalBallotBarChart({ data }: { data: BallotStat[] }) {
  const top = [...data].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0)).slice(0, 8);
  if (top.length === 0) {
    return <p className="text-sm text-slate-300">No vote data available.</p>;
  }

  const maxVotes = Math.max(...top.map((item) => item.voteCount ?? 0), 1);
  const width = 700;
  const leftPad = 220;
  const rightPad = 32;
  const topPad = 20;
  const rowHeight = 36;
  const innerBarHeight = 18;
  const height = topPad + top.length * rowHeight + 20;
  const plotWidth = width - leftPad - rightPad;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {top.map((item, index) => {
          const votes = item.voteCount ?? 0;
          const barWidth = (votes / maxVotes) * plotWidth;
          const y = topPad + index * rowHeight;
          return (
            <g key={item.ballotID} transform={`translate(0, ${y})`}>
              <text x={8} y={innerBarHeight} fill="#cbd5e1" fontSize="12">
                {item.ballotName.length > 28 ? `${item.ballotName.slice(0, 28)}...` : item.ballotName}
              </text>
              <rect x={leftPad} y={0} width={plotWidth} height={innerBarHeight} fill="#0f172a" rx={4} />
              <rect x={leftPad} y={0} width={Math.max(2, barWidth)} height={innerBarHeight} fill="#38bdf8" rx={4} />
              <text x={leftPad + barWidth + 8} y={innerBarHeight} fill="#e2e8f0" fontSize="12">
                {votes}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function VoteTrendLineChart({ trend }: { trend: Array<{ date: string; totalVotes: number }> }) {
  if (!trend.length) {
    return <p className="text-sm text-slate-300">No trend data available.</p>;
  }

  const width = 700;
  const height = 280;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 42;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const maxVotes = Math.max(...trend.map((row) => row.totalVotes), 1);

  const points = trend.map((row, index) => {
    const x = padLeft + (trend.length === 1 ? innerWidth / 2 : (index / (trend.length - 1)) * innerWidth);
    const y = padTop + innerHeight - (row.totalVotes / maxVotes) * innerHeight;
    return { ...row, x, y };
  });

  const path = points
    .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[0, 1, 2, 3, 4].map((tick) => {
          const y = padTop + (tick / 4) * innerHeight;
          const value = Math.round(maxVotes * (1 - tick / 4));
          return (
            <g key={tick}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#1e293b" strokeWidth={1} />
              <text x={8} y={y + 4} fontSize="11" fill="#94a3b8">
                {value}
              </text>
            </g>
          );
        })}

        <path d={path} fill="none" stroke="#38bdf8" strokeWidth={2.5} />
        {points.map((pt) => (
          <circle key={pt.date} cx={pt.x} cy={pt.y} r={3.5} fill="#f472b6" />
        ))}

        {points.filter((_, idx) => idx === 0 || idx === points.length - 1 || idx % 2 === 0).map((pt) => (
          <text key={`${pt.date}-label`} x={pt.x} y={height - 14} textAnchor="middle" fontSize="11" fill="#94a3b8">
            {new Date(pt.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </text>
        ))}
      </svg>
    </div>
  );
}

function BallotCard({ ballot, companyIdContext }: { ballot: BallotStat; companyIdContext?: number }) {
  const navigate = useNavigate();
  const isClosed = ballot.status === "closed" || new Date(ballot.endDate) < new Date();
  const statusLabel = isClosed ? "Closed" : "Active";

  const navigateToBallot = () => {
    const sp = new URLSearchParams();
    sp.set("b", String(ballot.ballotID));
    if (companyIdContext && companyIdContext > 0) {
      sp.set("from", "company-stats");
      sp.set("companyId", String(companyIdContext));
    }
    navigate(`/ballot?${sp.toString()}`);
  };

  return (
    <Card
      className="border border-white/10 bg-slate-900/60 cursor-pointer hover:bg-slate-900/80 transition-colors"
      onClick={navigateToBallot}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigateToBallot();
        }
      }}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base text-slate-100 leading-snug">{ballot.ballotName}</CardTitle>
          <span
            className={[
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              isClosed ? "bg-slate-700 text-slate-100" : "bg-emerald-700 text-emerald-100",
            ].join(" ")}
          >
            {statusLabel}
          </span>
        </div>
        {ballot.description ? (
          <p className="text-sm text-slate-400 line-clamp-2">{ballot.description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p className="text-slate-300">
          Start: <span className="text-slate-100">{new Date(ballot.startDate).toLocaleString()}</span>
        </p>
        <p className="text-slate-300">
          End: <span className="text-slate-100">{new Date(ballot.endDate).toLocaleString()}</span>
        </p>
        <p className="text-slate-300">
          Votes: <span className="text-slate-100">{metricValue(ballot.voteCount ?? 0)}</span>
        </p>
      </CardContent>
    </Card>
  );
}

export default function CompanyStats() {
  const user = useUserStore((state) => state);
  const companiesQuery = useCompanies();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const companyIdFromUrlRaw = Number(searchParams.get("companyId"));
  const companyIdFromUrl = Number.isFinite(companyIdFromUrlRaw) && companyIdFromUrlRaw > 0 ? companyIdFromUrlRaw : undefined;

  const selectedCompanyID = companyIdFromUrl ?? 0;
  const [ballotQuery, setBallotQuery] = React.useState("");
  const [ballotScope, setBallotScope] = React.useState<"all" | "active" | "inactive">("all");

  const companyOptions = React.useMemo<CompanyModel[]>(
    () =>
      ((companiesQuery.data as Company[] | undefined) ?? [])
        .filter((company): company is Required<Pick<Company, "companyID">> & Company => {
          return Number.isFinite(company.companyID) && (company.companyID ?? 0) > 0;
        })
        .map((company) => ({
          companyID: company.companyID!,
          companyName: company.companyName ?? `Company #${company.companyID}`,
          abbreviation: null,
          category: null,
        })),
    [companiesQuery.data],
  );

  const setCompanyIdInUrl = React.useCallback(
    (companyID: number) => {
      if (!Number.isFinite(companyID) || companyID <= 0) return;
      if (companyIdFromUrl === companyID) return;

      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("companyId", String(companyID));
      setSearchParams(nextParams, { replace: true });
    },
    [companyIdFromUrl, searchParams, setSearchParams],
  );

  React.useEffect(() => {
    const companyList = companyOptions;
    if (!companyList.length) return;

    const validCompanyIds = companyList
      .map((company) => company.companyID)
      .filter((id): id is number => Number.isFinite(id) && id > 0);

    if (validCompanyIds.length === 0) return;

    if (companyIdFromUrl && validCompanyIds.includes(companyIdFromUrl)) {
      return;
    }

    const preferred =
      user.companyID && validCompanyIds.includes(user.companyID) ? user.companyID : validCompanyIds[0];
    setCompanyIdInUrl(preferred);
  }, [companyOptions, companyIdFromUrl, setCompanyIdInUrl, user.companyID]);

  const selectedCompanySet = React.useMemo(
    () => (selectedCompanyID > 0 ? new Set<number>([selectedCompanyID]) : new Set<number>()),
    [selectedCompanyID],
  );

  const setSelectedCompanySet = React.useCallback(
    (update: React.SetStateAction<Set<number>>) => {
      const nextSet =
        typeof update === "function"
          ? (update as (prev: Set<number>) => Set<number>)(selectedCompanySet)
          : update;
      const first = nextSet.values().next().value;
      if (typeof first === "number" && first > 0) {
        setCompanyIdInUrl(first);
      }
    },
    [selectedCompanySet, setCompanyIdInUrl],
  );

  const handleBackToPreviousOrDashboard = React.useCallback(() => {
    const historyIdx =
      typeof window !== "undefined" && typeof window.history?.state?.idx === "number"
        ? window.history.state.idx
        : 0;

    if (historyIdx > 0) {
      navigate(-1);
      return;
    }

    navigate("/dashboard", { replace: true });
  }, [navigate]);

  const statsQuery = useCompanyStats(selectedCompanyID);
  const stats = (statsQuery.data ?? null) as CompanyStatsData | null;

  const activeBallots = stats?.active_ballots?.ballots ?? [];
  const inactiveBallots = stats?.inactive_ballots?.ballots ?? [];
  const normalizedBallotQuery = ballotQuery.trim().toLowerCase();
  const filterBallotBySearch = (ballot: BallotStat) =>
    !normalizedBallotQuery ||
    ballot.ballotName.toLowerCase().includes(normalizedBallotQuery) ||
    (ballot.description ?? "").toLowerCase().includes(normalizedBallotQuery);

  const filteredActive = activeBallots.filter(filterBallotBySearch);
  const filteredInactive = inactiveBallots.filter(filterBallotBySearch);

  const rankingData = (stats?.ballot_vote_ranking ?? []).filter(filterBallotBySearch);
  const trendData = stats?.vote_trend ?? [];

  const showActiveSection = ballotScope === "all" || ballotScope === "active";
  const showInactiveSection = ballotScope === "all" || ballotScope === "inactive";

  const waitingForInitialCompanySelection =
    !selectedCompanyID && !companiesQuery.isLoading && ((companiesQuery.data?.length ?? 0) > 0);
  const isLoading = companiesQuery.isLoading || statsQuery.isLoading || waitingForInitialCompanySelection;
  const hasError = companiesQuery.isError || statsQuery.isError;
  const errorMessage =
    (companiesQuery.error as Error | undefined)?.message ||
    (statsQuery.error as Error | undefined)?.message ||
    "Failed to load company stats.";

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 space-y-6">
        <Card className="border border-white/10 bg-slate-900/60">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-2xl text-slate-100">Company Statistics</CardTitle>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
                onClick={handleBackToPreviousOrDashboard}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
            <p className="text-sm text-slate-400">Analyze company participation and ballot engagement.</p>
          </CardHeader>
          <CardContent>
            <SelectCompany
              companiesData={companyOptions}
              companiesIsLoading={companiesQuery.isLoading}
              companiesIsError={companiesQuery.isError}
              selectedCompanies={selectedCompanySet}
              setSelectedCompanies={setSelectedCompanySet}
              label="Company"
              description="Select the company this dashboard is showing"
              placeholder="Select a company"
            />
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

        {!isLoading && !hasError && !stats ? (
          <Card className="border border-white/10 bg-slate-900/60">
            <CardContent className="py-10 text-slate-300">No stats available for this company.</CardContent>
          </Card>
        ) : null}

        {!isLoading && !hasError && stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Total Members</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(stats.total_members)}</CardContent>
              </Card>
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Active Ballots</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(stats.active_ballots?.count ?? 0)}</CardContent>
              </Card>
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Inactive Ballots</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(stats.inactive_ballots?.count ?? 0)}</CardContent>
              </Card>
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Total Votes</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(stats.total_votes)}</CardContent>
              </Card>
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Avg Votes / Ballot</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(stats.avg_votes_per_ballot)}</CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader>
                  <CardTitle className="text-slate-100">Votes by Ballot (Ranked)</CardTitle>
                </CardHeader>
                <CardContent>
                  <HorizontalBallotBarChart data={rankingData} />
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader>
                  <CardTitle className="text-slate-100">Vote Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <VoteTrendLineChart trend={trendData} />
                  <p className="mt-3 text-xs text-slate-500">
                    Trend uses ballot start date buckets because vote timestamps are not stored in current schema.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-white/10 bg-slate-900/60">
              <CardHeader className="space-y-3">
                <CardTitle className="text-slate-100">Ballot Discovery</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <SearchInput
                    value={ballotQuery}
                    onChange={(e) => setBallotQuery(e.target.value)}
                    placeholder="Search ballots by name or description..."
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={ballotScope === "all" ? "default" : "outline"}
                      className={ballotScope === "all" ? "bg-white/15 text-slate-100" : "border-white/10 bg-white/5 text-slate-300"}
                      onClick={() => setBallotScope("all")}
                    >
                      All
                    </Button>
                    <Button
                      type="button"
                      variant={ballotScope === "active" ? "default" : "outline"}
                      className={ballotScope === "active" ? "bg-white/15 text-slate-100" : "border-white/10 bg-white/5 text-slate-300"}
                      onClick={() => setBallotScope("active")}
                    >
                      Active
                    </Button>
                    <Button
                      type="button"
                      variant={ballotScope === "inactive" ? "default" : "outline"}
                      className={ballotScope === "inactive" ? "bg-white/15 text-slate-100" : "border-white/10 bg-white/5 text-slate-300"}
                      onClick={() => setBallotScope("inactive")}
                    >
                      Inactive
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {showActiveSection ? (
                  <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-100">Active Ballots</h3>
                    {filteredActive.length === 0 ? (
                      <p className="text-sm text-slate-300">
                        {normalizedBallotQuery ? "No active ballots match your search." : "No active ballots."}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredActive.map((ballot) => (
                          <BallotCard
                            key={`active-${ballot.ballotID}`}
                            ballot={ballot}
                            companyIdContext={selectedCompanyID}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ) : null}

                {showInactiveSection ? (
                  <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-100">Inactive Ballots</h3>
                    {filteredInactive.length === 0 ? (
                      <p className="text-sm text-slate-300">
                        {normalizedBallotQuery ? "No inactive ballots match your search." : "No inactive ballots."}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredInactive.map((ballot) => (
                          <BallotCard
                            key={`inactive-${ballot.ballotID}`}
                            ballot={ballot}
                            companyIdContext={selectedCompanyID}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
