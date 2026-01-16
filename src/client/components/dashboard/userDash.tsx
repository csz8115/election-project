import { useState, useEffect } from "react";
import { PulseLoader } from "react-spinners";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "../ui/button";
import SearchInput from "../searchInput";
import { PaginationControls } from ".././paginationControls";
import ElectionCard from "./electionCard";
import NoResultsCat from ".././catErrors/noResultsCat";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import type { ballots } from "@prisma/client";
import { useUserStore } from "../../store/userStore";
import { useUserBallots } from "../../hooks/useUserBallots";

export default function UserDash() {
  const user = useUserStore((s) => s);

  const [page, setPage] = useState(0);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const [status, setStatus] = useState<"open" | "closed" | "all">("all");

  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<
    "startDate" | "endDate" | "ballotName" | "votes"
  >("startDate");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 450);
    return () => clearTimeout(t);
  }, [query]);

  // Reset page on any "query knob" change
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
    companyName: user.companyName || "", 
  });

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  // Clamp page if filters shrink the result set
  useEffect(() => {
    if (page >= totalPages) setPage(totalPages - 1);
  }, [page, totalPages]);

  const ballotsList = data?.ballots ?? [];
  const hasResults = ballotsList.length > 0;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-300">
      <div className="p-4 space-y-4 flex flex-col">
        <h1 className="text-2xl text-slate-100">Elections Dashboard</h1>

        {/* Top Pagination */}
        {!isLoading && !isError && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            sortBy={sortBy}
            sortDir={sortDir}
            status={status}
          />
        )}

        {/* Toolbar (reduced feature set) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <SearchInput
              type="text"
              placeholder="Search ballots..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Select
            defaultValue="all"
            value={status}
            onValueChange={(v) => setStatus(v as any)}
          >
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

            <Select
              defaultValue="startDate"
              value={sortBy}
              onValueChange={(v) => setSortBy(v as any)}
            >
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
              {sortDir === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Content (same structure as EmployeeDash) */}
        {(() => {
          if (isLoading) {
            return (
              <div className="flex-1 flex items-center justify-center py-24">
                <PulseLoader color="#cbd5e1" size={12} />
              </div>
            );
          }

          if (isError) {
            return (
              <div className="flex-1 flex items-center justify-center py-24">
                <p className="text-slate-300">Error loading ballots</p>
              </div>
            );
          }

          return (
            <div className="flex flex-col items-center gap-6">
              {hasResults ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  {ballotsList.map((ballot: ballots & { id?: any }) => (
                    <ElectionCard
                      key={(ballot as any).id ?? ballot.ballotID ?? ballot.ballotName}
                      ballot={ballot}
                    />
                  ))}
                </div>
              ) : (
                <NoResultsCat />
              )}

              {/* Bottom Pagination */}
              {hasResults && (
                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  setPage={setPage}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  status={status}
                />
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
