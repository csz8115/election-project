import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import SearchInput from "../components/searchInput";
import { useSystemStats } from "../hooks/useSystemStats";
import { useAllBallots } from "../hooks/useAllBallots";
import { PulseLoader } from "react-spinners";
import { PaginationControls } from "../components/paginationControls";
import ElectionCard from "../components/dashboard/electionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import NoResultsCat from "../components/catErrors/noResultsCat";
import type { BallotCardData } from "../components/ballot/BallotCard";

type BallotStat = BallotCardData & { companyID?: number };

type SystemOverview = {
  total_companies?: number;
  total_users?: number;
  total_ballots?: number;
  active_ballots?: { count?: number; ballots?: BallotStat[] };
  inactive_ballots?: { count?: number; ballots?: BallotStat[] };
  total_votes?: number;
  total_initiative_votes?: number;
  avg_votes_per_ballot?: number;
  avg_initiative_votes_per_ballot?: number;
  ballot_vote_ranking?: BallotStat[];
  vote_trend?: Array<{ date: string; totalVotes: number }>;
};

type SystemReport = {
  dbStats?: {
    totalQueries?: number;
    averageQueryDurationMs?: number;
    slowestQueryDurationMs?: number;
    queryErrors?: number;
    queriesByOperation?: {
      findMany?: number;
      findUnique?: number;
      create?: number;
      update?: number;
      delete?: number;
      raw?: number;
    };
    slowestOperations?: Array<{
      model?: string;
      operation?: string;
      averageDurationMs?: number;
      count?: number;
    }>;
    recentSlowQueries?: Array<{
      model?: string;
      operation?: string;
      durationMs?: number;
      timestamp?: string;
    }>;
  };
  httpStats?: {
    totalRequests?: number;
    totalErrors?: number;
    totalResponseTime?: number;
    avgResponseTime?: number;
    maxResponseTime?: number;
  };
  systemOverview?: SystemOverview;
};

function metricValue(value: unknown): string {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "N/A";
  return numberValue.toLocaleString(undefined, {
    maximumFractionDigits: Number.isInteger(numberValue) ? 0 : 2,
  });
}

