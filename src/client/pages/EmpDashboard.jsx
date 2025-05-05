import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { useHeartbeat } from "../hooks/useHeartbeat";
import Logout from '../components/Utils/Logout';
import SystemStats from '../components/EmpDashboardComponents/systemStats';
import CompanyButton from '../components/EmpDashboardComponents/CompanyButton';

import '../components/Dashboard.css';

export default function EmpDashboard() { 
    const [companyList, setCompanyList] = useState(null);

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

    const handleSocietyButton = (societyID, societyName) => {
        console.log("Society ID: ", societyID, "Society Name: ", societyName);
        navigate("/societyStats", {state: {societyID: societyID, societyName: societyName}});
    }

    const handleUsersButton = () => {
        console.log("Navigating to user find/edit page");
        navigate("/findUsers");
    }


    //ADMIN DASHBOARD
    if(user.accountType === "Admin"){

        //load all societies
        useEffect(() => {
                const fetchData = async () => {
                    try {
                        const response = await fetch(`http://localhost:3000/api/v1/admin/getAllCompanies`, {
                            method: 'GET',
                            credentials: 'include',
                        });
        
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
        
                        const result = await response.json();
                        console.log(result);
                        setCompanyList(result);
        
                    } catch (error) {
                        console.error('Error fetching data:', error);
                    }
                };
        
                fetchData();
            }
            , []);

            const companyListComponents = [];
            if(companyList != null){
                companyList.map(company => {
                    companyListComponents.push(
                        <CompanyButton 
                        key={company.companyName}
                        companyName={company.companyName}
                        handleClick={() => handleSocietyButton(company.companyID, company.companyName)}
                        />
                    );
                });
            }

        return( 
            <div className='dashboard'>
                <div>
                    <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Admin Dashboard</h1>
                    <h2 className='block'> Welcome, {user.fName} {user.lName} ({user.username})</h2>
                </div>
                <div>
                    <h1 className='dashboardHeader'>All Societies</h1>
                    <div className='dashboardBallotContainer'>
                        {/* put id in for each button when loaded data */}
                        {/* <button onClick={() => handleSocietyButton(1, "Tech Innovators Inc.")}>Test</button> */}
                        <div className="companyListContainer">
                            {companyListComponents && companyListComponents.length > 0 ? (
                                companyListComponents
                            ) : (
                                <h3>No Companies Found</h3>
                            )}
                        </div>
                    </div>
                    {/* <h1 className='dashboardHeader'>View/Edit Users</h1> */}
                    <div className='dashboardCenteredButtonContainer'>
                        <button className="dashboardCenteredButton" onClick={() => handleUsersButton()}>View/Edit Users</button>
                    </div>

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