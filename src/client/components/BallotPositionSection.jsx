import React, { useState, useEffect } from 'react';
import CandidateButton from './CandidateButton';

const BallotPositionSection = ({positionObject, returnSelected}) => {
    const [selected, setSelected] = useState({});
    const [abstained, setAbstained] = useState(false);
    const {ballotID, candidates, positionID, positionName, writeIn } = positionObject;
    const allowedVotes = 2;

    const handleToggle = (index) => {
        setSelected((prev) => {
            const currentCount = Object.values(prev).filter(Boolean).length;

            if (currentCount >= allowedVotes && !prev[index]) {
            return prev; // Return immediately if max allowed votes are reached and not already selected
            }

            const newSelected = { ...prev };

            if (newSelected[index]) {
            delete newSelected[index]; // Remove selection if already selected
            } else {
            newSelected[index] = true; // Add selection if within allowed votes
            }

            return newSelected;
        });
    }


    const abstain = () => {
        setSelected({});
        setAbstained((prevAbstained) => {
            const newAbstained = !prevAbstained;

            let fieldOverlay = document.getElementById(positionName + '_overlay');
            let abstainButton = document.getElementById(positionName + '_abstain');
            let writeIn = document.getElementById(positionName + '_writeIn');

            if (newAbstained) {
                fieldOverlay.style.display = 'block';
                writeIn.style.display = 'none';
                abstainButton.classList.add('ballotAbstainButtonOn');

                let activeButtons = document.getElementsByClassName(positionName + 'ButtonToggled');
                Array.from(activeButtons).forEach(button => {
                    button.classList.remove(positionName + 'ButtonToggled', 'candidateButtonToggled');
                });
            } else {
                fieldOverlay.style.display = 'none';
                writeIn.style.display = 'block';
                abstainButton.classList.remove('ballotAbstainButtonOn');
            }

            return newAbstained;
        });
    };

    const candidateButtons = candidates.map((candidateInfo) => (
        <CandidateButton key={candidateInfo.candidateID} index={candidateInfo.candidateID} details={candidateInfo.candidate} isSelected={!!selected[candidateInfo.candidateID]} onToggle={handleToggle} />
    ));

    useEffect(() => {
        // Check if the user has abstained
        if (abstained) {
            returnSelected('abstained', []);
            return;
        }

        // Filter out candidates that are not selected
        // and map to the desired format
        const selectedCandidates = Object.keys(selected)
            .filter((key) => selected[key])
            .map((candidateID) => {
            const candidate = candidates.find((c) => c.candidateID === parseInt(candidateID)); // Ensure candidateID is parsed as an integer
            return candidate
                ? {
                positionID: parseInt(positionID),
                positionName,
                allowedVotes,
                writeIn: candidate.candidate.writeIn,
                candidateID: parseInt(candidate.candidateID),
                fName: candidate.candidate.fName,
                lName: candidate.candidate.lName,
                }
                : null;
            })
            .filter(Boolean);
        if (selectedCandidates.length !== 0) {
            returnSelected(selectedCandidates);
            return;
        }
    }, [selected, abstained]); // Only run when `selected` and `abstained` changes

    return (
        <div className='ballotVoteSection'>
            <div className='ballotVoteSectionDetails'>
                <h1>{positionName}</h1>
                <h3>Select: {allowedVotes}</h3>  
                <button className='ballotAbstainButton' id={positionName + "_abstain"} onClick={abstain}>Abstain</button>
            </div>

            <div className='candidateContainer'>
            <div id={positionName + '_overlay'} className='overlay'><p>Abstained</p></div>
                {candidateButtons}
            </div>
            <div className='writeIn' id={`${positionName}_writeIn`}>
                <label htmlFor={`${positionName}_writeIn_field`}>Write in: </label>
                <input id={`${positionName}_writeIn_field`} name={`${positionName}_writeIn`} type='text'></input>
            </div>
        </div>
    );
};

export default BallotPositionSection;