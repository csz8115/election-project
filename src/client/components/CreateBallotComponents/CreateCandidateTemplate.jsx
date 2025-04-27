import React from 'react';
import editImage from './edit.svg';

const CreateCandidateTemplate = ({index, candidateDetails, onClick }) => {
    return (
        <button onClick={() => onClick(index)} className="createCandidateButton">
            {candidateDetails.fName} {candidateDetails.lName}
            <img src={editImage} className="editImage" alt="edit button"/>
        </button>
    );
};

export default CreateCandidateTemplate;