import { useState } from 'react';
import { useSelector } from 'react-redux';
import Logout from '../components/Logout';
import BallotButton from '../components/BallotButton';

import '../components/Dashboard.css';

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