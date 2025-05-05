import {React, useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useHeartbeat from '../hooks/useHeartbeat';
import ErrorMessage from '../components/Utils/ErrorMessage'; // Import the Error component
import SocietyStats from './SocietyStats';
const baseUrl = import.meta.env.VITE_API_BASE;
import BallotButton from '../components/BallotComponents/BallotButton' 

import '../components/Dashboard.css';
import '../components/UserComponents/User.css'

const SocietyView = () => {
    const navigate = useNavigate();
    const location = useLocation();

    
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
    
    //const [society, setSociety] = useState(null);

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

    const[inactiveBallots, setInactiveBallots] = useState(null);
    const[activeBallots, setActiveBallots] = useState(null);

    const handleBackButton = () => {
        navigate(-1);
    }

    const handleNewBallotClick = (companyID) => {
        navigate('/createBallot', {state: {companyID: companyID, ballotID: null}});
    }

    const handleBallotClick = (ballotID) => {
        console.log("Ballot ID: ", ballotID);
        navigate('/electionResults', {state: {ballotID: ballotID}});
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response1 = await fetch(`${baseUrl}api/v1/member/getInactiveCompanyBallots?companyID=${company.societyID}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response1.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response1.json();
                console.log(result);
                setInactiveBallots(result);

                    const response = await fetch(`${baseUrl}api/v1/member/getActiveCompanyBallots?companyID=${company.societyID}`, {
                        method: 'GET',
                        credentials: 'include',
                    });
    
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
    
                    const result2 = await response.json();
                    console.log(result);
                    setActiveBallots(result2);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }
    , []);

    const inactiveBallotComponents = []
    if (Array.isArray(inactiveBallots)) {
        inactiveBallots.map(ballot => {
            inactiveBallotComponents.push(
                <BallotButton
                    key={ballot.ballotID}
                    ballotName={ballot.ballotName}
                    ballotStartDate={ballot.startDate}
                    ballotEndDate={ballot.endDate}
                    handleClick={() => handleBallotClick(ballot.ballotID)}
                />
            );
        });
    }
    const activeBallotComponents = []
    if (Array.isArray(activeBallots)) {
        activeBallots.map(ballot => {
            activeBallotComponents.push(
                <BallotButton
                    key={ballot.ballotID}
                    ballotName={ballot.ballotName}
                    ballotStartDate={ballot.startDate}
                    ballotEndDate={ballot.endDate}
                    handleClick={() => handleBallotClick(ballot.ballotID)}
                />
            );
        });
    }

        var stats = <div></div>;
        if(user.accountType === "Admin"){
            //society stats at top for admin
             stats = <SocietyStats societyID={company.societyID} societyName={company.societyName}/>
        }
        return (
            <div>
                {stats}
                <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
                <button className="userCreateButton" onClick={() => handleNewBallotClick(company.societyID)}>Add New Ballot</button>
                <h1 className='dashboardHeader'>Inactive Ballots</h1>
                <div className='dashboardBallotContainer'>
                    {inactiveBallotComponents && inactiveBallotComponents.length > 0 ? (
                        inactiveBallotComponents
                    ) : (
                        <div>
                            <h3>No Inactive Ballots</h3>
                        </div>
                    )}
                </div>
                <div className='dashboardBallotContainer'>
                    {activeBallotComponents && activeBallotComponents.length > 0 ? (
                        activeBallotComponents
                    ) : (
                        <div>
                            <h3>No Active Ballots</h3>
                        </div>
                    )}
                </div>
            </div>
            );
        
    

}

export default SocietyView;
