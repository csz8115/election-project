import { Card } from "../components/ui/card";
import { useAllBallots } from "../hooks/useAllBallots";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "../components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
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
} from "../components/ui/alert-dialog"
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, SquareSplitHorizontal } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ballots } from "@prisma/client";
import { PulseLoader } from "react-spinners";

export default function EmployeeDash() {
    const [page, setPage] = useState(0);
    const { data, isLoading, isError } = useAllBallots(page);
    const totalPages = data?.totalCount ? data.totalCount : 0;
    const hasNextPage = data?.hasNextPage ?? false;
    const hasPreviousPage = data?.hasPreviousPage ?? false;
    const navigate = useNavigate();

    const handleCardClick = async (ballot: ballots) => {
        navigate(`/employee-ballot`, { state: { ballot }, });
    };

    if (isLoading) return <div className="flex items-center justify-center h-screen w-full">
        <PulseLoader color="#000" size={20} />
        </div>;
    if (isError) return <p>Error loading ballots</p>;

    const paginationControls = (
        <Pagination className="mt-6 flex justify-center">
            <PaginationContent className="flex gap-2 items-center">
                <PaginationItem>
                    {page !== 0 && (
                        <Button
                            variant={"outline"}
                            onClick={() => setPage(0)}
                        >
                            First
                        </Button>
                    )}
                </PaginationItem>
                <PaginationItem>
                    <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(p - 1, 0))}
                        className={`${page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                    />
                </PaginationItem>

                <span className="text-sm font-medium">Page {page + 1} of {totalPages}</span>

                <PaginationItem>
                    <PaginationNext
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                        className={`${page + 1 === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                    />
                </PaginationItem>
                {page + 1 !== totalPages && (
                    <PaginationItem>
                        <Button
                            variant={"outline"}
                            onClick={() => setPage(totalPages - 1)}
                        >
                            Last
                        </Button>
                    </PaginationItem>
                )}
            </PaginationContent>
        </Pagination>
    );

    return (
        <div className="p-4 space-y-4 flex flex-col">
            <h1 className="text-2xl">All Elections</h1>
            {/* Top Pagination */}
            {paginationControls}

            <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-xs">
                    <Input
                        type="text"
                        placeholder="Search ballots..."
                        className="w-full pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                </div>
                {/* Filtering menu */}
                <div className="flex items-center space-x-2">
                    <label htmlFor="sortBy" className="text-sm">Sort by:</label>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline">Company</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Company Filter</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Filter by company name
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="companyName" className="text-sm font-medium">Company Name (Optional)</label>
                                    <Input
                                        id="companyName"
                                        type="text"
                                        placeholder="Enter company name..."
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction>Apply Filter</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Select defaultValue="date">
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="votes">Votes</SelectItem>
                            <SelectItem value="participants">Participants</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline">
                        Filter
                    </Button>
                    <Button variant="outline" onClick={() => {
                        const gridElement = document.querySelector('.grid');
                        if (gridElement) {
                            if (gridElement.classList.contains('lg:grid-cols-4')) {
                                gridElement.classList.remove('lg:grid-cols-4');
                                gridElement.classList.add('lg:grid-cols-5');
                            } else {
                                gridElement.classList.remove('lg:grid-cols-5');
                                gridElement.classList.add('lg:grid-cols-4');
                            }
                        }
                    }}>
                        <SquareSplitHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.ballots.map((ballot: any) => (
                    <Card key={ballot.id} className="p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => handleCardClick(ballot)}>
                        <div className="">
                            <h2 className="font-bold">{ballot.ballotName}</h2>
                            <p>Start: {new Date(ballot.startDate).toLocaleDateString()}</p>
                            <p>End: {new Date(ballot.endDate).toLocaleDateString()}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Bottom Pagination */}
            {paginationControls}
        </div>
    );
}