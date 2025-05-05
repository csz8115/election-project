import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import Logout from '../components/Utils/Logout';
import BallotButton from '../components/BallotComponents/BallotButton';
import { useHeartbeat } from "../hooks/useHeartbeat";
import '../components/Dashboard.css';
import ErrorMessage from '../components/Utils/ErrorMessage';
const baseUrl = import.meta.env.VITE_API_BASE;


import '../components/Dashboard.css';

export default function Dashboard() {
    const [activeBallots, setActiveBallots] = useState(null);
    const [inactiveBallots, setInactiveBallots] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');


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
    const handleClick = (ballotID) => {
        const checkIfVoted = async () => {
            try {
                const response = await fetch(`${baseUrl}api/v1/member/voterStatus/?userID=${user.userID}&ballotID=${ballotID}`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const result = await response.json();
                if (result.voterStatus) {
                    setErrorMessage('You have already submitted your vote for this ballot.');
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error checking vote status:', error);
                return true;
            }
        };
        checkIfVoted().then((hasVoted) => {
            if (!hasVoted) {
                navigate('/Ballot',{state: {ballotID: ballotID}});
            }
        });
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${baseUrl}api/v1/member/getActiveUserBallots/?userID=${user.userID}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                setActiveBallots(result);
            } catch (error) {
                console.error('Error fetching data:', error);
            }

            try {
                const response = await fetch(`${baseUrl}api/v1/member/getInactiveUserBallots/?userID=${user.userID}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                setInactiveBallots(result);
            }
            catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }
    , []);

    const activeBallotComponents = []
    if (activeBallots != null) {
        activeBallots.map(ballot => {
            activeBallotComponents.push(
                <BallotButton
                    key={ballot.ballotID}
                    ballotName={ballot.ballotName}
                    ballotStartDate={ballot.startDate}
                    ballotEndDate={ballot.endDate}
                    handleClick={() => handleClick(ballot.ballotID)}
                    disabled={false}
                />
            );
        });
    }

    const inactiveBallotComponents = []
    if (Array.isArray(inactiveBallots)) {
        inactiveBallots.map(ballot => {
            inactiveBallotComponents.push(
                <BallotButton
                    key={ballot.ballotID}
                    ballotName={ballot.ballotName}
                    ballotStartDate={ballot.startDate}
                    ballotEndDate={ballot.endDate}
                    handleClick={handleClick}
                    disabled={true}
                />
            );
        });
    }
    
    return (
        <div className='dashboard'>
            <div>
                <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Dashboard</h1>
                <h2 className='block'> Welcome, {user && user.username}</h2>
            </div>
            <div>
                <h1 className='dashboardHeader'>Active Ballots</h1>
                <div className='dashboardBallotContainer'>
                    {activeBallotComponents && activeBallotComponents.length > 0 ? (
                        activeBallotComponents
                    ) : (
                        <h3>No Active Ballots</h3>
                    )}
                </div>
                {errorMessage && (
                    <ErrorMessage message={errorMessage} />
                )}
            </div>
            <div>
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
            <Logout />
        </div>
    );
}
