import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import { Button } from "../ui/button";
import SearchInput from "../searchInput";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { useMemo, useState, useEffect } from "react";

type Company = {
  companyID: number;
  companyName?: string;
  abbreviation?: string;
  category?: string;
};

type CompanySheetProps = {
  companiesData: Company[] | undefined;
  companiesIsLoading: boolean;
  companiesIsError: boolean;

  // Parent-controlled "applied" selection
  selectedCompanies: Set<number>;
  setSelectedCompanies: React.Dispatch<React.SetStateAction<Set<number>>>;
};

export default function CompanySheet({
  companiesData,
  companiesIsLoading,
  companiesIsError,
  selectedCompanies,
  setSelectedCompanies,
}: CompanySheetProps) {
  const [open, setOpen] = useState(false);

  // Local draft state (only commits to parent on Apply)
  const [draftSelected, setDraftSelected] = useState<Set<number>>(
    () => new Set(selectedCompanies)
  );
  const [companyQuery, setCompanyQuery] = useState("");

  // When the sheet opens, sync draft from parent (fresh start each open)
  useEffect(() => {
    if (open) setDraftSelected(new Set(selectedCompanies));
  }, [open, selectedCompanies]);

  const filteredCompanies = useMemo(() => {
  const q = companyQuery.trim().toLowerCase();

  // ✅ Runtime guard: guarantee an array
  const list = Array.isArray(companiesData) ? companiesData : [];

  if (!q) return list;

  return list.filter((c) => {
    const name = (c.companyName ?? "").toLowerCase();
    const abbr = (c.abbreviation ?? "").toLowerCase();
    const cat = (c.category ?? "").toLowerCase();
    return (
      name.includes(q) ||
      abbr.includes(q) ||
      cat.includes(q) ||
      String(c.companyID ?? "").includes(q)
    );
  });
}, [companiesData, companyQuery]);

  // Helpers
  const toggleCompany = (companyID: number) => {
    setDraftSelected((prev) => {
      const next = new Set(prev);
      if (next.has(companyID)) next.delete(companyID);
      else next.add(companyID);
      return next;
    });
  };

  // "All" based on current filtered list (nice UX when searching)
  const filteredIds = useMemo(
    () => filteredCompanies.map((c) => c.companyID),
    [filteredCompanies]
  );

  const allChecked =
    filteredIds.length > 0 && filteredIds.every((id) => draftSelected.has(id));
  const someChecked =
    filteredIds.some((id) => draftSelected.has(id)) && !allChecked;

  const setAllFiltered = (checked: boolean) => {
    setDraftSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        // add all filtered
        filteredIds.forEach((id) => next.add(id));
      } else {
        // remove all filtered
        filteredIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const handleClear = () => {
    setCompanyQuery("");
    setDraftSelected(new Set());
    setSelectedCompanies(new Set());
  };

  const handleApply = () => {
    // Commit to parent
    setSelectedCompanies(new Set(draftSelected));
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
        >
          Company
        </Button>
      </SheetTrigger>

      <SheetContent className="bg-slate-950 border-slate-800">
        <SheetHeader>
          <SheetTitle className="text-slate-200">Filter by Company</SheetTitle>
          <SheetDescription className="text-slate-400">
            Search and select companies to filter ballots
          </SheetDescription>
          <SearchInput
            type="text"
            placeholder="Search companies..."
            className="w-full"
            value={companyQuery}
            onChange={(e: any) => setCompanyQuery(e.target.value)}
          />
          <div className="mt-4 flex flex-row justify-between items-center gap-2 px-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
              onClick={handleClear}
            >
              Clear
            </Button>

            <div className="flex gap-2">

              <Button
                type="button"
                variant="outline"
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div>
          <ScrollArea className="h-[calc(90vh-12rem)] pr-2">
            <div className="mt-2 flex flex-col space-y-2 px-4">
              {/* All companies (for current filtered view) */}
              <div className="flex items-center space-x-3 px-2 rounded-md hover:bg-slate-900/50 transition-colors">
                <Checkbox
                  id="all"
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={(val) => setAllFiltered(Boolean(val))}
                  className="border-slate-700 bg-slate-900 data-[state=checked]:bg-blue-600"
                />
                <label htmlFor="all" className="text-slate-200 cursor-pointer flex-1">
                  Select All ({filteredIds.length})
                </label>
                <span className="text-xs text-slate-500">
                  {draftSelected.size ? `${draftSelected.size} selected` : "none"}
                </span>
              </div>

              {/* Body */}
              {companiesIsLoading ? (
                <p className="text-slate-400 text-sm text-center py-6">Loading companies…</p>
              ) : companiesIsError ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  Error loading companies
                </p>
              ) : filteredCompanies.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  No companies match "{companyQuery}"
                </p>
              ) : (
                filteredCompanies.map((company) => {
                  const checked = draftSelected.has(company.companyID);

                  return (
                    <div
                      key={company.companyID}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-900/50 transition-colors"
                    >
                      <Checkbox
                        id={`company-${company.companyID}`}
                        checked={checked}
                        onCheckedChange={() => toggleCompany(company.companyID)}
                        className="border-slate-700 bg-slate-900 data-[state=checked]:bg-blue-600"
                      />
                      <label
                        htmlFor={`company-${company.companyID}`}
                        className="text-slate-200 cursor-pointer flex-1"
                      >
                        {company.companyName}
                        {company.abbreviation ? (
                          <span className="ml-2 text-slate-500 text-xs">
                            ({company.abbreviation})
                          </span>
                        ) : null}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

        </div>
      </SheetContent>
    </Sheet>
  );
}
