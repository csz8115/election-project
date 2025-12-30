import { user } from "@prisma/client";
import { LoginFormSchema, type LoginState } from "../types/login-types";

/// <reference types="vite/client" />


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