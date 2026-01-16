import React from "react";
import SearchInput from "../searchInput";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  ArrowDown,
  ArrowUp,
  SquareSplitHorizontal,
  CheckSquare,
  Check,
  Trash2,
  CalendarClock,
  Layers,
} from "lucide-react";
import CompanySheet from "./companySheet";
import { useBallotStore } from "../../store/ballotStore";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { deleteBallot, changeDate } from "../../lib/form-actions";
import { toast } from "sonner";

type EmployeeToolbarProps = {
  query: string;
  setQuery: (value: string) => void;
  setStatus: (value: "open" | "closed" | "all") => void;
  setSortBy: (value: "startDate" | "endDate" | "ballotName" | "votes") => void;
  sortDir: "asc" | "desc";
  setSortDir: (value: "asc" | "desc") => void;

  // refresh callbacks
  onAfterDelete?: () => void | Promise<void>;
  onAfterDateChange?: () => void | Promise<void>;

  selectedCompanies: Set<number>;
  setSelectedCompanies: React.Dispatch<React.SetStateAction<Set<number>>>;
  companiesData: any;
  companiesIsLoading: boolean;
  companiesIsError: boolean;

  visibleBallotIds?: number[];

  onSelectAllMatching?: () => void | Promise<void>;
  onClearAllSelections?: () => void;
  selectAllLoading?: boolean;
};

