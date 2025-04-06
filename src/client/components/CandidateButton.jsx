import React, { useState } from 'react';

const CandidateButton = ({index, details, isSelected, onToggle}) => {

    return (
        <div className='candidateField'>
            <button style={{background: `url(${details.picture})`}}
                className={`candidateButton ${isSelected ? 'candidateButtonToggled' : ''}`} 
                onClick={() => onToggle(index)}
            >
            </button>
            <p>{`${details.fName} ${details.lName}`}</p>
        </div>
    );
};

export default CandidateButton;