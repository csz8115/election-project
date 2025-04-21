import React, { useState } from 'react';
import ErrorMessage from './ErrorMessage';

const SubmitBallot = ({ ballotSubmission }) => {
    const [error, setError] = useState(null);


    const handleSubmit = () => {
        try {
            ballotSubmission();
        }
        catch (err) {
            setError(`[${err}] An error occurred while submitting the ballot. Please try again.`);
        }

    };

    return (
        <div>
            {error && (
                <ErrorMessage message={error}></ErrorMessage>)}
                <button className={"submitBallot"}type="submitBallot" onClick={handleSubmit}>Submit Ballot</button>
        </div>
    );
};

export default SubmitBallot;