import {React, useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorMessage from '../components/Utils/ErrorMessage'; // Import the Error component

import '../components/EmpDashboardComponents/Stats.css';



const SocietyStats = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [stats, setStats] = useState(null);

    const handleBackButton = () => {
        navigate(-1);
    }

    const user = useSelector((state) => {
            return {
                userID: state.userID,
                username: state.username,
                accountType: state.accountType,
                fName: state.fName,
                lName: state.lName
            };
        });

        if (!location.state) {
            return (
                <div className='company'>
                    <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
                    <h1>Company Not Found</h1>
                    <p>Please go back to the dashboard and select a company.</p>
                </div>
            );
        }
    
        const company = location.state;

        useEffect(() => {
                const fetchData = async () => {
                    try {
                        const response = await fetch(`http://localhost:3000/api/v1/admin/getSocietyReport?companyID=${company.societyID}`, {
                            method: 'GET',
                            credentials: 'include',
                        });
        
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
        
                        const result = await response.json();
                        console.log(result);
                        setStats(result);
        
                    } catch (error) {
                        console.error('Error fetching data:', error);
                    }
                };
        
                fetchData();
            }
            , []);

            if(stats != null){
                return(
                    <div className="statsPageContainer">
                        <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
                        <h1>{company.societyName} Stats</h1>
                        <div className="statsContainer">
                            <div className="statsRow">
                                <div className="statsColumn">
                                        <h4>Active Ballots Users</h4>
                                        <h4>{stats.active_ballots.count}</h4>
                                    </div>
                                <div className="statsColumn">
                                        <h4>Inactive Ballots Users</h4>
                                        <h4>{stats.inactive_ballots.count}</h4>
                                </div>
                            </div>
                            <hr/>
                            <div className="statsRow">
                                <div className="statsColumn">
                                    <h4>Total Company Users</h4>
                                    <h4>{stats.total_members}</h4>
                                </div>
                                <div className="statsColumn">
                                    <h4>Average Votes per Ballot</h4>
                                    <h4>{stats.avg_votes_per_ballot}</h4>
                                </div>                 
                                <div className="statsColumn">
                                    <h4>Total Votes</h4>
                                    <h4>{stats.total_votes}</h4>
                                </div>
                                <div className="statsColumn">
                                    <h4>Total Initiative Votes</h4>
                                    <h4>{stats.total_initiative_votes}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }else{
                return (
                <div>
                    <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
                    <h2>Stats not available</h2>
                </div>
                );
            }

}

export default SocietyStats;