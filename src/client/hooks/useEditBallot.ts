import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ballots } from "@prisma/client";
import { editBallot } from "../lib/form-actions";

type Vars = {
  ballotID: number;
  patch: Partial<ballots>;
};

export function useEditBallot() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ballotID, patch }: Vars) => {
      // editBallot should throw on error
      const formatDateInput = (value: Date | string | null | undefined) => {
        if (value == null) return undefined;
        return typeof value === "string" ? value : value.toISOString();
      };

      const payload = {
        ballotID,
        ballotName: patch.ballotName ?? undefined,
        description: patch.description ?? undefined,
        startDate: formatDateInput(patch.startDate),
        endDate: formatDateInput(patch.endDate),
      };

      return editBallot(payload);
    },

    onMutate: async ({ ballotID, patch }) => {
      await qc.cancelQueries();
      const snapshot = qc.getQueryCache().getAll().map((q) => ({
        key: q.queryKey,
        data: qc.getQueryData(q.queryKey),
      }));

      qc.getQueryCache().getAll().forEach((q) => {
        qc.setQueryData(q.queryKey, (old: any) => {
          if (!old) return old;

          // patch common shapes
          if (old?.ballotID === ballotID) return { ...old, ...patch };
          if (old?.ballot?.ballotID === ballotID)
            return { ...old, ballot: { ...old.ballot, ...patch } };
          if (Array.isArray(old?.ballots))
            return {
              ...old,
              ballots: old.ballots.map((b: any) =>
                b?.ballotID === ballotID ? { ...b, ...patch } : b
              ),
            };
          if (Array.isArray(old))
            return old.map((b: any) => (b?.ballotID === ballotID ? { ...b, ...patch } : b));

          return old;
        });
      });

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        ctx.snapshot.forEach(({ key, data }) => {
          qc.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      qc.invalidateQueries();
    },
  });
}