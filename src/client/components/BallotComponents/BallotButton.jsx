import React from 'react';

const BallotButton = ({ label, onClick, disabled }) => {

    if (disabled) {
        return (
            <button className="dashboardBallotButton buttonDisabled"
                onClick={onClick} 
                disabled={disabled} 
            >
                {label}
            </button>
        );
    }

    return (
        <button className="dashboardBallotButton"
            onClick={onClick} 
            disabled={disabled} 
        >
            {label}
        </button>
    );
};


export default BallotButton;