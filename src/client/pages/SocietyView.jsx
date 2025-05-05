import {React, useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useHeartbeat from '../hooks/useHeartbeat';
import ErrorMessage from '../components/Utils/ErrorMessage'; // Import the Error component
import SocietyStats from './SocietyStats';

import '../components/Dashboard.css';

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

    const handleBackButton = () => {
        navigate(-1);
    }

    const handleBallotClick = (ballotID) => {
        navigate('/electionResults', {state: {ballotID: ballotID}});
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${baseUrl}api/v1/user/getInactiveCompanyBallots?companyID=${company.societyID}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                console.log(result);
                setInactiveBallots(result);

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
                    disabled={true}
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
            </div>
            );
        
    

}

export default SocietyView;
