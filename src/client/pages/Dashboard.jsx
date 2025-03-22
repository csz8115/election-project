import { useState } from 'react';
import { useSelector } from 'react-redux';
import Logout from '../components/Logout';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const user = useSelector((state) => {
        return {
            username: state.username,
            accountType: state.accountType,
            fName: state.fName,
            lName: state.lName,
            companyID: state.companyID,
            companyName: state.companyName,
        };
    });

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-96">
                <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Dashboard</h1>
                <h2> Welcome, {user && user.username}</h2>
            </div>
            <Logout />
        </div>
    );
}