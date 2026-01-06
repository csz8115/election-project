import { useMemo, useState, useEffect } from "react";
import { PulseLoader } from "react-spinners";
import { ArrowDown, ArrowUp, SquareSplitHorizontal } from "lucide-react";
import type { ballots } from "@prisma/client";
import { useUserStore } from "../store/userStore";
import ElectionCard from "../components/electionCard";
import SearchInput from "../components/searchInput";
import { Button } from "../components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useUserBallots } from "../hooks/useUserBallots";

export default function UserDash() {
  const user = useUserStore((s) => s);

  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const [status, setStatus] = useState<"open" | "closed" | "all">("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<"startDate" | "endDate" | "ballotName" | "votes">("startDate");

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 450);
    return () => clearTimeout(t);
  }, [query]);

  // reset page on “querying knobs”
  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, status, sortBy, sortDir]);

  const LIMIT = 40;

  const { data, isLoading, isError } = useUserBallots({
    userId: user.userID,
    pageParam: page,
    limit: LIMIT,
    q: debouncedQuery,
    status,
    sortBy,
    sortDir,
  });

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  // clamp page if totalCount shrinks after filtering
  useEffect(() => {
    if (page >= totalPages) setPage(totalPages - 1);
  }, [page, totalPages]);

  const paginationControls = useMemo(() => {
    const safeTotalPages = Math.max(totalPages, 1);
    const isFirst = page === 0;
    const isLast = page + 1 >= safeTotalPages;

    return (
      <Pagination className="mt-6 flex justify-center">
        <PaginationContent className="flex gap-2 items-center">
          <PaginationItem>
            {!isFirst && (
              <Button variant="outline" onClick={() => setPage(0)}>
                First
              </Button>
            )}
          </PaginationItem>

          <PaginationItem>
            <PaginationPrevious
              onClick={() => !isFirst && setPage((p) => Math.max(p - 1, 0))}
              className={isFirst ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          <span className="text-sm font-medium">
            Page {page + 1} of {safeTotalPages}
          </span>

          <PaginationItem>
            <PaginationNext
              onClick={() => !isLast && setPage((p) => Math.min(p + 1, safeTotalPages - 1))}
              className={isLast ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          <PaginationItem>
            {!isLast && (
              <Button variant="outline" onClick={() => setPage(safeTotalPages - 1)}>
                Last
              </Button>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }, [page, totalPages]);

  const hasResults = (data?.ballots?.length ?? 0) > 0;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-300">
      <div className="p-4 space-y-4 flex flex-col">
        <h1 className="text-2xl text-slate-100">
          Elections Dashboard
        </h1>

        {!isLoading && !isError && hasResults && paginationControls}

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="relative w-full max-w-xs">
            <SearchInput
              type="text"
              placeholder="Search ballots..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Select defaultValue="all" onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-32 bg-slate-900/30 border-slate-800 text-slate-200">
              <SelectValue placeholder="all" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <div className="flex items-center space-x-2">
            <label className="text-sm text-slate-300">Sort by:</label>

            <Select defaultValue="startDate" onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-32 bg-slate-900/30 border-slate-800 text-slate-200">
                <SelectValue placeholder="startDate" />
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

            <Button
              variant="outline"
              className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
              onClick={() => {
                const grid = document.querySelector(".grid");
                if (!grid) return;

                if (grid.classList.contains("lg:grid-cols-4")) {
                  grid.classList.remove("lg:grid-cols-4");
                  grid.classList.add("lg:grid-cols-5");
                } else {
                  grid.classList.remove("lg:grid-cols-5");
                  grid.classList.add("lg:grid-cols-4");
                }
              }}
              aria-label="Toggle grid density"
            >
              <SquareSplitHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <PulseLoader color="#cbd5e1" size={12} />
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <p className="text-slate-300">Error loading ballots</p>
          </div>
        ) : hasResults ? (
          <div className="flex flex-col items-center gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {data!.ballots.map((ballot: ballots) => (
                <ElectionCard key={ballot.ballotID ?? ballot.ballotName} ballot={ballot} />
              ))}
            </div>

            {paginationControls}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center text-slate-400 py-16">
            {/* sleepy cat */}
            <svg
              width={220}
              height={160}
              viewBox="0 0 220 160"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-4"
            >
              <defs>
                <style>{`
                  .breath { transform-origin: 110px 100px; animation: breathe 2.4s ease-in-out infinite; }
                  .zzz { animation: float 2.2s ease-in-out infinite; opacity: .8; }
                  .zzz2 { animation-delay: .35s; opacity: .6; }
                  .zzz3 { animation-delay: .7s; opacity: .45; }
                  @keyframes breathe { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(1.5px);} }
                  @keyframes float { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-6px);} }
                `}</style>
              </defs>

              <rect x="28" y="104" width="164" height="40" rx="18" fill="currentColor" opacity="0.08" />

              <g className="zzz" fill="currentColor" fontFamily="ui-sans-serif, system-ui" fontWeight="700">
                <text x="162" y="60" fontSize="18">Z</text>
                <text className="zzz2" x="176" y="52" fontSize="16">z</text>
                <text className="zzz3" x="188" y="42" fontSize="14">z</text>
              </g>

              <g className="breath" fill="currentColor" stroke="currentColor">
                <path
                  d="M70 108 C62 92, 74 78, 98 78 C125 78, 142 92, 150 108 C157 124, 146 136, 122 136 C92 136, 78 128, 70 108Z"
                  opacity="0.85"
                />
                <path
                  d="M148 106 C148 90, 158 78, 172 78 C186 78, 196 90, 196 106 C196 118, 188 128, 172 128 C156 128, 148 118, 148 106Z"
                  opacity="0.85"
                />
                <path d="M158 84 L164 74 L170 86" opacity="0.85" />
                <path d="M186 84 L180 74 L174 86" opacity="0.85" />
                <path d="M162 104 C166 100, 170 100, 174 104" fill="none" strokeWidth="2" strokeLinecap="round" />
                <path d="M172 104 C176 100, 180 100, 184 104" fill="none" strokeWidth="2" strokeLinecap="round" />
                <path d="M172 110 L172 112" strokeWidth="2" />
                <path d="M168 114 C170 116, 174 116, 176 114" fill="none" strokeWidth="2" />
                <path
                  d="M70 120 C54 120, 46 114, 42 106 C38 98, 42 90, 52 90 C60 90, 66 96, 64 104"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </g>
            </svg>

            <p className="text-lg font-medium text-slate-200 mt-4">No results found</p>
            <p className="text-sm text-slate-500">Try a different search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
