import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import SearchInput from "../components/searchInput";
import { useSystemStats } from "../hooks/useSystemStats";

type BallotStat = {
  ballotID: number;
  ballotName: string;
  description?: string;
  companyID?: number;
  companyName?: string;
  startDate: string;
  endDate: string;
  voteCount?: number;
  status?: "active" | "closed";
};

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
  systemOverview?: SystemOverview;
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

function BallotCard({ ballot }: { ballot: BallotStat }) {
  const navigate = useNavigate();
  const isClosed = ballot.status === "closed" || new Date(ballot.endDate) < new Date();
  const statusLabel = isClosed ? "Closed" : "Active";

  const navigateToBallot = () => {
    const sp = new URLSearchParams();
    sp.set("b", String(ballot.ballotID));
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
          Company: <span className="text-slate-100">{ballot.companyName ?? "N/A"}</span>
        </p>
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

export default function SystemStats() {
  const navigate = useNavigate();
  const [ballotQuery, setBallotQuery] = React.useState("");
  const [ballotScope, setBallotScope] = React.useState<"all" | "active" | "inactive">("all");

  const statsQuery = useSystemStats();
  const report = (statsQuery.data ?? null) as SystemReport | null;
  const stats = report?.systemOverview ?? null;

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
                          <BallotCard key={`active-${ballot.ballotID}`} ballot={ballot} />
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
                          <BallotCard key={`inactive-${ballot.ballotID}`} ballot={ballot} />
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
