"use client"

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "../components/ui/navigation-menu"
import { useUserStore } from "../store/userStore";
import { Button } from "./ui/button";
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie';
import { HomeIcon } from "lucide-react";


export default function Navbar() {
    const navigate = useNavigate();
    const [setCookie, cookies, removeCookie] = useCookies(['user_session']);
    const clearUser = useUserStore((state) => state.clearUser);
    const user = useUserStore((state) => state);

    const handleLogout = async () => {
        // Clear the user store and session token
        clearUser();
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/member/logout`, {
            method: 'POST',
            credentials: 'include', // Include cookies in the request
        });
        if (!response.ok) {
            console.error('Logout failed');
            return;
        }
        navigate('/login');
    }

    return (
        <div className="bg-gray-800 p-4 justify-between min-w-full flex sticky top-0 z-50">
            <Button
                variant="ghost"
                className="text-white text-xl hover:bg-gray-500 p-2"
                onClick={() => navigate('/')}
            >
                {user.companyName}
            </Button>
            <NavigationMenu>
                <NavigationMenuList>
                    {!(window.location.pathname.includes('dashboard')) && (
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()} onClick={() => navigate('/')}>
                                <Button className="text-white hover:shadow-lg transition-shadow duration-200">
                                    <HomeIcon />
                                </Button>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    )}
                    {user.accountType == "Employee" && (
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                <Button className="text-black hover:shadow-lg transition-shadow duration-200" onClick={() => navigate('/system-stats')}>
                                    System Stats
                                </Button>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    )}
                    {user.accountType == "Employee" && (
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                <Button className="text-black hover:shadow-lg transition-shadow duration-200" onClick={() => navigate('/company-stats')}>
                                    Company Stats
                                </Button>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    )}
                    {user.accountType == "Employee" && (
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                <Button className="text-black hover:shadow-lg transition-shadow duration-200" onClick={() => navigate('/users-page')}>
                                    Edit Users
                                </Button>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    )}
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Button className="text-black hover:shadow-lg transition-shadow duration-200" onClick={handleLogout}>
                                Logout
                            </Button>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    );

}