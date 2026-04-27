import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useReducedMotion } from "framer-motion";
import { useScrollContainerToTop } from "../../hooks/useScrollContainer";
import { useCreateInitiative } from "../../hooks/useCreateInitiative";
import { useBallot } from "../../hooks/useBallot";

function parseNum(search: string, keys: string[]): number | undefined {
  const sp = new URLSearchParams(search);
  for (const k of keys) {
    const raw = sp.get(k);
    if (!raw) continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

export default function CreateInitiative() {
  const navigate = useNavigate();
  const location = useLocation();
  useReducedMotion();
  const scrollContainerRef = useScrollContainerToTop();
  const createInitiativeMutation = useCreateInitiative();

  const ballotIDFromQuery = parseNum(location.search, ["ballotID", "ballotId", "b"]);
  const state = (location.state as any) ?? {};
  const ballotID: number | undefined = ballotIDFromQuery ?? state?.ballotID ?? state?.ballot?.ballotID;

  const [initiativeName, setInitiativeName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [responses, setResponses] = React.useState<Array<{ response: string }>>([{ response: "" }]);
  const [inlineError, setInlineError] = React.useState<string | null>(null);

  const missingBallot = !ballotID;
  const ballotQuery = useBallot(ballotID, { enabled: !!ballotID });
  const isStructureLocked = Boolean(
    ballotQuery.data?.endDate &&
      new Date().getTime() > new Date(ballotQuery.data.endDate as any).getTime(),
  );

  const updateResponse = (index: number, value: string) => {
    setResponses((prev) => prev.map((item, i) => (i === index ? { response: value } : item)));
  };

  const addResponse = () => {
    setResponses((prev) => [...prev, { response: "" }]);
  };

  const removeResponse = (index: number) => {
    setResponses((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (!ballotID) {
      const msg = "Missing ballotID. Navigate from a ballot or include it in the URL.";
      setInlineError(msg);
      toast.error(msg);
      return;
    }
    if (isStructureLocked) {
      const msg = "This election has ended. Structure edits are disabled.";
      setInlineError(msg);
      toast.error(msg);
      return;
    }

    if (!initiativeName.trim()) {
      const msg = "Initiative name is required.";
      setInlineError(msg);
      toast.error(msg);
      return;
    }

    if (!responses.length || responses.some((row) => !row.response.trim())) {
      const msg = "At least one non-empty response is required.";
      setInlineError(msg);
      toast.error(msg);
      return;
    }

    try {
      await createInitiativeMutation.mutateAsync({
        ballotID,
        initiativeName: initiativeName.trim(),
        description: description.trim(),
        responses: responses.map((row) => ({ response: row.response.trim() })),
      });

      toast.success("Initiative created.");
      navigate(-1);
    } catch (err: any) {
      const msg = err?.message ?? "Failed to create initiative.";
      setInlineError(msg);
      toast.error(msg);
    }
  };

  return (
    <div ref={scrollContainerRef} className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
        <Card className="border border-white/10 bg-slate-900/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-slate-100">Create Initiative</CardTitle>
            <p className="text-sm text-slate-300">Add a new initiative and response options for this ballot.</p>
            <p className="text-xs text-slate-400">BallotID: {ballotID ?? "—"}</p>
          </CardHeader>

          <CardContent>
            {missingBallot ? (
              <div className="space-y-3">
                <p className="text-sm text-amber-200">Missing required ID. Open this page with:</p>
                <pre className="text-xs bg-black/30 border border-white/10 rounded-xl p-3 overflow-x-auto text-slate-200">
{`/create-initiative?ballotID=1601`}
                </pre>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Button>
                  <Button onClick={() => navigate("/")}>Go Home</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                {inlineError ? (
                  <div className="rounded-md border border-red-900/40 bg-red-950/30 p-3 text-red-200 text-sm">
                    {inlineError}
                  </div>
                ) : null}
                {isStructureLocked ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-950/30 p-3 text-amber-200 text-sm">
                    This election has ended. Structure edits are disabled.
                  </div>
                ) : null}

                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Initiative Name</label>
                  <Input
                    value={initiativeName}
                    onChange={(e) => setInitiativeName(e.target.value)}
                    placeholder="e.g., Approve annual sustainability pledge"
                    className="border-white/10 bg-black/20 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief context for voters..."
                    className="min-h-[120px] border-white/10 bg-black/20 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-300">Responses</label>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={addResponse}
                      disabled={isStructureLocked}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Response
                    </Button>
                  </div>

                  {responses.map((row, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={row.response}
                        onChange={(e) => updateResponse(idx, e.target.value)}
                        placeholder={idx === 0 ? "Yes" : "No"}
                        className="border-white/10 bg-black/20 text-slate-100"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeResponse(idx)}
                        disabled={responses.length <= 1 || isStructureLocked}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="bg-white/10 hover:bg-white/15 text-slate-100"
                    disabled={createInitiativeMutation.isPending || isStructureLocked}
                  >
                    {createInitiativeMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Create
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={createInitiativeMutation.isPending}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
