import {React, useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BallotPositionSection from '../components/BallotPositionSection'
import BallotInitiativeSection from '../components/BallotInitiativeSection';
import ErrorMessage from '../components/ErrorMessage'; // Import the Error component


import '../components/Ballot.css';


const Ballot = () => {
    const [ballotObject, setBallotObject] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedPositions, setSelectedPositions] = useState([]);
    const [selectedInitiatives, setSelectedInitiatives] = useState([]);
    const [filledBallot, setFilledBallot] = useState({});
    
    const user = useSelector((state) => {
        return {
            userID: state.userID,
            username: state.username,
            accountType: state.accountType,
            fName: state.fName,
            lName: state.lName,
            companyID: state.companyID,
            companyName: state.companyName,
        };
    });

    const location = useLocation();
    const navigate = useNavigate();

    
    if (!location.state) {
        return (
            <div className='ballot'>
                <h1>Ballot Not Found</h1>
                <p>Please go back to the dashboard and select a ballot.</p>
            </div>
        );
    }

    const ballotID = location.state;

    const handleBackButton = () => {
        navigate(-1);
    }

    const handleSelectionPosition = (positionSubmissionArray) => {
        // positionSubmissionArray should be an array of selected candidates for one position (e.g., President)
        if (!Array.isArray(positionSubmissionArray) || positionSubmissionArray.length === 0) return;
    
        const targetPositionID = positionSubmissionArray[0].positionID;
    
        setSelectedPositions(prevSelectedPositions => {
            // Remove existing group for the same position
            const updated = prevSelectedPositions.filter(
                group => group[0]?.positionID !== targetPositionID
            );
    
            // Add the new group
            return [...updated, positionSubmissionArray];
        });
    };

    const handleSelectionInitiative = (initiativeSubmissionObject) => {
        console.log("Initiative Submission Object: ", initiativeSubmissionObject);
        if (initiativeSubmissionObject == null){
            return; 
        }

        setSelectedInitiatives(prevSelectedInitiatives => {
            const existingIndex = prevSelectedInitiatives.findIndex(
                item => item.initiativeID === initiativeSubmissionObject.initiativeID
            );
    
            if (existingIndex !== -1) {
                // Update existing initiative
                const updated = [...prevSelectedInitiatives];
                updated[existingIndex] = initiativeSubmissionObject;
                return updated;
            } else {
                // Add new initiative
                return [...prevSelectedInitiatives, initiativeSubmissionObject];
            }
        });
    };


    const submitBallot = async () => {
        const ballotSubmission = {
            ballot: {
                ...filledBallot, 
                positions: selectedPositions.flat(),
                initiatives: selectedInitiatives
            }   
        };

        console.log("Ballot Submission: ", ballotSubmission);

        try {
            const response = await fetch('http://localhost:3000/api/submitBallot', {
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
            console.log("Submission successful:", result);
            alert("Ballot submitted successfully!");
            navigate('/dashboard'); // Redirect to dashboard after successful submission
        } catch (error) {

            setErrorMessage(error.message || 'An unknown error occurred');

        }
    };

    useEffect(() => {
            const fetchData = async () => {
                try {
                    const response = await fetch(`http://localhost:3000/api/getBallot/?ballotID=${ballotID.ballotID}`, {
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
                            companyID: result.companyID
                        });
                        setBallotObject(result);
                        console.log(result)
                    }
    
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            };
    
            fetchData();
        }, []); 
        
    if (ballotObject == null) {
        return (
            <div className='ballot'>
                <h1>Loading...</h1>
            </div>
        );
    }

    var positionSectionArray = [];
    ballotObject.positions.map(position => {
        positionSectionArray.push(<BallotPositionSection
            key={ballotObject.ballotID+'_'+position.positionName} 
            positionObject={position}
            returnSelected={handleSelectionPosition}>
            </BallotPositionSection>);
    });

    var initiativeSectionArray = [];
    ballotObject.initiatives.map(initiative => {
        initiativeSectionArray.push(<BallotInitiativeSection
            key={ballotObject.ballotID+'_'+initiative.initiativeID} 
            initiativeObject={initiative}
            returnChoice={handleSelectionInitiative}>
            </BallotInitiativeSection>);
    });


    return (
        <div className='ballot'>
            <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
            <h1>{ballotObject.ballotName}</h1>
            <h3>{ballotObject.description}</h3>
            <div className='ballotBody'>
                {positionSectionArray}
                {initiativeSectionArray}
            </div>
            <div>
                {errorMessage && <ErrorMessage message={errorMessage} />}
                <button className={"submitBallot"}type="submitBallot" onClick={submitBallot}>Submit Ballot</button>
            </div>
        </div>
    );
};

export default Ballot;