import React from 'react';

const CandidateInfo = ({ index, details, handleModal }) => {
    console.log("CandidateInfo details:", details);
    const { fName, lName, description, picture, titles } = details;
    
    console.log('CandidateInfo details:', details);
    return (
        <div className="candidateInfo">
            <img src='/images/delete.svg' className='closeModal' alt='Close modal' onClick={() => handleModal(index)}></img>
            <img src={picture} alt={`${fName} ${lName}`} />
            <h1>{`${fName} ${lName}`}</h1>
            <p>{description}</p>
            <p>{titles}</p>
        </div>
    );
};


export default CandidateInfo;