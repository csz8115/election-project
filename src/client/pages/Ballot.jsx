import { React, useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BallotPositionSection from '../components/BallotComponents/BallotPositionSection';
import BallotInitiativeSection from '../components/BallotComponents/BallotInitiativeSection';
import ErrorMessage from '../components/Utils/ErrorMessage'; // Import the Error component
const baseUrl = import.meta.env.VITE_API_BASE;

import '../components/Ballot.css';

const Ballot = () => {
    const [ballotObject, setBallotObject] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [filledBallot, setFilledBallot] = useState({});
    const positionRefs = useRef([]);
    const initiativeRefs = useRef([]);

    const user = useSelector((state) => ({
        userID: state.userID,
        username: state.username,
        accountType: state.accountType,
        fName: state.fName,
        lName: state.lName,
        companyID: state.companyID,
        companyName: state.companyName,
    }));

    const location = useLocation();
    const navigate = useNavigate();
    const ballotID = location.state;

    const handleBackButton = () => {
        navigate(-1);
    };

    const submitBallot = async () => {
        const selectedPositions = positionRefs.current.map((ref) => ref?.getSelectedCandidates());
        const selectedInitiatives = initiativeRefs.current.map((ref) => ref?.getSelectedChoice());
    
        if (selectedPositions.includes(undefined) || selectedPositions.includes(-1)) {
            setErrorMessage('Select, write in, or abstain for all positions.');
            return;
        }
    
        if (selectedInitiatives.includes(undefined)) {
            setErrorMessage('Select or abstain for all initiatives.');
            return;
        }
    
        // ❌ Remove `null` (abstain) from the arrays
        const cleanedPositions = selectedPositions
            .filter((entry) => entry !== null)
            .flat();
    
        const cleanedInitiatives = selectedInitiatives
            .filter((entry) => entry !== null);
    
        const ballotSubmission = {
            ballot: {
                ...filledBallot,
                positions: cleanedPositions,
                initiatives: cleanedInitiatives,
            },
        };
    
        console.log(ballotSubmission);
    
        try {
            const response = await fetch(`${baseUrl}api/v1/member/submitBallot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(ballotSubmission),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw Error(errorData.error || 'Network response was not ok');
            }
    
            const result = await response.json();
            alert("Ballot submitted successfully!");
            navigate('/dashboard');
        } catch (error) {
            setErrorMessage(error.message || 'An unknown error occurred');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${baseUrl}api/v1/member/getBallot/?ballotID=${ballotID.ballotID}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();

                if (result) {
                    setFilledBallot({
                        ballotID: result.ballotID,
                        userID: user.userID,
                        ballotName: result.ballotName,
                        description: result.description,
                        startDate: result.startDate,
                        endDate: result.endDate,
                        companyID: result.companyID,
                    });
                    setBallotObject(result);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    if (ballotObject == null) {
        return (
            <div className="ballot">
                <h1>Loading...</h1>
            </div>
        );
    }

    return (
        <div className="ballot">
            <button className="backButton" onClick={handleBackButton}>
                &lt; Back
            </button>
            <h1>{ballotObject.ballotName}</h1>
            <h3>{ballotObject.description}</h3>
            <div className="ballotBody">
                {ballotObject.positions.map((position, index) => (
                    <BallotPositionSection
                        key={ballotObject.ballotID + '_' + position.positionName}
                        positionObject={position}
                        ref={(el) => (positionRefs.current[index] = el)}
                    />
                ))}
                {ballotObject.initiatives.map((initiative, index) => (
                    <BallotInitiativeSection
                        key={ballotObject.ballotID + '_' + initiative.initiativeID}
                        initiativeObject={initiative}
                        ref={(el) => (initiativeRefs.current[index] = el)}
                    />
                ))}
            </div>
            <div>
                {errorMessage && <ErrorMessage message={errorMessage} />}
                <button className="submitBallot" type="submitBallot" onClick={submitBallot}>
                    Submit Ballot
                </button>
            </div>
        </div>
    );
};

export default Ballot;
