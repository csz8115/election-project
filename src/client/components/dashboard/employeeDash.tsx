import { useState, useEffect } from "react";
import { PulseLoader } from "react-spinners";
import { useAllBallots } from "../../hooks/useAllBallots";
import { useCompanies } from "../../hooks/useCompanies";
import { useBallotIds } from "../../hooks/useBallotIds";
import { useBallotStore } from "../../store/ballotStore";

import ElectionCard from "./electionCard";
import NoResultsCat from ".././catErrors/noResultsCat";
import { PaginationControls } from ".././paginationControls";
import { EmployeeToolbar } from "./employeeToolbar";

export default function EmployeeDash() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<
    "startDate" | "endDate" | "ballotName" | "votes"
  >("startDate");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [status, setStatus] = useState<"open" | "closed" | "all">("all");
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(
    new Set()
  );

  // ✅ store actions
  const isManageMode = useBallotStore((s) => s.isManageMode);
  const setSelectedIds = useBallotStore((s) => s.setSelectedIds);
  const clearSelection = useBallotStore((s) => s.clearSelection);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, status, sortBy, sortDir, selectedCompanies]);

  const {
    data,
    isLoading,
    isError,
    refetch: refetchAllBallots, // ✅ important
  } = useAllBallots({
    pageParam: page,
    q: debouncedQuery,
    sortBy,
    sortDir,
    status,
    companies: selectedCompanies,
  });

  const {
    data: companiesData,
    isLoading: companiesIsLoading,
    isError: companiesIsError,
  } = useCompanies();

  // ✅ Hook that fetches ALL matching IDs across all pages
  const {
    refetch: refetchBallotIds, // ✅ important
    isFetching: ballotIdsFetching,
  } = useBallotIds({
    q: debouncedQuery,
    sortBy,
    sortDir,
    status,
    companies: selectedCompanies,
    enabled: false,
  });

  // ✅ Clear selection when filters change
  useEffect(() => {
    if (isManageMode) clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, status, sortBy, sortDir, selectedCompanies]);

  const LIMIT = 40;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  useEffect(() => {
    if (page >= totalPages) setPage(totalPages - 1);
  }, [totalPages, page]);

  // ✅ “Select all across all pages”
  const handleSelectAllMatching = async () => {
    const result = await refetchBallotIds();
    const ids = (result.data?.ballots ?? []).map((x: any) =>
      typeof x === "number" ? x : x.ballotID ?? x.id
    );
    setSelectedIds(ids);
  };

  const handleClearAllSelections = () => clearSelection();

  // ✅ After delete: refetch list and clamp page if needed
  const handleAfterDelete = async () => {
    // 1) refresh current page
    const result = await refetchAllBallots();

    // 2) if we deleted the last items on this page and now it’s empty, go back a page
    const ballotsNow = result.data?.ballots ?? [];
    if (ballotsNow.length === 0 && page > 0) {
      setPage((p) => Math.max(0, p - 1));
      // then refetch again for the new page
      await refetchAllBallots();
    }

    // 3) optional: keep the "select all matching" accurate for next click
    // (no need to refetch immediately unless you want)
  };

  const handleAfterDateChange = async () => {
    const result = await refetchAllBallots();

    const ballotsNow = result.data?.ballots ?? [];
    if (ballotsNow.length === 0 && page > 0) {
      setPage((p) => Math.max(0, p - 1));
      await refetchAllBallots();
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-300">
      <div className="p-4 space-y-4 flex flex-col">
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
          visibleBallotIds={data?.ballots?.map((b: any) => b.ballotID) ?? []}
          onSelectAllMatching={handleSelectAllMatching}
          onClearAllSelections={handleClearAllSelections}
          selectAllLoading={ballotIdsFetching}
          onAfterDelete={handleAfterDelete} // ✅ NEW
          onAfterDateChange={handleAfterDateChange}
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
                    <ElectionCard key={ballot.ballotID} ballot={ballot} />
                  ))}
                </div>
              ) : (
                <NoResultsCat />
              )}

              {(data?.ballots?.length ?? 0) > 0 && (
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
