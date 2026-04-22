import type { user } from "@prisma/client";
import { LoginFormSchema, type LoginState } from "../types/login-types";

/// <reference types="vite/client" />

declare global {
    interface ImportMetaEnv {
        readonly VITE_API_URL: string;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

type DeleteBallotInput = number | number[];

type changeBallotDateInput = {
    ballotID: number | number[];
    newEndDate?: Date;
    newStartDate?: Date;
}

type CandidateInput = {
    candidateID: number;
    fName?: string;
    lName?: string;
    titles?: string;
    description?: string;
    picture?: string;
}

type addCandidateInput = {
    positionID: number;
    fName: string;
    lName: string;
    titles: string;
    description: string;
    picture: string;
}

type BallotInput = {
    ballotID: number;
    ballotName?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
}

type addPositionInput = {
    positionName: string;
    allowedVotes?: number;
    writeIn?: boolean;
    ballotID?: number;
}

type addInitiativeInput = {
    initiativeName: string;
    description?: string;
    responses: Array<{ response: string }>;
}

export async function deleteBallot(ballotID: DeleteBallotInput): Promise<any> {
    const normalizedIds = (Array.isArray(ballotID) ? ballotID : [ballotID]).map(Number);
    const invalidIds = normalizedIds.filter(id => Number.isNaN(id) || id <= 0);

    if (invalidIds.length > 0) {
        return {
            success: false,
            error: `Invalid ballot ID${invalidIds.length > 1 ? 's' : ''}: ${invalidIds.join(', ')}`,
        };
    }

    const deletionResults = await Promise.all(
        normalizedIds.map(async (id) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/employee/deleteBallot?ballotID=${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage =
                    typeof errorData === 'object' && errorData !== null && 'error' in errorData
                        ? (errorData as { error?: string }).error ?? 'Failed to delete ballot'
                        : 'Failed to delete ballot';

                return { id, success: false as const, error: errorMessage };
            }

            return { id, success: true as const };
        }),
    );

    const failed = deletionResults.filter(result => !result.success);
    if (failed.length > 0) {
        return {
            success: false,
            deletedBallotIds: deletionResults.filter(result => result.success).map(result => result.id),
            errors: failed.reduce<Record<number, string>>((acc, result) => {
                acc[result.id] = result.error ?? 'Failed to delete ballot';
                return acc;
            }, {}),
        };
    }

    return {
        success: true,
        deletedBallotIds: normalizedIds,
    };
}

export async function changeDate({
    ballotID,
    newStartDate,
    newEndDate,
}: changeBallotDateInput): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
    const normalizedIds = (Array.isArray(ballotID) ? ballotID : [ballotID]).map(Number);
    const invalidIds = normalizedIds.filter((id) => Number.isNaN(id) || id <= 0);

    if (invalidIds.length > 0) {
        return {
            success: false,
            error: `Invalid ballot ID${invalidIds.length > 1 ? "s" : ""}: ${invalidIds.join(", ")}`,
        };
    }

    const hasValidStartDate = newStartDate instanceof Date && !Number.isNaN(newStartDate.getTime());
    const hasValidEndDate = newEndDate instanceof Date && !Number.isNaN(newEndDate.getTime());

    if (!hasValidStartDate && !hasValidEndDate) {
        return {
            success: false,
            error: "You must provide at least one valid start date or end date.",
        };
    }

    const payload: Record<string, unknown> = {
        ballotID: normalizedIds, // ✅ send array once
    };

    // IMPORTANT: your server currently parses via `new Date(value)`
    // Sending ISO is the safest. If you slice(0,10), it's still ok,
    // but ISO avoids timezone parsing weirdness.
    if (hasValidStartDate) payload.newStartDate = newStartDate!.toISOString();
    if (hasValidEndDate) payload.newEndDate = newEndDate!.toISOString();

    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/employee/changeDate`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg =
            typeof errorData === "object" && errorData !== null && "error" in errorData
                ? (errorData as any).error ?? "Failed to change date"
                : "Failed to change date";

        return { success: false, error: msg };
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, updatedCount: data?.updatedCount };
}


export async function editCandidate({ candidateID, fName, lName, titles, description, picture }: CandidateInput): Promise<any> {
    if (Number.isNaN(candidateID) || candidateID <= 0) {
        return {
            success: false,
            error: 'Invalid candidate ID',
        };
    }

    const payload: Record<string, unknown> = { candidateID };

    if (fName !== undefined) payload.fName = fName;
    if (lName !== undefined) payload.lName = lName;
    if (titles !== undefined) payload.titles = titles;
    if (description !== undefined) payload.description = description;
    if (picture !== undefined) payload.picture = picture;

    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/employee/editCandidate`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
            typeof errorData === 'object' && errorData !== null && 'error' in errorData
                ? (errorData as { error?: string }).error ?? 'Failed to edit candidate'
                : 'Failed to edit candidate';

        return {
            success: false,
            error: errorMessage,
        };
    }

    return {
        success: true,
        message: 'Candidate edited successfully',
    };
}

