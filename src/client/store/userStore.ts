import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { user } from '@prisma/client';

// extend user to include role 
interface userType extends user {
    company?: {
        companyName?: string;
    };
}

type UserStore = {
    username: string;
    fName: string;
    lName: string;
    userID: number;
    companyName?: string;
    accountType: string;
    setUser: (user: userType) => void;
    clearUser: () => void;
};

export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            username: '',
            fName: '',
            lName: '',
            accountType: '',
            userID: 0,
            setUser: (user) => set({
                username: user.username,
                fName: user.fName,
                lName: user.lName,
                userID: user.userID,
                companyName: user.company?.companyName || '',
                accountType: user.accountType || ''
            }),
            clearUser: () => set({
                username: '',
                fName: '',
                lName: '',
                userID: 0,
                companyName: '',
                accountType: ''
            })
        }),
        {
            name: 'user-storage', // unique name for the storage
        }
    )
);