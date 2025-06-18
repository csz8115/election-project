import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { user } from '@prisma/client';

type UserStore = {
    username: string;
    fName: string;
    lName: string;
    userID: number;
    companyName?: string;
    setUser: (user: user) => void;
    clearUser: () => void;
};

export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            username: '',
            fName: '',
            lName: '',
            userID: 0,
            setUser: (user) => set({
                username: user.username,
                fName: user.fName,
                lName: user.lName,
                userID: user.userID,
                companyName: user.company.companyName || ''
            }),
            clearUser: () => set({
                username: '',
                fName: '',
                lName: '',
                userID: 0,
                companyName: ''
            })
        }),
        {
            name: 'user-storage', // unique name for the storage
        }
    )
);