export async function deleteCandidate(candidateID: number): Promise<any> {
    if (Number.isNaN(candidateID) || candidateID <= 0) {
        return {
            success: false,
            error: 'Invalid candidate ID',
        };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/employee/deleteCandidate?candidateID=${candidateID}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
            typeof errorData === 'object' && errorData !== null && 'error' in errorData
                ? (errorData as { error?: string }).error ?? 'Failed to delete candidate'
                : 'Failed to delete candidate';

        return {
            success: false,
            error: errorMessage,
        };
    }

    return {
        success: true,
        message: 'Candidate deleted successfully',
    };
}

export async function deletePosition(positionID: number): Promise<any> {
    if (Number.isNaN(positionID) || positionID <= 0) {
        return {
            success: false,
            error: 'Invalid position ID',
        };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/employee/deletePosition?positionID=${positionID}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
            typeof errorData === 'object' && errorData !== null && 'error' in errorData
                ? (errorData as { error?: string }).error ?? 'Failed to delete position'
                : 'Failed to delete position';

        return {
            success: false,
            error: errorMessage,
        };
    }

    return {
        success: true,
        message: 'Position deleted successfully',
    };
}

export async function editBallot({ ballotID, ballotName, description, startDate, endDate }: BallotInput): Promise<any> {
    if (Number.isNaN(ballotID) || ballotID <= 0) {
        return {
            success: false,
            error: 'Invalid ballot ID',
        };
    }

    const payload: Record<string, unknown> = { ballotID };

    if (ballotName !== undefined) payload.ballotName = ballotName;
    if (description !== undefined) payload.description = description;
    if (startDate !== undefined) payload.startDate = startDate;
    if (endDate !== undefined) payload.endDate = endDate;

    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/employee/editBallot`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
            typeof errorData === 'object' && errorData !== null && 'error' in errorData
                ? (errorData as { error?: string }).error ?? 'Failed to edit ballot'
                : 'Failed to edit ballot';

        return {
            success: false,
            error: errorMessage,
        };
    }

    return {
        success: true,
        message: 'Ballot edited successfully',
    };
}

export async function login(_prevState: LoginState, formData: FormData): Promise<any> {
    const validatedFields = LoginFormSchema.safeParse({
        username: formData.get('username')?.toString(),
        password: formData.get('password')?.toString(),
    });

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        return {
            success: false,
            errors: {
                username: errors.username || [],
                password: errors.password || [],
            },
        };
    }
    const { username, password } = validatedFields.data;
    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/member/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        return {
            success: false,
            errors: {
                username: [errorData.error || 'Login failed'],
                password: [],
            },
        };
    }
    const user: user = await response.json().then(data => data.user); // Assuming the response contains user data

    return {
        success: true,
        message: 'Login successful',
        user: user, // Assuming the response contains user data
    };
}

export async function getBallot(ballotID: number): Promise<any> {
    const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/v1/employee/getBallot?ballotID=${ballotID}`,
        { method: "GET", credentials: "include" }
    );

    const json = await response.json().catch(() => null);

    if (!response.ok) {
        return {
            success: false,
            error: json?.error || json?.message || "Failed to fetch ballot",
        };
    }

    // ✅ unwrap common shapes
    const ballot =
        json?.ballot ??
        json?.data ??
        json?.results?.ballot ??
        json?.results ??
        json;

    return { success: true, ballot };
}


