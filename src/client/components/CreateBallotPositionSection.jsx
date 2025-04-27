import React, { useState } from 'react';
import CandidateButton from './CandidateButton';
import CreateCandidateButton from './CreateCandidateButton';
import CreateCandidateInfo from './CreateCandidateInfo';

const CreateBallotPositionSection = () => {
    const [selected, setSelected] = useState([]);
    const [abstained, setAbstained] = useState(true);
    
    const handleCandidateAdd = () => {
        return (
            <CreateCandidateInfo
                show={true}
                handleClose={() => {}}
                handleSave={(candidate) => {
                    console.log("Candidate added:", candidate);
                }}
            />
        );
    }

    return (
        <div className='ballotVoteSection'>
            <div className='ballotVoteSectionDetails'>
                <input className="ballotCreationTextInput" type="text" placeholder="PositionName" />
                <input className="ballotCreationTextInput" type="text" placeholder="Voting Limit" />
            </div>
            <div className='candidateContainer'>
                <CreateCandidateButton onClick={handleCandidateAdd}/>
            </div>
        </div>
    );
};

export default CreateBallotPositionSection;