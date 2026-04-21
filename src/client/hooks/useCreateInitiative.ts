import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addInitiative } from "../lib/form-actions";

type Vars = {
  ballotID: number;
  initiativeName: string;
  description: string;
  responses: Array<{ response: string }>;
};

export function useCreateInitiative() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ballotID, initiativeName, description, responses }: Vars) => {
      const payload = { initiativeName, description, responses };
      const result = await addInitiative(payload, ballotID);
      if (!result?.success) {
        throw new Error(result?.error ?? "Failed to create initiative");
      }
      return result;
    },

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["ballotResults", vars.ballotID] });
      qc.invalidateQueries({ queryKey: ["ballot", vars.ballotID] });
    },
  });
}
