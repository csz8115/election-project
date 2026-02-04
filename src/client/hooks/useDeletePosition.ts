import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePosition } from "../lib/form-actions";

type Vars = {
    positionID: number;
};

export function useDeletePosition() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ positionID }: Vars) => {
            return deletePosition(positionID); // should throw on error
        },

        onSettled: (_data, _error, _vars) => {
            // Invalidate any queries that may be affected by position deletions
            qc.invalidateQueries({ queryKey: ["positions"] });
            qc.invalidateQueries({ queryKey: ["ballots"] });
            qc.invalidateQueries({ queryKey: ["ballotResults"] });
        },
        onError: (error) => {
            console.error("Error deleting position(s):", error);
        },
    });
}