export async function getActiveUserBallots(userID: number): Promise<any> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/member/getUserBallots?userID=${userID}`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
    });

    if (!response.ok) {
        const errorData = await response.json();
        return {
            success: false,
            error: errorData.error || 'Failed to fetch ballots',
        };
    }

    const ballots = await response.json();
    return {
        success: true,
        ballots: ballots,
    };
}

export async function getBallotResults(ballotID: number): Promise<any> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/officer/viewBallotResults?ballotID=${ballotID}`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
        headers: {
            'Content-Type': 'application/json',
        },

    });

    if (!response.ok) {
        const errorData = await response.json();
        return {
            success: false,
            error: errorData.error || 'Failed to fetch ballot results',
        };
    }

    const results = await response.json();
    return {
        success: true,
        results: results,
    };
}

export async function getBallotResultsMember(ballotID: number): Promise<any> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/member/viewBallotResults?ballotID=${ballotID}`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
        headers: {
            'Content-Type': 'application/json',
        },

    });

    if (!response.ok) {
        const errorData = await response.json();
        return {
            success: false,
            error: errorData.error || 'Failed to fetch ballot results',
        };
    }

    const results = await response.json();
    return {
        success: true,
        results: results,
    };
}

export async function addCandidate(candidateData: addCandidateInput, ballotID: number): Promise<any> {
    const payload = {
        ...candidateData,
        ballotID,
    };

    const requiredFields: (keyof addCandidateInput)[] = ["positionID", "fName", "lName", "titles", "description", "picture"];
    const missingFields = requiredFields.filter((field) => {
        const value = candidateData[field];
        return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0 || Number.isNaN(ballotID) || ballotID <= 0) {
        return {
            success: false,
            error: missingFields.length
                ? `Missing required fields: ${missingFields.join(", ")}`
                : "Invalid ballot ID",
        };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/employee/addCandidate`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
            success: false,
            error: (errorData as { error?: string }).error ?? "Failed to add candidate",
        };
    }

    const data = await response.json().catch(() => null);

    return {
        success: true,
        candidate: data?.candidate ?? data,
    };
}

export async function addPosition(positionData: addPositionInput, ballotID: number): Promise<any> {
    const payload = {
        ...positionData,
        ballotID,
    };

    const requiredFields: (keyof addPositionInput)[] = ["positionName"];
    const missingFields = requiredFields.filter((field) => {
        const value = positionData[field];
        return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0 || Number.isNaN(ballotID) || ballotID <= 0) {
        return {
            success: false,
            error: missingFields.length
                ? `Missing required fields: ${missingFields.join(", ")}`
                : "Invalid ballot ID",
        };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/employee/addPosition`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
            success: false,
            error: (errorData as { error?: string }).error ?? "Failed to add position",
        };
    }

    const data = await response.json().catch(() => null);

    return {
        success: true,
        position: data?.position ?? data,
    };
}

export async function addInitiative(initiativeData: addInitiativeInput, ballotID: number): Promise<any> {
    const payload = {
        ...initiativeData,
        ballotID,
    };

    if (Number.isNaN(ballotID) || ballotID <= 0) {
        return {
            success: false,
            error: "Invalid ballot ID",
        };
    }

    if (!initiativeData.initiativeName?.trim()) {
        return {
            success: false,
            error: "Initiative name is required",
        };
    }

    if (!Array.isArray(initiativeData.responses) || initiativeData.responses.length === 0) {
        return {
            success: false,
            error: "At least one response is required",
        };
    }

    if (initiativeData.responses.some((r) => !r.response?.trim())) {
        return {
            success: false,
            error: "Response text is required",
        };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/employee/addInitiative`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
            success: false,
            error: (errorData as { error?: string }).error ?? "Failed to add initiative",
        };
    }

    const data = await response.json().catch(() => null);

    return {
        success: true,
        initiative: data?.initiative ?? data,
    };
}

export async function getSystemReport(): Promise<any> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/admin/getSystemReport`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        return {
            success: false,
            error: errorData.error || 'Failed to fetch system report',
        };
    }
    const report = await response.json();
    return {
        success: true,
        report: report,
    };
}

export async function getCompanyStats(companyID: number): Promise<any> {
    if (Number.isNaN(companyID) || companyID <= 0) {
        return {
            success: false,
            error: "Invalid company ID",
        };
    }

    const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/v1/officer/getCompanyStats?companyID=${companyID}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        },
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
            success: false,
            error: (errorData as { error?: string }).error ?? "Failed to fetch company stats",
        };
    }

    const stats = await response.json().catch(() => null);
    return {
        success: true,
        stats,
    };
}
