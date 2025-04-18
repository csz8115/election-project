import React from 'react';

const CreateCandidateButton = ({ onClick }) => {
    return (
        <button onClick={onClick} className="createCandidateButton">
            Create Candidate
        </button>
    );
};

export default CreateCandidateButton;