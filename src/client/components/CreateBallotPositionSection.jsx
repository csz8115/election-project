import React, { useState } from 'react';
import CandidateButton from './CandidateButton';
import CreateCandidateButton from './CreateCandidateButton';

const CreateBallotPositionSection = () => {
    const [selected, setSelected] = useState([]);
    const [abstained, setAbstained] = useState(true);
    

    return (
        <div className='ballotVoteSection'>
            <div className='ballotVoteSectionDetails'>
                <input className="ballotCreationTextInput" type="text" placeholder="PositionName" />
                <input className="ballotCreationTextInput" type="text" placeholder="Voting Limit" />
            </div>
            <div className='candidateContainer'>
            <CreateCandidateButton/>

            </div>
            <div className='candidateContainer'>
            </div>
        </div>
    );
};

export default CreateBallotPositionSection;