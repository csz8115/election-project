import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
} from "../components/ui/field";
import { Input } from "../components/ui/input";
import { useState } from "react";
import { useCompanies } from "../hooks/useCompanies";
import SelectCompany from "../components/createBallot/selectCompany";


type Candidate = {
    fName: string;
    lName: string;
    titles?: string;
    description?: string;
    picture?: string;
};

type Position = {
    positionName: string;
    allowedVotes: number;
    writeIn: boolean;
    candidates: Candidate[];
};

type InitiativeResponse = {
    response: string;
};

type Initiative = {
    initiativeName: string;
    description?: string;
    picture?: string;
    responses: InitiativeResponse[];
};

export default function CreateBallot() {
    const [ballotName, setBallotName] = useState("");
    const [description, setDescription] = useState("");

    // Use datetime-local so it’s easy for admins; server can parse ISO
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [positions, setPositions] = useState<Position[]>([
        { positionName: "", allowedVotes: 1, writeIn: false, candidates: [{ fName: "", lName: "" }] },
    ]);

    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const { data: companiesData, isLoading: companiesIsLoading, isError: companiesIsError } = useCompanies();
    const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set());


    // ---------- helpers ----------
    const addPosition = () => {
        setPositions((prev) => [
            ...prev,
            { positionName: "", allowedVotes: 1, writeIn: false, candidates: [{ fName: "", lName: "" }] },
        ]);
    };

    const removePosition = (idx: number) => {
        setPositions((prev) => prev.filter((_, i) => i !== idx));
    };

    const updatePosition = <K extends keyof Position>(idx: number, key: K, val: Position[K]) => {
        setPositions((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: val } : p)));
    };

    const addCandidate = (posIdx: number) => {
        setPositions((prev) =>
            prev.map((p, i) =>
                i === posIdx ? { ...p, candidates: [...p.candidates, { fName: "", lName: "" }] } : p
            )
        );
    };

    const removeCandidate = (posIdx: number, candIdx: number) => {
        setPositions((prev) =>
            prev.map((p, i) =>
                i === posIdx ? { ...p, candidates: p.candidates.filter((_, c) => c !== candIdx) } : p
            )
        );
    };

    const updateCandidate = <K extends keyof Candidate>(
        posIdx: number,
        candIdx: number,
        key: K,
        val: Candidate[K]
    ) => {
        setPositions((prev) =>
            prev.map((p, i) => {
                if (i !== posIdx) return p;
                const nextCandidates = p.candidates.map((c, j) => (j === candIdx ? { ...c, [key]: val } : c));
                return { ...p, candidates: nextCandidates };
            })
        );
    };

    const addInitiative = () => {
        setInitiatives((prev) => [...prev, { initiativeName: "", description: "", picture: "", responses: [{ response: "" }] }]);
    };

    const removeInitiative = (idx: number) => {
        setInitiatives((prev) => prev.filter((_, i) => i !== idx));
    };

    const updateInitiative = <K extends keyof Initiative>(idx: number, key: K, val: Initiative[K]) => {
        setInitiatives((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
    };

    const addInitiativeResponse = (initIdx: number) => {
        setInitiatives((prev) =>
            prev.map((it, i) =>
                i === initIdx ? { ...it, responses: [...it.responses, { response: "" }] } : it
            )
        );
    };

    const removeInitiativeResponse = (initIdx: number, respIdx: number) => {
        setInitiatives((prev) =>
            prev.map((it, i) =>
                i === initIdx ? { ...it, responses: it.responses.filter((_, r) => r !== respIdx) } : it
            )
        );
    };

    const updateInitiativeResponse = (initIdx: number, respIdx: number, val: string) => {
        setInitiatives((prev) =>
            prev.map((it, i) => {
                if (i !== initIdx) return it;
                const next = it.responses.map((r, j) => (j === respIdx ? { response: val } : r));
                return { ...it, responses: next };
            })
        );
    };

    const validate = () => {
        setErrorMsg(null);
        setSuccessMsg(null);

        if (!ballotName.trim()) return "Ballot name is required.";
        if (!description.trim()) return "Description is required.";
        if (!startDate) return "Start date is required.";
        if (!endDate) return "End date is required.";
        if (selectedCompanies.size === 0) return "At least one company must be selected.";

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Start/End date must be valid.";
        if (end <= start) return "End date must be after start date.";

        if (!positions.length) return "At least one position is required.";
        for (const [i, p] of positions.entries()) {
            if (!p.positionName.trim()) return `Position #${i + 1}: position name is required.`;
            if (!Number.isFinite(p.allowedVotes) || p.allowedVotes < 1) return `Position #${i + 1}: allowed votes must be >= 1.`;
            if (!p.candidates?.length) return `Position #${i + 1}: at least one candidate required.`;
            for (const [j, c] of p.candidates.entries()) {
                if (!c.fName?.trim() || !c.lName?.trim()) return `Position #${i + 1}, Candidate #${j + 1}: first and last name required.`;
            }
        }

        // initiatives optional, but if present ensure name/response text is sane
        for (const [i, it] of initiatives.entries()) {
            if (!it.initiativeName.trim()) return `Initiative #${i + 1}: initiative name is required.`;
            if (!it.responses?.length) return `Initiative #${i + 1}: at least one response is required.`;
            for (const [j, r] of it.responses.entries()) {
                if (!r.response.trim()) return `Initiative #${i + 1}, Response #${j + 1}: response text required.`;
            }
        }

        return null;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const err = validate();
        if (err) {
            setErrorMsg(err);
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const payload = {
                ballotName: ballotName.trim(),
                description: description.trim(),
                startDate, // server parses
                endDate,
                companyID: Array.from(selectedCompanies)[0],
                positions: positions.map((p) => ({
                    positionName: p.positionName.trim(),
                    allowedVotes: Number(p.allowedVotes),
                    writeIn: Boolean(p.writeIn),
                    candidates: p.candidates.map((c) => ({
                        fName: c.fName.trim(),
                        lName: c.lName.trim(),
                        titles: c.titles ?? "",
                        description: c.description ?? "",
                        picture: c.picture ?? "",
                    })),
                })),
                initiatives: initiatives.map((it) => ({
                    initiativeName: it.initiativeName.trim(),
                    description: it.description ?? "",
                    picture: it.picture ?? "",
                    responses: it.responses.map((r) => ({ response: r.response.trim() })),
                })),
            };

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}api/v1/employee/createBallot`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setErrorMsg(data?.error ?? "Failed to create ballot.");
                return;
            }

            setSuccessMsg("Ballot created successfully.");

            // optional: reset form
            setBallotName("");
            setDescription("");
            setStartDate("");
            setEndDate("");
            setSelectedCompanies(new Set());
            setPositions([{ positionName: "", allowedVotes: 1, writeIn: false, candidates: [{ fName: "", lName: "" }] }]);
            setInitiatives([]);
        } catch (err: any) {
            setErrorMsg(err?.message ?? "Failed to create ballot.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return companiesData && (
        <div className="min-h-screen w-full bg-slate-950 text-slate-300">
            <div className="p-4 space-y-4 max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-100">Create Ballot</h1>
                <p className="text-slate-400">
                    Build positions/candidates and optional initiatives, then submit to create the ballot.
                </p>

                {errorMsg && (
                    <div className="rounded-md border border-red-900/40 bg-red-950/30 p-3 text-red-200">
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="rounded-md border border-emerald-900/40 bg-emerald-950/30 p-3 text-emerald-200">
                        {successMsg}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    <FieldSet className="bg-slate-900/20 border border-slate-800 rounded-xl p-4">
                        <FieldLegend className="text-slate-200">Ballot Info</FieldLegend>
                        <FieldDescription className="text-slate-400">
                            Required details for the ballot.
                        </FieldDescription>

                        <FieldGroup className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel>Ballot Name</FieldLabel>
                                <Input
                                    value={ballotName}
                                    onChange={(e) => setBallotName(e.target.value)}
                                    className="bg-slate-950/40 border-slate-800"
                                    placeholder="e.g. 2026 Officer Election"
                                />
                            </Field>

                            <SelectCompany
                                companiesData={companiesData || []}
                                companiesIsLoading={companiesIsLoading}
                                companiesIsError={companiesIsError}
                                selectedCompanies={selectedCompanies}
                                setSelectedCompanies={setSelectedCompanies}
                            />



                            <Field className="md:col-span-2">
                                <FieldLabel>Description</FieldLabel>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="bg-slate-950/40 border-slate-800"
                                    placeholder="Short overview of what this ballot is for"
                                />
                            </Field>

                            <Field>
                                <FieldLabel>Start Date</FieldLabel>
                                <Input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-slate-950/40 border-slate-800"
                                />
                            </Field>

                            <Field>
                                <FieldLabel>End Date</FieldLabel>
                                <Input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-slate-950/40 border-slate-800"
                                />
                            </Field>
                        </FieldGroup>
                    </FieldSet>

                    <FieldSet className="bg-slate-900/20 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <FieldLegend className="text-slate-200">Positions</FieldLegend>
                                <FieldDescription className="text-slate-400">
                                    Each position can have candidates and settings.
                                </FieldDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                                onClick={addPosition}
                            >
                                + Add Position
                            </Button>
                        </div>

                        <div className="mt-4 space-y-6">
                            {positions.map((pos, posIdx) => (
                                <div key={posIdx} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-slate-200 font-semibold">
                                            Position #{posIdx + 1}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                                                onClick={() => addCandidate(posIdx)}
                                            >
                                                + Candidate
                                            </Button>
                                            {positions.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                                                    onClick={() => removePosition(posIdx)}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <FieldSeparator className="my-4 bg-slate-800" />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Field className="md:col-span-2">
                                            <FieldLabel>Position Name</FieldLabel>
                                            <Input
                                                value={pos.positionName}
                                                onChange={(e) => updatePosition(posIdx, "positionName", e.target.value)}
                                                className="bg-slate-950/40 border-slate-800"
                                                placeholder="e.g. President"
                                            />
                                        </Field>

                                        <Field>
                                            <FieldLabel>Allowed Votes</FieldLabel>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={pos.allowedVotes}
                                                onChange={(e) => updatePosition(posIdx, "allowedVotes", Number(e.target.value))}
                                                className="bg-slate-950/40 border-slate-800"
                                            />
                                        </Field>

                                        <div className="flex items-center gap-3 md:col-span-3">
                                            <Checkbox
                                                checked={pos.writeIn}
                                                onCheckedChange={(val) => updatePosition(posIdx, "writeIn", Boolean(val))}
                                                className="border-slate-700 bg-slate-900 data-[state=checked]:bg-blue-600"
                                            />
                                            <span className="text-slate-200">Allow Write-In</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-4">
                                        <div className="text-sm text-slate-300 font-medium">Candidates</div>

                                        {pos.candidates.map((cand, candIdx) => (
                                            <div key={candIdx} className="rounded-lg border border-slate-800 bg-slate-900/10 p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="text-slate-300 text-sm">
                                                        Candidate #{candIdx + 1}
                                                    </div>
                                                    {pos.candidates.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                                                            onClick={() => removeCandidate(posIdx, candIdx)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <Field>
                                                        <FieldLabel>First Name</FieldLabel>
                                                        <Input
                                                            value={cand.fName}
                                                            onChange={(e) => updateCandidate(posIdx, candIdx, "fName", e.target.value)}
                                                            className="bg-slate-950/40 border-slate-800"
                                                        />
                                                    </Field>

                                                    <Field>
                                                        <FieldLabel>Last Name</FieldLabel>
                                                        <Input
                                                            value={cand.lName}
                                                            onChange={(e) => updateCandidate(posIdx, candIdx, "lName", e.target.value)}
                                                            className="bg-slate-950/40 border-slate-800"
                                                        />
                                                    </Field>

                                                    <Field className="md:col-span-2">
                                                        <FieldLabel>Titles (optional)</FieldLabel>
                                                        <Input
                                                            value={cand.titles ?? ""}
                                                            onChange={(e) => updateCandidate(posIdx, candIdx, "titles", e.target.value)}
                                                            className="bg-slate-950/40 border-slate-800"
                                                            placeholder="e.g. Treasurer, Board Member"
                                                        />
                                                    </Field>

                                                    <Field className="md:col-span-2">
                                                        <FieldLabel>Description (optional)</FieldLabel>
                                                        <Input
                                                            value={cand.description ?? ""}
                                                            onChange={(e) => updateCandidate(posIdx, candIdx, "description", e.target.value)}
                                                            className="bg-slate-950/40 border-slate-800"
                                                            placeholder="Short candidate bio"
                                                        />
                                                    </Field>

                                                    <Field className="md:col-span-2">
                                                        <FieldLabel>Picture URL (optional)</FieldLabel>
                                                        <Input
                                                            value={cand.picture ?? ""}
                                                            onChange={(e) => updateCandidate(posIdx, candIdx, "picture", e.target.value)}
                                                            className="bg-slate-950/40 border-slate-800"
                                                            placeholder="https://..."
                                                        />
                                                    </Field>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FieldSet>

                    <FieldSet className="bg-slate-900/20 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <FieldLegend className="text-slate-200">Initiatives (optional)</FieldLegend>
                                <FieldDescription className="text-slate-400">
                                    Add initiatives with possible responses (e.g. Yes/No).
                                </FieldDescription>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                                onClick={addInitiative}
                            >
                                + Add Initiative
                            </Button>
                        </div>

                        <div className="mt-4 space-y-6">
                            {initiatives.length === 0 ? (
                                <div className="text-slate-500 text-sm">No initiatives added.</div>
                            ) : (
                                initiatives.map((it, itIdx) => (
                                    <div key={itIdx} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-slate-200 font-semibold">Initiative #{itIdx + 1}</div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                                                onClick={() => removeInitiative(itIdx)}
                                            >
                                                Remove
                                            </Button>
                                        </div>

                                        <FieldSeparator className="my-4 bg-slate-800" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Field className="md:col-span-2">
                                                <FieldLabel>Initiative Name</FieldLabel>
                                                <Input
                                                    value={it.initiativeName}
                                                    onChange={(e) => updateInitiative(itIdx, "initiativeName", e.target.value)}
                                                    className="bg-slate-950/40 border-slate-800"
                                                    placeholder="e.g. Approve 2026 Budget"
                                                />
                                            </Field>

                                            <Field className="md:col-span-2">
                                                <FieldLabel>Description (optional)</FieldLabel>
                                                <Input
                                                    value={it.description ?? ""}
                                                    onChange={(e) => updateInitiative(itIdx, "description", e.target.value)}
                                                    className="bg-slate-950/40 border-slate-800"
                                                />
                                            </Field>

                                            <Field className="md:col-span-2">
                                                <FieldLabel>Picture URL (optional)</FieldLabel>
                                                <Input
                                                    value={it.picture ?? ""}
                                                    onChange={(e) => updateInitiative(itIdx, "picture", e.target.value)}
                                                    className="bg-slate-950/40 border-slate-800"
                                                    placeholder="https://..."
                                                />
                                            </Field>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-slate-300 font-medium">Responses</div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                                                    onClick={() => addInitiativeResponse(itIdx)}
                                                >
                                                    + Response
                                                </Button>
                                            </div>

                                            {it.responses.map((r, rIdx) => (
                                                <div key={rIdx} className="flex gap-2 items-center">
                                                    <Input
                                                        value={r.response}
                                                        onChange={(e) => updateInitiativeResponse(itIdx, rIdx, e.target.value)}
                                                        className="bg-slate-950/40 border-slate-800"
                                                        placeholder="e.g. Yes"
                                                    />
                                                    {it.responses.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                                                            onClick={() => removeInitiativeResponse(itIdx, rIdx)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </FieldSet>

                    <div className="flex items-center justify-end gap-3">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            {isSubmitting ? "Creating..." : "Create Ballot"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
