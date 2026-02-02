import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeDate } from "../lib/form-actions";

type Vars = {
    ballotID: number | number[];
    newStartDate?: Date;
    newEndDate?: Date;
    
}

export function useChangeDate() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ ballotID, newStartDate, newEndDate }: Vars) => {
            return changeDate({ballotID, newStartDate, newEndDate}); // should throw on error
        },

        onSettled: (_data, _error, _vars) => {
            // Invalidate any queries that may be affected by date changes
            qc.invalidateQueries({ queryKey: ["ballots"] });
            qc.invalidateQueries({ queryKey: ["ballotResults"] });
            qc.invalidateQueries({ queryKey: ["companyStats"] });
        },
        onError: (error) => {
            console.error("Error changing ballot dates:", error);
        },
    });
}
