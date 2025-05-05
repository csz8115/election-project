import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorMessage from '../components/Utils/ErrorMessage';

const baseUrl = import.meta.env.VITE_API_BASE;

const ElectionResults = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const location = useLocation();

    const handleBackButton = () => {
        navigate(-1); // Navigate back to the previous page
    };

    if (!location.state) {
        return (
            <div className='company'>
                <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
                <h1>Ballot Not Found</h1>
                <p>Please go back to the dashboard and select a company.</p>
            </div>
        );
    }
    
    const ballotID = location.state.ballotID;

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await fetch(`${baseUrl}api/v1/officer/viewBallotResults?ballotID=${ballotID}`, {
                    method: 'GET',
                    credentials: 'include', // Include cookies for authentication
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch election results');
                }

                const data = await response.json();
                setResults(data);
            } catch (error) {
                console.error('Error fetching election results:', error);
                setErrorMessage(error.message);
            }
        };

        if (ballotID) {
            fetchResults();
        }
    }, [ballotID]);

    

    return (
        <div className="election-results">
            <button className="backButton" onClick={handleBackButton}>
                &lt; Back
            </button>

            <h2>Election Results</h2>

            {errorMessage && <ErrorMessage message={errorMessage} />}

            {!results && !errorMessage && <p>Loading results...</p>}

            {results && (
                <div className="results-container">
                    <h3>Ballot: {results.ballotName}</h3>
                    <p>Description: {results.description}</p>
                    <p>Start Date: {results.startDate}</p>
                    <p>End Date: {results.endDate}</p>

                    <h4>Positions:</h4>
                    {results.positions && results.positions.length > 0 ? (
                        results.positions.map((position) => (
                            <div key={position.positionID} className="position">
                                <h5>{position.positionName}</h5>
                                <ul>
                                    {position.candidates.map((candidate) => (
                                        <li key={candidate.candidateID}>
                                            {candidate.name} - {candidate.votes} votes
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p>No positions available.</p>
                    )}

                    <h4>Initiatives:</h4>
                    {results.initiatives && results.initiatives.length > 0 ? (
                        results.initiatives.map((initiative) => (
                            <div key={initiative.initiativeID} className="initiative">
                                <h5>{initiative.initiativeName}</h5>
                                <p>Votes in Favor: {initiative.votesInFavor}</p>
                                <p>Votes Against: {initiative.votesAgainst}</p>
                            </div>
                        ))
                    ) : (
                        <p>No initiatives available.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ElectionResults;