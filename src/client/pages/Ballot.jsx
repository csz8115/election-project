import {React, useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BallotVoteSection from '../components/BallotVoteSection'
import BallotInitiativeSection from '../components/BallotInitiativeSection';
import '../components/Ballot.css';


const Ballot = () => {
    const [ballotObject, setBallotObject] = useState(null);
    
    const location = useLocation();
    const navigate = useNavigate();

    
    if (!location.state) {
        return (
            <div className='ballot'>
                <h1>Ballot Not Found</h1>
                <p>Please go back to the dashboard and select a ballot.</p>
            </div>
        );
    }

    const ballotID = location.state;

    const handleBackButton = () => {
        navigate(-1);
    }

    useEffect(() => {
            const fetchData = async () => {
                try {
                    const response = await fetch(`http://localhost:3000/api/getBallot/?ballotID=${ballotID.ballotID}`, {
                        method: 'GET',
                        credentials: 'include',
                    });
    
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
    
                    const result = await response.json();
                    console.log(result);
                    setBallotObject(result);
    
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            };
    
            fetchData();
        }
        , []);

    if (ballotObject == null) {
        return (
            <div className='ballot'>
                <h1>Loading...</h1>
            </div>
        );
    }

    var positionSectionArray = [];
    ballotObject.positions.map(position => {
        positionSectionArray.push(<BallotVoteSection
            key={ballotObject.ballotID+'_'+position.positionName} 
            positionTitle={position.positionName} 
            votingLimit={position.allowedVotes}
            candidates={position.candidates}>
            </BallotVoteSection>);
    });


    return (
        <div className='ballot'>
            <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
            <h1>{ballotObject.ballotName}</h1>
            <h3>{ballotObject.description}</h3>
            <div className='ballotBody'>
                {positionSectionArray}
                <BallotInitiativeSection 
                    initiativeTitle={'Initiative One'}
                    propositionDescription={"Lorem ipsum dolor sit amet, cons ectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}
                />
            </div>
            <button className='submitBallot'>Submit Ballot</button>
        </div>
    );
};

export default Ballot;