function metricMs(value: unknown): string {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "N/A";
  return `${numberValue.toFixed(numberValue >= 100 ? 0 : 2)} ms`;
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

function BallotStatusBarChart({ activeCount, inactiveCount }: { activeCount: number; inactiveCount: number }) {
  const total = activeCount + inactiveCount;
  if (total === 0) {
    return <p className="text-sm text-slate-300">No ballot status data available.</p>;
  }

  const activeWidth = (activeCount / total) * 100;
  const inactiveWidth = (inactiveCount / total) * 100;

  return (
    <div className="space-y-3">
      <div className="h-4 w-full rounded-full overflow-hidden bg-slate-800">
        <div className="h-full bg-emerald-500 float-left" style={{ width: `${activeWidth}%` }} />
        <div className="h-full bg-slate-500 float-left" style={{ width: `${inactiveWidth}%` }} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <p className="text-emerald-300">Active: {metricValue(activeCount)}</p>
        <p className="text-slate-300">Inactive: {metricValue(inactiveCount)}</p>
      </div>
    </div>
  );
}

function QueryOperationBarChart({
  data,
}: {
  data: Array<{ operation: string; count: number }>;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.map((row) => {
        const widthPercent = Math.max((row.count / max) * 100, row.count > 0 ? 4 : 0);
        return (
          <div key={row.operation} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{row.operation}</span>
              <span className="text-slate-100">{metricValue(row.count)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-sky-500" style={{ width: `${widthPercent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SystemStats() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);
  const [status, setStatus] = React.useState<"open" | "closed" | "all">("all");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = React.useState<"startDate" | "endDate" | "ballotName" | "votes">("startDate");

  const statsQuery = useSystemStats();
  const report = (statsQuery.data ?? null) as SystemReport | null;
  const stats = report?.systemOverview ?? null;
  const dbStats = report?.dbStats ?? null;
  const httpStats = report?.httpStats ?? null;

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 450);
    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    setPage(0);
  }, [debouncedQuery, status, sortBy, sortDir]);

  const ballotListQuery = useAllBallots({
    pageParam: page,
    q: debouncedQuery,
    sortBy,
    sortDir,
    status,
  });

  const totalCount = ballotListQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 40));

  React.useEffect(() => {
    if (page >= totalPages) setPage(totalPages - 1);
  }, [page, totalPages]);

  const ballotsList = ballotListQuery.data?.ballots ?? [];
  const hasBallotResults = ballotsList.length > 0;

  const rankingData = stats?.ballot_vote_ranking ?? [];
  const trendData = stats?.vote_trend ?? [];
  const operationCounts = dbStats?.queriesByOperation ?? {};
  const queryOperationChartData = [
    { operation: "findMany", count: Number(operationCounts.findMany ?? 0) },
    { operation: "findUnique", count: Number(operationCounts.findUnique ?? 0) },
    { operation: "create", count: Number(operationCounts.create ?? 0) },
    { operation: "update", count: Number(operationCounts.update ?? 0) },
    { operation: "delete", count: Number(operationCounts.delete ?? 0) },
    { operation: "raw", count: Number(operationCounts.raw ?? 0) },
  ];
  const recentSlowQueries = dbStats?.recentSlowQueries ?? [];
  const topSlowOperations = dbStats?.slowestOperations ?? [];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 space-y-6">
        <Card className="border border-white/10 bg-slate-900/60">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-2xl text-slate-100">System Statistics</CardTitle>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
            <p className="text-sm text-slate-400">Global election participation and ballot health across all companies.</p>
          </CardHeader>
        </Card>

        {statsQuery.isLoading ? (
          <Card className="border border-white/10 bg-slate-900/60">
            <CardContent className="py-10 text-slate-300">Loading system stats...</CardContent>
          </Card>
        ) : null}

        {statsQuery.isError ? (
          <Card className="border border-red-900/40 bg-red-950/20">
            <CardContent className="py-10 text-red-200">
              {(statsQuery.error as Error | undefined)?.message ?? "Failed to load system stats."}
            </CardContent>
          </Card>
        ) : null}

        {!statsQuery.isLoading && !statsQuery.isError && !stats ? (
          <Card className="border border-white/10 bg-slate-900/60">
            <CardContent className="py-10 text-slate-300">No system stats available.</CardContent>
          </Card>
        ) : null}

        {!statsQuery.isLoading && !statsQuery.isError && stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Total Companies</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(stats.total_companies)}</CardContent>
              </Card>
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Total Users</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(stats.total_users)}</CardContent>
              </Card>
              <Card className="border border-white/10 bg-slate-900/60">
                <CardHeader><CardTitle className="text-sm text-slate-300">Total Ballots</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(stats.total_ballots)}</CardContent>
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
                <CardHeader><CardTitle className="text-sm text-slate-300">Initiative Votes</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(stats.total_initiative_votes)}</CardContent>
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
              <CardHeader>
                <CardTitle className="text-slate-100">Ballot Status Mix</CardTitle>
              </CardHeader>
              <CardContent>
                <BallotStatusBarChart
                  activeCount={stats.active_ballots?.count ?? 0}
                  inactiveCount={stats.inactive_ballots?.count ?? 0}
                />
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-slate-100">API Health</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-white/10 bg-slate-900/40">
                  <CardHeader><CardTitle className="text-sm text-slate-300">Total Requests</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(httpStats?.totalRequests ?? 0)}</CardContent>
                </Card>
                <Card className="border border-white/10 bg-slate-900/40">
                  <CardHeader><CardTitle className="text-sm text-slate-300">Request Errors</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(httpStats?.totalErrors ?? 0)}</CardContent>
                </Card>
                <Card className="border border-white/10 bg-slate-900/40">
                  <CardHeader><CardTitle className="text-sm text-slate-300">Avg Response Time</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold text-slate-100">{metricMs(httpStats?.avgResponseTime ?? 0)}</CardContent>
                </Card>
                <Card className="border border-white/10 bg-slate-900/40">
                  <CardHeader><CardTitle className="text-sm text-slate-300">Max Response Time</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold text-slate-100">{metricMs(httpStats?.maxResponseTime ?? 0)}</CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-slate-100">Database Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border border-white/10 bg-slate-900/40">
                    <CardHeader><CardTitle className="text-sm text-slate-300">Total Queries</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(dbStats?.totalQueries ?? 0)}</CardContent>
                  </Card>
                  <Card className="border border-white/10 bg-slate-900/40">
                    <CardHeader><CardTitle className="text-sm text-slate-300">Avg Query Duration</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-semibold text-slate-100">{metricMs(dbStats?.averageQueryDurationMs ?? 0)}</CardContent>
                  </Card>
                  <Card className="border border-white/10 bg-slate-900/40">
                    <CardHeader><CardTitle className="text-sm text-slate-300">Slowest Query</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-semibold text-slate-100">{metricMs(dbStats?.slowestQueryDurationMs ?? 0)}</CardContent>
                  </Card>
                  <Card className="border border-white/10 bg-slate-900/40">
                    <CardHeader><CardTitle className="text-sm text-slate-300">Query Errors</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-semibold text-slate-100">{metricValue(dbStats?.queryErrors ?? 0)}</CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <Card className="border border-white/10 bg-slate-900/40">
                    <CardHeader>
                      <CardTitle className="text-slate-100">Queries by Operation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <QueryOperationBarChart data={queryOperationChartData} />
                    </CardContent>
                  </Card>
                  <Card className="border border-white/10 bg-slate-900/40">
                    <CardHeader>
                      <CardTitle className="text-slate-100">Slowest Operations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {topSlowOperations.length === 0 ? (
                        <p className="text-sm text-slate-300">No operation timing data yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {topSlowOperations.slice(0, 8).map((op, idx) => (
                            <div key={`${op.model}-${op.operation}-${idx}`} className="flex items-center justify-between text-sm gap-3">
                              <div className="text-slate-300 truncate">
                                {op.model}.{op.operation} ({metricValue(op.count)})
                              </div>
                              <div className="text-slate-100 whitespace-nowrap">{metricMs(op.averageDurationMs ?? 0)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="border border-white/10 bg-slate-900/40">
                  <CardHeader>
                    <CardTitle className="text-slate-100">Recent Slow Queries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentSlowQueries.length === 0 ? (
                      <p className="text-sm text-slate-300">No recent slow queries captured.</p>
                    ) : (
                      <div className="space-y-2">
                        {recentSlowQueries.slice(0, 12).map((query, idx) => (
                          <div
                            key={`${query.model}-${query.operation}-${query.timestamp}-${idx}`}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-slate-300 truncate">
                              {query.model}.{query.operation}
                            </span>
                            <span className="text-slate-400 whitespace-nowrap">
                              {new Date(query.timestamp ?? "").toLocaleString()}
                            </span>
                            <span className="text-slate-100 whitespace-nowrap">
                              {metricMs(query.durationMs ?? 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-slate-900/60">
              <CardHeader className="space-y-3">
                <CardTitle className="text-slate-100">Ballot Discovery</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <SearchInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search ballots by name or description..."
                  />
                  <Select value={status} onValueChange={(v) => setStatus(v as "open" | "closed" | "all")}>
                    <SelectTrigger className="w-32 bg-slate-900/30 border-slate-800 text-slate-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">Sort by:</span>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as "startDate" | "endDate" | "ballotName" | "votes")}>
                      <SelectTrigger className="w-36 bg-slate-900/30 border-slate-800 text-slate-200">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                        <SelectItem value="startDate">Start Date</SelectItem>
                        <SelectItem value="endDate">End Date</SelectItem>
                        <SelectItem value="ballotName">Ballot Name</SelectItem>
                        <SelectItem value="votes">Votes</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                      onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                      aria-label="Toggle sort direction"
                    >
                      {sortDir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!ballotListQuery.isLoading && !ballotListQuery.isError && hasBallotResults ? (
                  <PaginationControls
                    page={page}
                    totalPages={totalPages}
                    setPage={setPage}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    status={status}
                  />
                ) : null}

                {ballotListQuery.isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <PulseLoader color="#cbd5e1" size={12} />
                  </div>
                ) : ballotListQuery.isError ? (
                  <p className="text-slate-300">Error loading ballots</p>
                ) : hasBallotResults ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {ballotsList.map((ballot: any) => (
                      <ElectionCard
                        key={(ballot as { id?: number; ballotID?: number; ballotName?: string }).id ?? ballot.ballotID ?? ballot.ballotName}
                        ballot={ballot}
                      />
                    ))}
                  </div>
                ) : (
                  <NoResultsCat />
                )}

                {!ballotListQuery.isLoading && !ballotListQuery.isError && hasBallotResults ? (
                  <PaginationControls
                    page={page}
                    totalPages={totalPages}
                    setPage={setPage}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    status={status}
                  />
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