export function EmployeeToolbar({
  query,
  setQuery,
  setStatus,
  setSortBy,
  sortDir,
  setSortDir,
  selectedCompanies,
  setSelectedCompanies,
  companiesData,
  companiesIsLoading,
  companiesIsError,
  visibleBallotIds = [],
  onSelectAllMatching,
  onClearAllSelections,
  selectAllLoading = false,
  onAfterDelete,
  onAfterDateChange,
}: EmployeeToolbarProps) {
  const isManageMode = useBallotStore((s) => s.isManageMode);
  const selectedBallotIds = useBallotStore((s) => s.selectedIds);
  const toggleManageMode = useBallotStore((s) => s.toggleManageMode);
  const clearSelection = useBallotStore((s) => s.clearSelection);

  const reduceMotion = useReducedMotion();
  const selectedCount = selectedBallotIds.length;

  // ✅ Bulk date dialog local state (always shows BOTH fields)
  const [dateOpen, setDateOpen] = React.useState(false);
  const [startDateValue, setStartDateValue] = React.useState<string>(""); // YYYY-MM-DD
  const [endDateValue, setEndDateValue] = React.useState<string>(""); // YYYY-MM-DD
  const [isDateSaving, setIsDateSaving] = React.useState(false);
  const [dateError, setDateError] = React.useState<string>("");

  const handleClearAll = () => {
    if (onClearAllSelections) onClearAllSelections();
    else clearSelection();
  };

  const ease = [0.16, 1, 0.3, 1] as const;

  const managePanelMotion = reduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : {
        initial: { opacity: 0, x: 16, scale: 0.98 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 16, scale: 0.98 },
        transition: { duration: 0.22, ease },
      };

  const todayISO = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const hasAnyDate = !!startDateValue || !!endDateValue;

  const invalidRange =
    startDateValue && endDateValue
      ? new Date(`${startDateValue}T00:00:00`).getTime() >
        new Date(`${endDateValue}T00:00:00`).getTime()
      : false;

  const validateDates = () => {
    if (!hasAnyDate) return "Pick at least a start date or an end date.";
    if (invalidRange) return "Start date cannot be after end date.";
    return "";
  };

  const applyDates = async () => {
    if (!selectedCount || isDateSaving) return;

    const msg = validateDates();
    if (msg) {
      setDateError(msg);
      return;
    }

    const newStartDate = startDateValue
      ? new Date(`${startDateValue}T00:00:00`)
      : undefined;

    const newEndDate = endDateValue
      ? new Date(`${endDateValue}T00:00:00`)
      : undefined;

    setIsDateSaving(true);

    const run = async () => {
      await Promise.all(
        selectedBallotIds.map((ballotID) =>
          changeDate({
            ballotID,
            newStartDate,
            newEndDate,
          })
        )
      );

      handleClearAll();
      await onAfterDateChange?.();
      setDateOpen(false);
    };

    toast
      .promise(run().finally(() => setIsDateSaving(false)), {
        loading: `Updating date${selectedCount === 1 ? "" : "s"} for ${selectedCount} ballot${
          selectedCount === 1 ? "" : "s"
        }...`,
        success: `Updated date${selectedCount === 1 ? "" : "s"} for ${selectedCount} ballot${
          selectedCount === 1 ? "" : "s"
        }`,
        error: `Failed to update date${selectedCount === 1 ? "" : "s"} for ${selectedCount} ballot${selectedCount === 1 ? "" : "s"}`,
      });
  };

  return (
    <motion.div
      layout
      className="flex justify-between items-center mb-4 gap-4"
      transition={reduceMotion ? undefined : { duration: 0.22, ease }}
    >
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
        onValueChange={(value) => setStatus(value as "open" | "closed" | "all")}
      >
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

      <motion.div
        layout
        className="flex items-center space-x-2"
        transition={reduceMotion ? undefined : { duration: 0.22, ease }}
      >
        <label htmlFor="sortBy" className="text-sm text-slate-300">
          Sort by:
        </label>

        <CompanySheet
          companiesData={companiesData}
          companiesIsLoading={companiesIsLoading}
          companiesIsError={companiesIsError}
          selectedCompanies={selectedCompanies}
          setSelectedCompanies={setSelectedCompanies}
        />

        <Select
          defaultValue="startDate"
          onValueChange={(value) =>
            setSortBy(value as "startDate" | "endDate" | "ballotName" | "votes")
          }
        >
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
          onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
          aria-label="Toggle sort direction"
        >
          {sortDir === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="outline"
          className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
          onClick={() => {
            const gridElement = document.querySelector(".grid");
            if (!gridElement) return;

            if (gridElement.classList.contains("lg:grid-cols-4")) {
              gridElement.classList.remove("lg:grid-cols-4");
              gridElement.classList.add("lg:grid-cols-5");
            } else {
              gridElement.classList.remove("lg:grid-cols-5");
              gridElement.classList.add("lg:grid-cols-4");
            }
          }}
          aria-label="Toggle grid density"
        >
          <SquareSplitHorizontal className="h-4 w-4" />
        </Button>

        {/* Manage / Select mode toggle */}
        <Button
          variant={isManageMode ? "secondary" : "outline"}
          className={
            isManageMode
              ? "bg-slate-200/10 text-slate-100 hover:bg-slate-200/15 border-slate-700"
              : "border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
          }
          onClick={() => {
            toggleManageMode();
            if (isManageMode) clearSelection();
          }}
          aria-label={isManageMode ? "Exit manage mode" : "Enter manage mode"}
        >
          {isManageMode ? (
            <Check className="h-4 w-4" />
          ) : (
            <CheckSquare className="h-4 w-4 mr-2" />
          )}
          {!isManageMode && "Manage"}
        </Button>

        {/* ✅ Animated manage panel */}
        <AnimatePresence mode="popLayout" initial={false}>
          {isManageMode && (
            <motion.div
              key="manage-panel"
              layout
              className="ml-2 flex items-center gap-2"
              {...managePanelMotion}
            >
              <span className="text-sm text-slate-300">{selectedCount} selected</span>

              {/* ✅ Bulk Date (always both fields) */}
              <AlertDialog open={dateOpen} onOpenChange={setDateOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedCount === 0}
                    className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                    aria-label="Bulk edit dates"
                    onClick={() => {
                      setStartDateValue("");
                      setEndDateValue("");
                      setDateError("");
                    }}
                  >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Date
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="bg-slate-950 border-slate-800 text-slate-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bulk edit dates</AlertDialogTitle>
                    <AlertDialogDescription>
                      Set a start date, an end date, or both for the {selectedCount} selected ballot
                      {selectedCount === 1 ? "" : "s"}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-4 text-left">
                    <div className="space-y-2">
                      <label
                        htmlFor="bulk-start-date"
                        className="text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        Start date
                      </label>
                      <input
                        id="bulk-start-date"
                        type="date"
                        value={startDateValue}
                        onChange={(e) => {
                          setStartDateValue(e.target.value);
                          setDateError("");
                        }}
                        className="w-full rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="bulk-end-date"
                        className="text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        End date
                      </label>
                      <input
                        id="bulk-end-date"
                        type="date"
                        value={endDateValue}
                        onChange={(e) => {
                          setEndDateValue(e.target.value);
                          setDateError("");
                        }}
                        className="w-full rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700"
                      />
                    </div>

                    {(invalidRange || dateError) && (
                      <p className="text-xs text-red-400">
                        {dateError || "Start date cannot be after end date."}
                      </p>
                    )}

                    <p className="text-xs text-slate-500">
                      Leave either field blank if you only want to change the other one.
                    </p>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDateSaving}>Cancel</AlertDialogCancel>

                    <AlertDialogAction
                      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-60"
                      disabled={selectedCount === 0 || isDateSaving}
                      onClick={(e) => {
                        // Keep dialog open until async finishes
                        e.preventDefault();
                        void applyDates();
                      }}
                    >
                      {isDateSaving ? "Applying..." : "Apply"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* ✅ Bulk Delete (functional + refresh) */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedCount === 0}
                    className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                    aria-label="Bulk delete"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-red-400" />
                    Delete
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="bg-slate-950 border-slate-800 text-slate-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete selected ballots?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you would like to delete the selected ballots? This action cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => {
                        if (!selectedCount) return;

                        toast.promise(
                          deleteBallot(selectedBallotIds).then(async () => {
                            handleClearAll();
                            await onAfterDelete?.();
                          }),
                          {
                            loading: `Deleting ${selectedCount} ballot${
                              selectedCount === 1 ? "" : "s"
                            }...`,
                            success: `Deleted ${selectedCount} ballot${
                              selectedCount === 1 ? "" : "s"
                            }`,
                            error: "Failed to delete ballots",
                          }
                        );
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="ghost"
                size="sm"
                disabled={selectedCount === 0}
                className="text-slate-300 hover:bg-slate-800/40"
                onClick={handleClearAll}
              >
                Clear
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={!onSelectAllMatching || selectAllLoading}
                className="text-slate-300 hover:bg-slate-800/40"
                onClick={() => onSelectAllMatching?.()}
                title="Select all ballots matching the current filters (across pages)"
              >
                <Layers className="h-4 w-4 mr-2" />
                {selectAllLoading ? "Selecting..." : "Select All"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

