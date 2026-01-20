import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { candidate } from "@prisma/client";
import { editCandidate } from "../lib/form-actions"; 

type Vars = {
  candidateID: number;
  patch: Partial<candidate>;
};

export function useEditCandidate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ candidateID, patch }: Vars) => {
      // editCandidate should throw on error
      const payload = {
        candidateID,
        fName: patch.fName ?? undefined,
        lName: patch.lName ?? undefined,
        titles: patch.titles ?? undefined,
        description: patch.description ?? undefined,
        picture: patch.picture ?? undefined,
      };

      return editCandidate(payload);
    },

    onMutate: async ({ candidateID, patch }) => {
      await qc.cancelQueries();
      const snapshot = qc.getQueryCache().getAll().map((q) => ({
        key: q.queryKey,
        data: qc.getQueryData(q.queryKey),
      }));

      qc.getQueryCache().getAll().forEach((q) => {
        qc.setQueryData(q.queryKey, (old: any) => {
          if (!old) return old;

          // patch common shapes
          if (old?.candidateID === candidateID) return { ...old, ...patch };
          if (old?.candidate?.candidateID === candidateID)
            return { ...old, candidate: { ...old.candidate, ...patch } };
          if (Array.isArray(old?.candidates))
            return {
              ...old,
              candidates: old.candidates.map((c: any) =>
                c?.candidateID === candidateID ? { ...c, ...patch } : c
              ),
            };
          if (Array.isArray(old))
            return old.map((c: any) => (c?.candidateID === candidateID ? { ...c, ...patch } : c));

          return old;
        });
      });

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx?.snapshot) return;
      for (const item of ctx.snapshot) qc.setQueryData(item.key, item.data);
    },

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["candidates"] });
      qc.invalidateQueries({ queryKey: ["candidate", vars.candidateID] });
      qc.invalidateQueries({ queryKey: ["ballotResults"] });
    },
  });
}
