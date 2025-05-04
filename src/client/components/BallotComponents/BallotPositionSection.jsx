import React, { useState, useEffect } from 'react';
import CandidateButton from './CandidateButton';
import ErrorMessage from '../Utils/ErrorMessage';
import { set } from 'zod';

const BallotPositionSection = ({positionObject, returnSelected}) => {
    const [selected, setSelected] = useState(-1);
    const [abstained, setAbstained] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [writeInPosition, setWriteInPosition] = useState('');
    const {ballotID, candidates, positionID, positionName, writeIn, allowedVotes } = positionObject;

    const handleToggle = (index) => {
        setErrorMessage(''); // Clear error message on toggle
        setSelected((prev) => {
            const currentCount = Object.values(prev).filter(Boolean).length;

            if (currentCount >= allowedVotes && !prev[index]) {
                console.log(index)
                setErrorMessage(`You can only select ${allowedVotes} candidates.`);
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
        setErrorMessage('');
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

    const handleWriteIn = (event) => {
        var writeInValue = event.target.value.trim();
        setWriteInPosition(writeInValue);

        const [fName, lName] = writeInValue.split(' ');
        if (fName && lName) {
            setSelected({
                positionID: parseInt(positionID),
                positionName,
                allowedVotes,
                writeIn: true,
                candidateID: null,
                fName: fName,
                lName: lName,
            });
            setErrorMessage('');
        } else {
            if (!selected.fName || !selected.lName) {
                setErrorMessage("Please enter first and last name for write-in candidate.");
            }
            setSelected({});
        }
    };

    const candidateButtons = candidates.map((candidateInfo) => (
        <CandidateButton key={candidateInfo.candidateID} index={candidateInfo.candidateID} details={candidateInfo.candidate} isSelected={!!selected[candidateInfo.candidateID]} onToggle={handleToggle} />
    ));

    useEffect(() => {
        // Check if the user has abstained
        console.log(abstained)
        if (abstained) {
            returnSelected([]);
            return;
        }
        console.log(selected)

        // Check if the user has selected candidates
        if (Object.keys(selected).length === 0) {
            returnSelected(-1);
            return;
        }

        // Filter out candidates that are not selected
        // and map to the desired format
        const selectedCandidates = Object.keys(selected)
            .filter((key) => selected[key])
            .map((candidateID) => {

            if (selected.writeIn === true) {
                const writeInCandidate = {
                    positionID: parseInt(positionID),
                    positionName,
                    allowedVotes,
                    writeIn: true,
                    fName: selected.fName,
                    lName: selected.lName,
                };
                returnSelected([writeInCandidate]);
            }

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
            console.log(selectedCandidates)
            returnSelected(selectedCandidates);
            return;
        }
    }, [selected, abstained, writeIn]); // Only run when `selected` and `abstained` changes

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
                <input id={`${positionName}_writeIn_field`} name={`${positionName}_writeIn`} type='text' onInput={handleWriteIn}></input>
            </div>
            {errorMessage && <ErrorMessage message={errorMessage} />}
        </div>
    );
};

export default BallotPositionSection;