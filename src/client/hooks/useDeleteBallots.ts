import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBallot } from "../lib/form-actions";

type Vars = {
    ballotID: number | number[];
};

export function useDeleteBallots() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ ballotID }: Vars) => {
            return deleteBallot(ballotID); // should throw on error
        },

        onSettled: (_data, _error, _vars) => {
            // Invalidate any queries that may be affected by ballot deletions
            qc.invalidateQueries({ queryKey: ["ballots"] });
            qc.invalidateQueries({ queryKey: ["ballotResults"] });
            qc.invalidateQueries({ queryKey: ["companyStats"] });
        },
        onError: (error) => {
            console.error("Error deleting ballot(s):", error);
        },
    });
}