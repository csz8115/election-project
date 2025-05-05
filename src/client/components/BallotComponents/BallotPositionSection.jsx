import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import CandidateButton from './CandidateButton';
import ErrorMessage from '../Utils/ErrorMessage';

const BallotPositionSection = forwardRef(({ positionObject }, ref) => {
    const [selected, setSelected] = useState({});
    const [abstained, setAbstained] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [writeInPosition, setWriteInPosition] = useState('');

    const { positionID, positionName, candidates, allowedVotes } = positionObject;

    const handleToggle = (index) => {
        setErrorMessage('');
        setSelected((prev) => {
            const currentCount = Object.values(prev).filter(Boolean).length;
            if (currentCount >= allowedVotes && !prev[index]) {
                setErrorMessage(`You can only select ${allowedVotes} candidates.`);
                return prev;
            }

            const newSelected = { ...prev };
            if (newSelected[index]) {
                delete newSelected[index];
            } else {
                newSelected[index] = true;
            }

            return newSelected;
        });
    };

    const abstain = () => {
        setSelected({});
        setErrorMessage('');
        setAbstained((prev) => !prev);
    };

    const handleWriteIn = (event) => {
        const value = event.target.value.trim();
        setWriteInPosition(value);

        const [fName, lName] = value.split(' ');
        if (fName && lName) {
            setSelected({
                writeIn: true,
                positionID,
                positionName,
                allowedVotes,
                candidateID: null,
                fName,
                lName,
            });
            setErrorMessage('');
        } else {
            setErrorMessage('Please enter first and last name for write-in candidate.');
            setSelected({});
        }
    };

    // ✅ Expose selected value via ref
    useImperativeHandle(ref, () => ({
        getSelectedCandidates: () => {
            if (abstained) return null;
            if (!selected || Object.keys(selected).length === 0) return -1;

            // Handle write-in
            if (selected.writeIn === true) {
                return [{
                    positionID,
                    positionName,
                    allowedVotes,
                    writeIn: true,
                    fName: selected.fName,
                    lName: selected.lName,
                }];
            }

            // Normal candidates
            const selectedCandidates = Object.keys(selected)
                .filter((key) => selected[key])
                .map((candidateID) => {
                    const candidate = candidates.find(c => c.candidateID === parseInt(candidateID));
                    return candidate ? {
                        positionID,
                        positionName,
                        allowedVotes,
                        writeIn: false,
                        candidateID: candidate.candidateID,
                        fName: candidate.candidate.fName,
                        lName: candidate.candidate.lName,
                    } : null;
                }).filter(Boolean);

            return selectedCandidates;
        }
    }));

    const candidateButtons = candidates.map(candidateInfo => (
        <CandidateButton
            key={candidateInfo.candidateID}
            index={candidateInfo.candidateID}
            details={candidateInfo.candidate}
            isSelected={!!selected[candidateInfo.candidateID]}
            onToggle={handleToggle}
        />
    ));

    return (
        <div className='ballotVoteSection'>
            <div className='ballotVoteSectionDetails'>
                <h1>{positionName}</h1>
                <h3>Select: {allowedVotes}</h3>  
                <button className={`ballotAbstainButton ${abstained ? 'ballotAbstainButtonOn' : ''}`} onClick={abstain}>Abstain</button>
            </div>

            <div className='candidateContainer' style={{ opacity: abstained ? 0.5 : 1, pointerEvents: abstained ? 'none' : 'auto' }}>
    {candidateButtons}
</div>
<div className='writeIn'>
    <label>Write in: </label>
    <input
        type='text'
        onInput={handleWriteIn}
        disabled={abstained}
    />
</div>
{abstained && <div className='overlay'><p>Abstained</p></div>}
        </div>
    );
});

export default BallotPositionSection;
