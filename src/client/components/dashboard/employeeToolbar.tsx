import SearchInput from "../searchInput";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ArrowDown, ArrowUp, SquareSplitHorizontal } from "lucide-react";
import CompanySheet from "./companySheet";

type EmployeeToolbarProps = {
    query: string;
    setQuery: (value: string) => void;
    setStatus: (value: "open" | "closed" | "all") => void;
    setSortBy: (value: "startDate" | "endDate" | "ballotName" | "votes") => void;
    sortDir: "asc" | "desc";
    setSortDir: (value: "asc" | "desc") => void;
    selectedCompanies: Set<number>;
    setSelectedCompanies: React.Dispatch<React.SetStateAction<Set<number>>>;
    companiesData: any;
    companiesIsLoading: boolean;
    companiesIsError: boolean;
}

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
    companiesIsError
}: EmployeeToolbarProps) {
    return (
        <div className="flex justify-between items-center mb-4 gap-4">
            <div className="relative w-full max-w-xs">
                <SearchInput
                    type="text"
                    placeholder="Search ballots..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <Select defaultValue="all" onValueChange={(value) => setStatus(value as "open" | "closed" | "all")}>
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

                <Select defaultValue="startDate" onValueChange={(value) => setSortBy(value as "startDate" | "endDate" | "ballotName" | "votes")}>
                    <SelectTrigger className="w-32 bg-slate-900/30 border-slate-800 text-slate-200">
                        <SelectValue placeholder="startDate" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                        <SelectItem value="startDate">Start Date </SelectItem>
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
            </div>
        </div>
    )
}