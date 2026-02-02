import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ballotPositions } from "@prisma/client";
import { addPosition } from "../lib/form-actions";

type Vars = {
    positionName: string;
    allowedVotes: number;
    writeIn: boolean;
    ballotID: number;
}

export function useCreatePosition() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ positionName, allowedVotes, writeIn, ballotID }: Vars) => {
            const payload = { positionName, allowedVotes, writeIn };
            return addPosition(payload, ballotID); // should throw on error
        },

        onMutate: async (vars) => {
            // Only cancel/optimistically update the ballotResults for THIS ballot
            await qc.cancelQueries({ queryKey: ["ballotResults", vars.ballotID] });

            const prev = qc.getQueryData(["ballotResults", vars.ballotID]);

            // Optional optimistic update: append a temp position into results shape
            qc.setQueryData(["ballotResults", vars.ballotID], (old: any) => {
                if (!old?.results?.positions) return old;

                const next = structuredClone(old);

                next.results.positions.push({
                    position: {
                        positionID: -1,
                        positionName: vars.positionName,
                        allowedVotes: vars.allowedVotes,
                        writeIn: vars.writeIn,
                    } satisfies Partial<ballotPositions>,
                    candidates: [],
                });

                return next;
            });

            return { prev, ballotID: vars.ballotID };
        },

        onError: (_err, _vars, ctx) => {
            if (ctx?.prev) {
                qc.setQueryData(["ballotResults", ctx.ballotID], ctx.prev);
            }
        },

        onSettled: (_data, _error, vars) => {
            qc.invalidateQueries({ queryKey: ["ballotResults", vars.ballotID] });
        },
    });
}