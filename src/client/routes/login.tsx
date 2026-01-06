import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '../components/ui/card'
import { Button } from './../components/ui/button'
import { Input } from './../components/ui/input'
import { useActionState, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/form-actions'
import { useUserStore } from '../store/userStore'
import { FadeLoader, PulseLoader } from 'react-spinners'

export default function Login() {
    const [loginState, action, pending] = useActionState(login, undefined);
    const navigate = useNavigate();
    const [showErrors, setShowErrors] = useState(true);
    const setUser = useUserStore((state) => state.setUser);
    
    useEffect(() => {
        if (loginState?.success) {
            setUser(loginState.user);
            navigate('/'); // or your desired route
        }
    }, [loginState, navigate]);

    useEffect(() => {
        if (loginState?.errors) {
            setShowErrors(true);
            const timer = setTimeout(() => {
                setShowErrors(false);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [loginState?.errors]);
    
    const hasUsernameError = showErrors && loginState?.errors?.username;
    const hasPasswordError = showErrors && loginState?.errors?.password;
    
    return (
        <div className="flex items-center justify-center h-screen">
            <Card className="w-96">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Enter your credentials to continue</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-4">
                        <Input 
                            type="text" 
                            name="username" 
                            placeholder="Username"
                            className={hasUsernameError ? "border-red-500 shadow-red-500/50 shadow-lg animate-pulse" : ""}
                        />
                        {hasUsernameError && (
                            <p className="text-red-500 text-sm whitespace-pre-line">{hasUsernameError}</p>
                        )}
                        <Input 
                            type="password" 
                            name="password" 
                            placeholder="Password"
                            className={hasPasswordError ? "border-red-500 shadow-red-500/50 shadow-lg animate-pulse" : ""}
                        />
                        {hasPasswordError && (
                            <p className="text-red-500 text-sm whitespace-pre-line">{hasPasswordError}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={pending}>
                            {pending ? <PulseLoader size={8} /> : 'Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
