import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { candidate } from "@prisma/client";
import { addCandidate } from "../lib/form-actions";

type Vars = {
  positionID: number;
  ballotID: number;
  fName: string;
  lName: string;
  titles: string;
  description: string;
  picture: string;
};

export function useCreateCandidate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ positionID, ballotID, fName, lName, titles, description, picture }: Vars) => {
      const payload = { positionID, fName, lName, titles, description, picture };
      return addCandidate(payload, ballotID); // should throw on error
    },

    onMutate: async (vars) => {
      // Only cancel/optimistically update the ballotResults for THIS ballot
      await qc.cancelQueries({ queryKey: ["ballotResults", vars.ballotID] });

      const prev = qc.getQueryData(["ballotResults", vars.ballotID]);

      // Optional optimistic update: append a temp candidate into results shape
      qc.setQueryData(["ballotResults", vars.ballotID], (old: any) => {
        if (!old?.results?.positions) return old;

        const next = structuredClone(old);

        const pos = next.results.positions.find((p: any) => p.positionID === vars.positionID);
        if (!pos) return old;

        // Your UI uses: position.candidates.map(c => c.candidate)
        pos.candidates = pos.candidates ?? [];
        pos.candidates.push({
          candidate: {
            candidateID: -1,
            fName: vars.fName,
            lName: vars.lName,
            titles: vars.titles,
            description: vars.description,
            picture: vars.picture,
          } satisfies Partial<candidate>,
          _count: { positionVotes: 0 },
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

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["ballotResults", vars.ballotID] });
    },
  });
}
