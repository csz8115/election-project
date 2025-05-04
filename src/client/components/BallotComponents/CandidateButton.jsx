import React, { useState } from 'react';
import CandidateInfo from './CandidateInfo';

const CandidateButton = ({index, details, isSelected, onToggle}) => {
    const [isToggled, setIsToggled] = useState(false);

    const handleModal = () => {
        setIsToggled(!isToggled);
        console.log("toggled", isToggled)
    };
    console.log("CandidateButton details:", details);
    return (
        <div className='candidateField'>
            <button style={{background: `url(${details.picture})`}}
                className={`candidateButton ${isSelected ? 'candidateButtonToggled' : ''}`} 
                onClick={() => onToggle(index)}
                
            >
            </button>
            <img src='/images/info.svg' className='infoImage' alt='Info' onClick={() => handleModal(index)}></img>

            <p>{`${details.fName} ${details.lName}`}</p>
            {isToggled && <CandidateInfo index={index} details={details} handleModal={handleModal} />}
        </div>
    );
};

export default CandidateButton;