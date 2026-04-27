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
import { useCreateCandidate } from "../../hooks/useCreateCandidate";
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

export default function CreateCandidate() {
  const navigate = useNavigate();
  const location = useLocation();
  useReducedMotion(); // keep if you use it elsewhere
  const scrollContainerRef = useScrollContainerToTop();
  const createCandidateMutation = useCreateCandidate();

  // ✅ Prefer query params (refresh-safe), fallback to location.state
  const positionIDFromQuery = parseNum(location.search, ["positionID", "positionId", "p"]);
  const ballotIDFromQuery = parseNum(location.search, ["ballotID", "ballotId", "b"]);

  const state = (location.state as any) ?? {};
  const positionID: number | undefined = positionIDFromQuery ?? state?.positionID;
  const ballotID: number | undefined = ballotIDFromQuery ?? state?.ballotID ?? state?.ballot?.ballotID;

  const [fName, setFName] = React.useState("");
  const [lName, setLName] = React.useState("");
  const [titles, setTitles] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [picture, setPicture] = React.useState("");

  const missingIDs = !positionID || !ballotID;
  const ballotQuery = useBallot(ballotID, { enabled: !!ballotID });
  const isStructureLocked = Boolean(
    ballotQuery.data?.endDate &&
      new Date().getTime() > new Date(ballotQuery.data.endDate as any).getTime(),
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!positionID || !ballotID) {
      toast.error("Missing positionID or ballotID. Navigate from a ballot position or include them in the URL.");
      return;
    }
    if (isStructureLocked) {
      toast.error("This election has ended. Structure edits are disabled.");
      return;
    }

    if (!fName.trim() || !lName.trim()) {
      toast.error("First and last name are required.");
      return;
    }

    try {
      await createCandidateMutation.mutateAsync({
        positionID,
        ballotID,
        fName: fName.trim(),
        lName: lName.trim(),
        titles: titles.trim(),
        description: description.trim(),
        picture: picture.trim(),
      });

      toast.success("Candidate created.");
      navigate(-1);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create candidate.");
    }
  };

  return (
    <div ref={scrollContainerRef} className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
        <Card className="border border-white/10 bg-slate-900/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-slate-100">Create Candidate</CardTitle>
            <p className="text-sm text-slate-300">
              Add a new candidate for this position.
            </p>
            <p className="text-xs text-slate-400">
              PositionID: {positionID ?? "—"} • BallotID: {ballotID ?? "—"}
            </p>
          </CardHeader>

          <CardContent>
            {missingIDs ? (
              <div className="space-y-3">
                <p className="text-sm text-amber-200">
                  Missing required IDs. Open this page with:
                </p>
                <pre className="text-xs bg-black/30 border border-white/10 rounded-xl p-3 overflow-x-auto text-slate-200">
{`/create-candidate?positionID=123&ballotID=1601`}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm text-slate-300">First Name</label>
                    <Input
                      value={fName}
                      onChange={(e) => setFName(e.target.value)}
                      placeholder="Jane"
                      className="border-white/10 bg-black/20 text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-slate-300">Last Name</label>
                    <Input
                      value={lName}
                      onChange={(e) => setLName(e.target.value)}
                      placeholder="Doe"
                      className="border-white/10 bg-black/20 text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Titles</label>
                  <Input
                    value={titles}
                    onChange={(e) => setTitles(e.target.value)}
                    placeholder="e.g., Treasurer • CPA"
                    className="border-white/10 bg-black/20 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short bio / platform..."
                    className="min-h-[120px] border-white/10 bg-black/20 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Picture URL</label>
                  <Input
                    value={picture}
                    onChange={(e) => setPicture(e.target.value)}
                    placeholder="https://..."
                    className="border-white/10 bg-black/20 text-slate-100"
                  />
                  <p className="text-xs text-slate-500">
                    Optional. You can later switch to file uploads.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="bg-white/10 hover:bg-white/15 text-slate-100"
                    disabled={createCandidateMutation.isPending || isStructureLocked}
                  >
                    {createCandidateMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Create
                  </Button>

                  <Button variant="outline" onClick={() => navigate(-1)} disabled={createCandidateMutation.isPending}>
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
