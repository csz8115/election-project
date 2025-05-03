import React from 'react';

const CreateCandidateTemplate = ({index, candidateDetails, onClick, deleteTemplate }) => {
    return (
        <button className="createCandidateButton">
            <img src='/images/delete.svg' className="deleteImage" alt="delete button" onClick={deleteTemplate}/>
            {candidateDetails.fName} {candidateDetails.lName}
            <img src='/images/edit.svg' className="editImage" alt="edit button" onClick={() => onClick(index)}/>
        </button>
    );
};

export default CreateCandidateTemplate;