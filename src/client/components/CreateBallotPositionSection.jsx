import React, { useState } from 'react';
import CandidateButton from './CandidateButton';
import CreateCandidateButton from './CreateCandidateButton';

const CreateBallotPositionSection = ({positionTitle, votingLimit, candidates}) => {
    const [selected, setSelected] = useState([]);
    const [abstained, setAbstained] = useState(true);
    

    const candidateButtons = candidates.map((candidateInfo) => (
        <CandidateButton key={candidateInfo.candidateID} index={candidateInfo.candidateID} details={candidateInfo.candidate} isSelected={!!selected[candidateInfo.candidateID]} onToggle={handleToggle} />
    ));

    return (
        <div className='ballotVoteSection'>
            <div className='ballotVoteSectionDetails'>
                <input type='text'>{"Position Title"}</input>
                <input type='text'></input>  
            </div>

            <div className='candidateContainer'>
            <div id={positionTitle + '_overlay'} className='overlay'><p>Abstained</p></div>
                {candidateButtons}
                <CreateCandidateButton/>
            </div>
            <div className='writeIn' id={`${positionTitle}_writeIn`}>
                <label htmlFor={`${positionTitle}_writeIn_field`}>Write in: </label>
                <input id={`${positionTitle}_writeIn_field`} name={`${positionTitle}_writeIn`} type='text'></input>
            </div>
        </div>
    );
};

export default CreateBallotPositionSection;