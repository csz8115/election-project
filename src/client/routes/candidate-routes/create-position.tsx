import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useReducedMotion } from "framer-motion";
import { useScrollContainerToTop } from "../../hooks/useScrollContainer";
import { useCreatePosition } from "../../hooks/useCreatePosition";
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

export default function CreatePosition() {
  const navigate = useNavigate();
  const location = useLocation();
  useReducedMotion(); // keep if you use it elsewhere
  const scrollContainerRef = useScrollContainerToTop();
  const createPositionMutation = useCreatePosition();

  // ✅ Prefer query params (refresh-safe), fallback to location.state
  // Typical: /create-position?ballotID=1601
  const ballotIDFromQuery = parseNum(location.search, ["ballotID", "ballotId", "b"]);

  const state = (location.state as any) ?? {};
  const ballotID: number | undefined =
    ballotIDFromQuery ?? state?.ballotID ?? state?.ballot?.ballotID;

  const [positionName, setPositionName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [maxWinners, setMaxWinners] = React.useState<string>("1"); // keep as string for input UX
  const [sortOrder, setSortOrder] = React.useState<string>(""); // optional

  const missingBallot = !ballotID;
  const ballotQuery = useBallot(ballotID, { enabled: !!ballotID });
  const isStructureLocked = Boolean(
    ballotQuery.data?.endDate &&
      new Date().getTime() > new Date(ballotQuery.data.endDate as any).getTime(),
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ballotID) {
      toast.error("Missing ballotID. Navigate from a ballot or include it in the URL.");
      return;
    }
    if (isStructureLocked) {
      toast.error("This election has ended. Structure edits are disabled.");
      return;
    }

    if (!positionName.trim()) {
      toast.error("Position name is required.");
      return;
    }

    const parsedMaxWinners = Number(maxWinners);
    if (!Number.isFinite(parsedMaxWinners) || parsedMaxWinners <= 0) {
      toast.error("Max winners must be a positive number.");
      return;
    }

    let parsedSortOrder: number | undefined = undefined;
    if (sortOrder.trim()) {
      const n = Number(sortOrder);
      if (!Number.isFinite(n) || n < 0) {
        toast.error("Sort order must be a non-negative number (or leave blank).");
        return;
      }
      parsedSortOrder = n;
    }

    try {
      await createPositionMutation.mutateAsync({
        ballotID,
        positionName: positionName.trim(),
        description: description.trim(),
        maxWinners: parsedMaxWinners,
        sortOrder: parsedSortOrder, // optional
      });

      toast.success("Position created.");
      navigate(-1);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create position.");
    }
  };

  return (
    <div ref={scrollContainerRef} className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
        <Card className="border border-white/10 bg-slate-900/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-slate-100">Create Position</CardTitle>
            <p className="text-sm text-slate-300">Add a new position for this ballot.</p>
            <p className="text-xs text-slate-400">BallotID: {ballotID ?? "—"}</p>
          </CardHeader>

          <CardContent>
            {missingBallot ? (
              <div className="space-y-3">
                <p className="text-sm text-amber-200">Missing required ID. Open this page with:</p>
                <pre className="text-xs bg-black/30 border border-white/10 rounded-xl p-3 overflow-x-auto text-slate-200">
{`/create-position?ballotID=1601`}
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
                {isStructureLocked && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-950/30 p-3 text-amber-200 text-sm">
                    This election has ended. Structure edits are disabled.
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Position Name</label>
                  <Input
                    value={positionName}
                    onChange={(e) => setPositionName(e.target.value)}
                    placeholder="e.g., Treasurer"
                    className="border-white/10 bg-black/20 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Role description / requirements / context..."
                    className="min-h-[120px] border-white/10 bg-black/20 text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm text-slate-300">Max Winners</label>
                    <Input
                      value={maxWinners}
                      onChange={(e) => setMaxWinners(e.target.value)}
                      inputMode="numeric"
                      placeholder="1"
                      className="border-white/10 bg-black/20 text-slate-100"
                    />
                    <p className="text-xs text-slate-500">Typically 1 (unless multi-seat).</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-slate-300">Sort Order</label>
                    <Input
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      inputMode="numeric"
                      placeholder="optional"
                      className="border-white/10 bg-black/20 text-slate-100"
                    />
                    <p className="text-xs text-slate-500">Optional ordering on the ballot.</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="bg-white/10 hover:bg-white/15 text-slate-100"
                    disabled={createPositionMutation.isPending || isStructureLocked}
                  >
                    {createPositionMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Create
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={createPositionMutation.isPending}
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
