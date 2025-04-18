import {React, useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BallotSection from '../components/BallotPositionSection'
import BallotInitiativeSection from '../components/BallotInitiativeSection';
import '../components/Ballot.css';


const Ballot = () => {
    const [positionSectionArray, setPositionSectionArray] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();


    const handleBackButton = () => {
        navigate(-1);
    }


    /* var positionSectionArray = [];
    ballotObject.positions.map(position => {
        positionSectionArray.push(<BallotVoteSection
            key={ballotObject.ballotID+'_'+position.positionName} 
            positionTitle={position.positionName} 
            votingLimit={position.allowedVotes}
            candidates={position.candidates}>
            </BallotVoteSection>);
    }); */

    const addPositionField = () => {
        
    }


    return (
        <div className='ballot'>
            <div className='ballotCreationHeader'>
                <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
                <input className="ballotCreationTextInput" type="text" placeholder="Ballot Name" />
                <input className="ballotCreationTextInput" type="text" placeholder="Ballot Description" />
            </div>
            <div className='ballotBody'>
                {/* positionSectionArray */}
                <button className="addPosition" onClick={() => console.log('Add Position clicked')}>Add Position</button>

            </div>
            <button className='submitBallot'>Submit Ballot</button>
        </div>
    );
};

export default Ballot;