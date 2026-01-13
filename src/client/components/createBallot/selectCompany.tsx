import * as React from "react";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../ui/command";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { company as Company } from "@prisma/client";
type SelectCompanyProps = {
  companiesData: Company[] | undefined;
  companiesIsLoading: boolean;
  companiesIsError: boolean;

  // parent-controlled selection (we’ll enforce single-select by keeping max 1 ID)
  selectedCompanies: Set<number>;
  setSelectedCompanies: React.Dispatch<React.SetStateAction<Set<number>>>;

  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
};

export default function SelectCompany({
  companiesData,
  companiesIsLoading,
  companiesIsError,
  selectedCompanies,
  setSelectedCompanies,
  label = "Company",
  description = "Select the company this ballot belongs to",
  placeholder = "Select a company",
  disabled = false,
}: SelectCompanyProps) {
  const [open, setOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");

  // single selected id (or null)
  const selectedId = useMemo(() => {
    const first = selectedCompanies.values().next().value;
    return typeof first === "number" ? first : null;
  }, [selectedCompanies]);

  const selectedName = useMemo(() => {
    if (!selectedId) return "";
    return companiesData?.find((c) => c.companyID === selectedId)?.companyName ?? "";
  }, [companiesData, selectedId]);

  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    const list = companiesData ?? [];
    if (!q) return list;

    return list.filter((c) => {
      const name = (c.companyName ?? "").toLowerCase();
      const abbr = (c.abbreviation ?? "").toLowerCase();
      const id = String(c.companyID ?? "");
      return name.includes(q) || abbr.includes(q) || id.includes(q);
    });
  }, [companiesData, companyQuery]);

  const selectCompany = (id: number) => {
    setSelectedCompanies(new Set([id])); // enforce single-select
    setCompanyQuery("");
    setOpen(false);
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>

      <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-between bg-slate-950/40 border-slate-800 text-slate-200"
          >
            {selectedId ? (selectedName || `Company #${selectedId}`) : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] p-0 bg-slate-950 border-slate-800"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search companies..."
              value={companyQuery}
              onValueChange={setCompanyQuery}
            />

            {companiesIsLoading ? (
              <div className="py-6 text-center text-sm text-slate-400">
                Loading companies…
              </div>
            ) : companiesIsError ? (
              <div className="py-6 text-center text-sm text-slate-400">
                Error loading companies
              </div>
            ) : filteredCompanies.length === 0 ? (
              <CommandEmpty>No company found.</CommandEmpty>
            ) : (
              <CommandGroup className="max-h-64 overflow-auto">
                {filteredCompanies.map((company) => {
                  const checked = selectedId === company.companyID;

                  return (
                    <CommandItem
                      key={company.companyID}
                      value={String(company.companyID)}
                      onSelect={() => selectCompany(company.companyID)}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate">
                        {company.companyName}
                        {company.abbreviation && (
                          <span className="ml-2 text-xs text-slate-400">
                            ({company.abbreviation})
                          </span>
                        )}
                      </span>

                      <Check
                        className={cn("h-4 w-4", checked ? "opacity-100" : "opacity-0")}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
