import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import Logout from '../components/Logout';
import BallotButton from '../components/BallotButton';
import { useHeartbeat } from "../hooks/useHeartbeat";
import '../components/Dashboard.css';
import Error from '../components/ErrorMessage';

import '../components/Dashboard.css';

export default function Dashboard() {
    const [ballots, setBallots] = useState(null);
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
    useHeartbeat(user.username);
    const navigate = useNavigate();
    const handleClick = (ballotID) => {
        navigate('/Ballot',{state: {ballotID: ballotID}});
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/getCompanyBallots/?companyID=${user.companyID}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                console.log(result);
                setBallots(result);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }
    , []);

    if (ballots != null) {
        const activeBallotComponents = []
        const inactiveBallotComponents = []

        ballots.map(ballot => {
            if (new Date(ballot.endDate) > new Date() && new Date(ballot.startDate) < new Date()) {
                activeBallotComponents.push(<BallotButton key={ballot.ballotID} label={ballot.ballotName} onClick={() => handleClick(ballot.ballotID)} disabled={false} />);
            } else {
                inactiveBallotComponents.push(<BallotButton key={ballot.id} label={ballot.ballotName} onClick={null} disabled={true} />);
            }
        }).filter(Boolean);

        return (
            <div className='dashboard'>
                <div>
                    <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Dashboard</h1>
                    <h2 className='block'> Welcome, {user && user.username}</h2>
                </div>
                <div>
                    <h1 className='dashboardHeader'>Active Ballots</h1>
                    <div className='dashboardBallotContainer'>
                        {activeBallotComponents}
                    </div>
                </div>
                <div>
                    <h1 className='dashboardHeader'>Inactive Ballots</h1>
                    <div className='dashboardBallotContainer'>
                        {inactiveBallotComponents}
                    </div>
                </div>
                <Logout />
            </div>
        );
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
                    <BallotButton label={"Ballot 1"} onClick={null} disabled={false}/>
                    <BallotButton label={"Ballot 2"} onClick={null} disabled={false}/>
                    <BallotButton label={"Ballot 3"} onClick={null} disabled={false}/>
                </div>
            </div>
            <div>
                <h1 className='dashboardHeader'>Inactive Ballots</h1>
                <div className='dashboardBallotContainer'>
                    <BallotButton label={"Ballot 1"} onClick={null} disabled={true}/>
                    <BallotButton label={"Ballot 2"} onClick={null} disabled={true}/>
                    <BallotButton label={"Ballot 3"} onClick={null} disabled={true}/>
                </div>
            </div>
            <Logout />
        </div>
    );
}