import React from 'react';

const BallotButton = ({ ballotName, ballotStartDate, ballotEndDate, handleClick, disabled }) => {


    const formatDate = (date) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(date).toLocaleDateString(undefined, options);
    };


    if (disabled) {
        return (
            <button className="dashboardBallotButton buttonDisabled"
                onClick={handleClick} 
                disabled={disabled} 
            >
            <p>{ballotName}</p>
            <p style={{fontSize: ".6em"}}>
                {ballotStartDate && ballotEndDate 
                    ? `${formatDate(ballotStartDate)} - ${formatDate(ballotEndDate)}`
                    : "Invalid date"}
            </p>
            </button>
        );
    }

    return (
        <button className="dashboardBallotButton"
            onClick={handleClick} 
            disabled={disabled} 
        >
            <p>{ballotName}</p>
            <p style={{fontSize: ".6em"}}>
                {ballotStartDate && ballotEndDate 
                    ? `${formatDate(ballotStartDate)} - ${formatDate(ballotEndDate)}`
                    : "Invalid date"}
            </p>
        </button>
    );
};


export default BallotButton;