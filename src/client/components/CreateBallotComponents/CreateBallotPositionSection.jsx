import React, { useState } from 'react';
import CandidateButton from '../BallotComponents/CandidateButton';
import CreateCandidateButton from './CreateCandidateButton';
import CreateCandidateInfo from './CreateCandidateInfo';
import CreateCandidateTemplate from './CreateCandidateTemplate';

const CreateBallotPositionSection = () => {
    
    const [showCreateCandidateInfo, setShowCreateCandidateInfo] = useState(false);
    const [editCandidateIndex, setEditCandidateIndex] = useState(-1);
    const [candidates, setCandidates] = useState([]);

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
        console.log("Candidate added:", candidate);

        if (editCandidateIndex !== -1) {
            console.log("Editing candidate at index:", editCandidateIndex);
            const updatedCandidates = [...candidates];
            updatedCandidates[editCandidateIndex] = candidate;
            setCandidates(updatedCandidates);
        } else {
            setCandidates([...candidates, candidate]);
        }
        
        setShowCreateCandidateInfo(false);
        setEditCandidateIndex(-1);
    };

    const handleDelete = (candidateToDelete) => {
        console.log("Deleting candidate:", candidateToDelete);
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
                    <input className="ballotCreationTextInput" type="text" placeholder="PositionName" />
                    <input className="ballotCreationTextInput" type="text" placeholder="Voting Limit" />
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
        </div>
    );
};

export default CreateBallotPositionSection;