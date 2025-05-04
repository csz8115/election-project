import React from 'react';

const CreateCandidateButton = ({ onClick }) => {
    return (
        <button onClick={() => onClick(-1)} className="createCandidateButton">
            Create Candidate
        </button>
    );
};

export default CreateCandidateButton;