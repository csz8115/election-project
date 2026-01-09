import { useMemo } from "react";
import { Button } from "./ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "../components/ui/pagination";

type PaginationControlsProps = {
    page: number;
    totalPages: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    sortBy: "startDate" | "endDate" | "ballotName" | "votes";
    sortDir: "asc" | "desc";
    status: "open" | "closed" | "all";
}

export const PaginationControls = ({ page, totalPages, setPage, sortBy, sortDir, status }: PaginationControlsProps) => useMemo(() => {
    // Keep controls stable; disable safely when pages are unknown/0
    const safeTotalPages = Math.max(totalPages, 1);
    const isFirst = page === 0;
    const isLast = page + 1 >= safeTotalPages;

    return (
        <Pagination className="mt-6 flex justify-center">
            <PaginationContent className="flex gap-2 items-center">
                <PaginationItem>
                    <Button
                        variant="outline"
                        onClick={() => setPage(0)}
                        disabled={isFirst}
                    >
                        First
                    </Button>
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
                        onClick={() =>
                            !isLast && setPage((p) => Math.min(p + 1, safeTotalPages - 1))
                        }
                        className={isLast ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>

                <PaginationItem>
                    <Button
                        variant="outline"
                        onClick={() => setPage(safeTotalPages - 1)}
                        disabled={isLast}
                    >
                        Last
                    </Button>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}, [page, totalPages, sortBy, sortDir, status]);