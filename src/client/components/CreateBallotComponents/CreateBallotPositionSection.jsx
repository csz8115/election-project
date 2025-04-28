import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import CandidateButton from '../BallotComponents/CandidateButton';
import CreateCandidateButton from './CreateCandidateButton';
import CreateCandidateInfo from './CreateCandidateInfo';
import CreateCandidateTemplate from './CreateCandidateTemplate';
import ErrorMessage from '../Utils/ErrorMessage';

const CreateBallotPositionSection = forwardRef((props, ref) => {
    
    const [showCreateCandidateInfo, setShowCreateCandidateInfo] = useState(false);
    const [editCandidateIndex, setEditCandidateIndex] = useState(-1);
    const [ballotPosition, setBallotPosition] = useState({
        positionName: '',
        allowedVotes: '',
        writeIn: false,
        candidates: [],
    });
    const [candidates, setCandidates] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    useImperativeHandle(ref, () => ({
        getValue: () => {
            if (!ballotPosition.positionName.trim()) {
                setErrorMessage('Position Name is required.');
                return null;
            }
            if (!ballotPosition.allowedVotes.trim() || isNaN(ballotPosition.allowedVotes)) {
                setErrorMessage('Voting Limit is required and must be a number.');
                return null;
            }
            if (candidates.length === 0) {
                setErrorMessage('At least one candidate is required.');
                return null;
            }
            setErrorMessage('');
            return { ...ballotPosition, allowedVotes: parseInt(ballotPosition.allowedVotes), candidates: candidates };
        },
    }));

    const handleCandidateAdd = (index) => {
        if (index !== undefined) {
            setEditCandidateIndex(index);
        }
        
        setShowCreateCandidateInfo(true);
    };

    const handleClose = () => {
        setEditCandidateIndex(-1);
        setShowCreateCandidateInfo(false);
    };
    
    const handleSave = (candidate) => {

        let updatedCandidates = [...candidates];
        if (editCandidateIndex !== -1) {
            updatedCandidates[editCandidateIndex] = candidate;
            setCandidates(updatedCandidates);
        } else {
            setCandidates([...candidates, candidate]);
        }
        
        setShowCreateCandidateInfo(false);
        setEditCandidateIndex(-1);
    };


    const handleDelete = (candidateToDelete) => {
        const updatedCandidates = candidates.filter(candidate => candidate !== candidateToDelete);
        setCandidates(updatedCandidates);
        setEditCandidateIndex(-1);
        setShowCreateCandidateInfo(false);
    };
    
    return (
        <div className='ballotVoteSection'>
            {(showCreateCandidateInfo) && (
                <CreateCandidateInfo
                    candidateDetails={candidates[editCandidateIndex]}
                    show={true}
                    handleClose={handleClose}
                    handleSave={handleSave}
                    handleDelete={handleDelete}
                />
            )}
            <div>
                <div className='ballotVoteSectionDetails'>
                <input
                    className="ballotCreationTextInput"
                    type="text"
                    placeholder="Position Name *"
                    value={ballotPosition.positionName}
                    onChange={(e) => setBallotPosition({ ...ballotPosition, positionName: e.target.value })}
                />
                <input
                    className="ballotCreationTextInput"
                    type="number"
                    placeholder="Voting Limit *"
                    value={ballotPosition.allowedVotes}
                    onChange={(e) => setBallotPosition({ ...ballotPosition, allowedVotes: e.target.value })}
                />
                </div>
                <div className='candidateContainer'>
                    {candidates.map((candidate, index) => (
                        <CreateCandidateTemplate
                            index={index}
                            key={index}
                            candidateDetails={candidate}
                            onClick={() => handleCandidateAdd(index)}
                        />
                    ))}
                    <CreateCandidateButton onClick={handleCandidateAdd}/>
                </div>
            </div>
            {errorMessage && (
                <ErrorMessage message={errorMessage} />
            )}
        </div>
    );
});

export default CreateBallotPositionSection;