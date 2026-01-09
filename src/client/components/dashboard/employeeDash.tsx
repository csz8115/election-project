import {useState, useEffect } from "react";
import { PulseLoader } from "react-spinners";
import { useAllBallots } from "../../hooks/useAllBallots";
import ElectionCard from "../../components/electionCard";
import { useCompanies } from "../../hooks/useCompanies";
import NoResultsCat from ".././catErrors/noResultsCat";
import { PaginationControls } from ".././paginationControls";
import { EmployeeToolbar } from "./employeeToolbar";
/**
 * Fixes white flash by ensuring this component ALWAYS paints a background:
 * - outer Shell is always rendered (even during loading/error)
 * - avoids early-return that temporarily removes the page background
 */
export default function EmployeeDash() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<"startDate" | "endDate" | "ballotName" | "votes">("startDate");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [status, setStatus] = useState<"open" | "closed" | "all">("all");
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // Debounce delay of 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    setPage(0); // Reset to first page when query changes
  }, [debouncedQuery, status, sortBy, sortDir, selectedCompanies]);

  const { data, isLoading, isError } = useAllBallots({ pageParam: page, q: debouncedQuery, sortBy, sortDir, status, companies: selectedCompanies });
  const { data: companiesData, isLoading: companiesIsLoading, isError: companiesIsError } = useCompanies();


  const LIMIT = 40;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  useEffect(() => {
    if (page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [totalPages, page]);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-300">
      <div className="p-4 space-y-4 flex flex-col">

        {!isLoading && !isError && <PaginationControls page={page} totalPages={totalPages} setPage={setPage} sortBy={sortBy} sortDir={sortDir} status={status} />}

        <EmployeeToolbar
          query={query}
          setQuery={setQuery}
          setStatus={setStatus}
          setSortBy={setSortBy}
          sortDir={sortDir}
          setSortDir={setSortDir}
          selectedCompanies={selectedCompanies}
          setSelectedCompanies={setSelectedCompanies}
          companiesData={companiesData}
          companiesIsLoading={companiesIsLoading}
          companiesIsError={companiesIsError}
        />

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
              {data?.ballots?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  {data.ballots.map((ballot: any) => (
                    <ElectionCard key={ballot.id} ballot={ballot} />
                  ))}
                </div>
              ) : (
                <NoResultsCat />
              )}

              {/* Bottom Pagination */}
              {(data?.ballots?.length ?? 0) > 0 && <PaginationControls page={page} totalPages={totalPages} setPage={setPage} sortBy={sortBy} sortDir={sortDir} status={status} />}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
