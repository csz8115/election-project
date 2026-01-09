import { useQuery } from "@tanstack/react-query";

type Company = {
    companyID?: number;
    companyName?: string;
    abbreviation?: string;
    category?: string;
}

export function useCompanies() {
    return useQuery<Company[]>({
        queryKey: ['companies'],
        queryFn: async () => {
            const url = new URL(`${import.meta.env.VITE_API_URL}api/v1/employee/getCompanies`);
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        refetchOnWindowFocus: false,
        retry: (failureCount, err: any) => {
            // don’t retry on “not found” type situations; only retry a couple times on real network errors
            if (String(err?.message || "").toLowerCase().includes("404")) return false;
            return failureCount < 2;
        },
    });
}