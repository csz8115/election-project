import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCandidate } from "../lib/form-actions";

type Vars = {
    candidateID: number;
};

export function useDeleteCandidate() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ candidateID }: Vars) => {
            return deleteCandidate(candidateID); // should throw on error
        },

        onSettled: (_data, _error, _vars) => {
            // Invalidate any queries that may be affected by candidate deletions
            qc.invalidateQueries({ queryKey: ["candidates"] });
            qc.invalidateQueries({ queryKey: ["ballots"] });
            qc.invalidateQueries({ queryKey: ["ballotResults"] });
        },
        onError: (error) => {
            console.error("Error deleting candidate(s):", error);
        },
    });
}