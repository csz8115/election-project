// src/store/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the initial state type for the user
interface UserState {
    userID: number | null;
    username: string | null;
    accountType: string | null;
    fName: string | null;
    lName: string | null;
    companyID: string | null;
    loggedIn: boolean;
}

// Define the initial state
const initialState: UserState = {
    userID: null,
    username: null,
    accountType: null,
    fName: null,
    lName: null,
    companyID: null,
    loggedIn: false,
};

// Create the slice
const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login(state, action: PayloadAction<UserState>) {
            // Set the attributes of the user
            state.userID = action.payload.userID;
            state.username = action.payload.username;
            state.accountType = action.payload.accountType;
            state.fName = action.payload.fName;
            state.lName = action.payload.lName;
            state.companyID = action.payload.companyID;
            state.loggedIn = true;
        },
        logout(state) {
            // Clear the attributes of the user
            state.userID = null;
            state.username = null;
            state.accountType = null;
            state.fName = null;
            state.lName = null;
            state.companyID = null;
            state.loggedIn = false;
        },
    },
});

// Export the actions
export const { login, logout } = userSlice.actions;

// Export the reducer
export default userSlice.reducer;