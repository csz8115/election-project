import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { useHeartbeat } from "../hooks/useHeartbeat";
import Logout from '../components/Utils/Logout';
import SystemStats from '../components/EmpDashboardComponents/systemStats';

import '../components/Dashboard.css';

export default function EmpDashboard() { 
    const user = useSelector((state) => {
        return {
            userID: state.userID,
            username: state.username,
            accountType: state.accountType,
            fName: state.fName,
            lName: state.lName,
            companyID: state.companyID,
            companyName: state.companyName,
        };
    });
    useHeartbeat(user.username);
    const navigate = useNavigate();

    //ADMIN DASHBOARD
    if(user.accountType === "Admin"){

        //load all societies

        //view users button to go to page

        //load system stats

        return( 
            <div className='dashboard'>
                <div>
                    <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Admin Dashboard</h1>
                    <h2 className='block'> Welcome, {user.fName} {user.lName} ({user.username})</h2>
                </div>
                <div>
                    <h1 className='dashboardHeader'>All Societies</h1>
                    <div className='dashboardBallotContainer'>
                        
                    </div>
                    <h1 className='dashboardHeader'>View/Edit Users</h1>
                    {/*  button here */}
                    

                    <h1 className='dashboardHeader'>System Stats</h1>
                    <div className='dashboardBallotContainer'>
                        <SystemStats/>
                    </div>
                    
                    

                </div>
                <Logout />
            </div>
            );
    }else{
        //EMPLOYEE/MOD DASHBOARD
        return( 
            <div className='dashboard'>
                <div>
                    <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Employee Dashboard</h1>
                    <h2 className='block'> Welcome, {user.fName} {user.lName} ({user.username})</h2>
                </div>
                <div>
                    <h1 className='dashboardHeader'>Assigned Societies</h1>
                    <div className='dashboardBallotContainer'>
                        
                    </div>
                    </div>
                <Logout />
            </div>
            );
    }

}