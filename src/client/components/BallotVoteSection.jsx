import React, { useState } from 'react';
import CandidateButton from './CandidateButton';
import './CandidateButton.css'

const BallotVoteSection = ({positionTitle, votingLimit, candidates}) => {
    const [selected, setSelected] = useState([]);
    const [abstained, setAbstained] = useState(true);
    

    const abstain = () => {
        setSelected([]);

        let fieldOverlay = document.getElementById(positionTitle+'_overlay');
        let abstainButton = document.getElementById(positionTitle+'_abstain');
        let writeIn = document.getElementById(positionTitle+'_writeIn');

        setAbstained(!abstained)
        
        if(abstained){

            fieldOverlay.style.display = 'block'
            writeIn.style.display = 'none';
            abstainButton.classList.add('ballotAbstainButtonOn')

            let activeButtons = document.getElementsByClassName(positionTitle + 'ButtonToggled');   
            Array.from(activeButtons).forEach(button => {
                button.classList.remove(positionTitle + 'ButtonToggled', 'candidateButtonToggled');
            });
        } else {

            fieldOverlay.style.display = 'none';
            writeIn.style.display = 'block';
            abstainButton.classList.remove('ballotAbstainButtonOn')

        }

    }

    const handleToggle = (index) => {
        setSelected((prev) => {
            const newSelected = { ...prev, [index]: !prev[index] };
            const selectedCount = Object.values(newSelected).filter(Boolean).length;

            if (selectedCount > votingLimit) {
            return prev; // Don't update if it exceeds the voting limit
            }

            return newSelected;
        });
        console.log(selected);
    }

    const candidateButtons = candidates.map((candidateInfo) => (
        <CandidateButton key={candidateInfo.candidateID} index={candidateInfo.candidateID} details={candidateInfo.candidate} isSelected={!!selected[candidateInfo.candidateID]} onToggle={handleToggle} />
    ));

    return (
        <div className='ballotVoteSection'>
            <div className='ballotVoteSectionDetails'>
                <h1>{positionTitle}</h1>
                <h3>Select: {votingLimit}</h3>  
                <button className='ballotAbstainButton' id={positionTitle + "_abstain"} onClick={abstain}>Abstain</button>
            </div>

            <div className='candidateContainer'>
            <div id={positionTitle + '_overlay'} className='overlay'><p>Abstained</p></div>
                {candidateButtons}
            </div>
            <div className='writeIn' id={`${positionTitle}_writeIn`}>
                <label htmlFor={`${positionTitle}_writeIn_field`}>Write in: </label>
                <input id={`${positionTitle}_writeIn_field`} name={`${positionTitle}_writeIn`} type='text'></input>
            </div>
        </div>
    );
};

export default BallotVoteSection;