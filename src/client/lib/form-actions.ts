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

export async function changeDate({ballotID, newStartDate, newEndDate}: changeBallotDateInput): Promise<any> {
    const normalizedIds = (Array.isArray(ballotID) ? ballotID : [ballotID]).map(Number);
    const invalidIds = normalizedIds.filter(id => Number.isNaN(id) || id <= 0);

    if (invalidIds.length > 0) {
        return {
            success: false,
            error: `Invalid ballot ID${invalidIds.length > 1 ? 's' : ''}: ${invalidIds.join(', ')}`,
        };
    }

    const hasValidStartDate = newStartDate instanceof Date && !Number.isNaN(newStartDate.getTime());
    const hasValidEndDate = newEndDate instanceof Date && !Number.isNaN(newEndDate.getTime());

    if (!hasValidStartDate && !hasValidEndDate) {
        return {
            success: false,
            error: 'You must provide at least one valid start date or end date.',
        };
    }

    const updateResults = await Promise.all(
        normalizedIds.map(async (id) => {
            const payload: Record<string, unknown> = { ballotID: id };

            if (hasValidStartDate) {
                payload.newStartDate = newStartDate!.toISOString().slice(0, 10);
            }

            if (hasValidEndDate) {
                payload.newEndDate = newEndDate!.toISOString().slice(0, 10);
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/employee/changeDate`, {
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
                        ? (errorData as { error?: string }).error ?? 'Failed to change date'
                        : 'Failed to change date';

                return { id, success: false as const, error: errorMessage };
            }

            return { id, success: true as const };
        }),
    );

    const failed = updateResults.filter(result => !result.success);
    if (failed.length > 0) {
        return {
            success: false,
            updatedBallotIds: updateResults.filter(result => result.success).map(result => result.id),
            errors: failed.reduce<Record<number, string>>((acc, result) => {
                acc[result.id] = result.error ?? 'Failed to change date';
                return acc;
            }, {}),
        };
    }

    return {
        success: true,
        updatedBallotIds: normalizedIds,
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