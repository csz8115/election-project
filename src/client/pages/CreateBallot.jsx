import {React, useEffect, useState, useRef, createRef} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CreateBallotPositionSection from '../components/CreateBallotComponents/CreateBallotPositionSection';
import CreateBallotIniativeSection from '../components/CreateBallotComponents/CreateBallotInitiativeSection';
import ErrorMessage from '../components/Utils/ErrorMessage';
import '../components/Ballot.css';
import { set } from 'zod';


const CreateBallot = ({ballotID}) => {

    const [ballot, setBallot] = useState(null);
    const [ballotName, setBallotName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [positionArray, setPositionArray] = useState([]);
    const [initiativeArray, setInitiativeArray] = useState([]);
    const location = useLocation();
    const positionRefs = useRef([]);
    const initiativeRefs = useRef([]);
    const [errorMessage, setErrorMessage] = useState('');
    const stateCompanyID = useSelector((state) => {
        return state.companyID;
    });
    const [companyID, setCompanyID] = useState(stateCompanyID);


    const editBallot = (ballotID) => {
        console.log("Editing ballot: ", ballotID);
        fetch(`http://localhost:3000/api/getBallot/?ballotID=${ballotID}`, {
            method: 'GET',
            credentials: 'include',
        })
        .then((response) => response.json())
        .then((data) => {
            console.log("Ballot data: ", data);
            setBallot(data);
            setBallotName(data.ballotName);
            setDescription(data.description);
            setStartDate(data.startDate);
            setEndDate(data.endDate);
            setPositionArray(data.positions);
            setInitiativeArray(data.initiatives);
        })
        .catch((error) => {
            console.error("Error fetching ballot data: ", error);
        });
    }

    useEffect(() => {
        if (ballotID) {
            console.log("Editing ballot: ", ballotID);
            editBallot(ballotID);
        } else {
            console.log("Creating new ballot");
        }
    }, [ballotID]);


    /* if (ballotID) {
        console.log("Editing ballot: ", ballotID);
        editBallot(ballotID);
    } */



    if (positionRefs.current.length !== positionArray.length) {
        positionRefs.current = Array(positionArray.length)
            .fill()
            .map((_, i) => positionRefs.current[i] || createRef());
    }

    if (initiativeRefs.current.length !== initiativeArray.length) {
        initiativeRefs.current = Array(initiativeArray.length)
            .fill()
            .map((_, i) => initiativeRefs.current[i] || createRef());
    }

    const navigate = useNavigate();

    const handleBackButton = () => {
        navigate(-1);
    }

    console.log("postion aray: ", positionArray)

    const positionSectionArray = positionArray.map((position, index) => (
        console.log("Position: ", position),
        <CreateBallotPositionSection key={index} details={position} ref={positionRefs.current[index]} />
    ));

    console.log("initiative aray: ", initiativeArray)

    const initiativeSectionArray = initiativeArray.map((initiative, index) => (
        <CreateBallotIniativeSection key={index} details={initiative} ref={initiativeRefs.current[index]} />
    ));

    const addPositionField = () => {
        console.log("Adding position field");
        setPositionArray((prevPositions) => [...prevPositions, {}]);
    }

    const addInitiativeField = () => {
        console.log("Adding initiative field");
        setInitiativeArray((prevInitiatives) => [...prevInitiatives, {}]);
    }

    const handleBallotNameChange = (event) => {
        const name = event.target.value;
        console.log("Ballot name: ", name);
        setBallotName(name);
    }
    const handleDescriptionChange = (event) => {
        const description = event.target.value;
        setDescription(description);
    }
    const handleStartDateChange = (event) => {
        const date = event.target.value;
        setStartDate(date);
    }
    const handleEndDateChange = (event) => {
        const date = event.target.value;
        console.log("End date: ", date);
        setEndDate(date);
    }

    const submitBallot = async () => {
        const ballotObject = {
            ballotName: ballotName,
            description: description,
            startDate: startDate,
            endDate: endDate,
            companyID: companyID,
            positions: positionRefs.current.map(ref => ref.current?.getValue()),
            initiatives: initiativeRefs.current.map(ref => ref.current?.getValue()),
        };

        console.log("Ballot object: ", ballotObject);

        if (!ballotObject.ballotName) {
            setErrorMessage("Ballot name is required.");
            return;
        }
        if (!ballotObject.description) {
            setErrorMessage("Ballot description is required.");
            return;
        }
        if (!ballotObject.startDate) {
            setErrorMessage("Start date is required.");
            return;
        }
        if (!ballotObject.endDate) {
            setErrorMessage("End date is required.");
            return;
        }
        if (new Date(ballotObject.startDate) >= new Date(ballotObject.endDate)) {
            setErrorMessage("End date must be after start date.");
            return;
        }

        if (new Date(ballotObject.endDate) <= new Date()) {
            setErrorMessage("End date must be after the current date.");
            return;
        }

        if (positionArray.length === 0 && initiativeArray.length === 0) {
            setErrorMessage("At least one position or initiative is required.");
            return;
        }


        for (const position of ballotObject.positions) {
            if (!position || !position.candidates || position.candidates.length === 0) {
            setErrorMessage("Each position must have at least one candidate.");
            return;
            }

            if (position.allowedVotes > position.candidates.length) {
            setErrorMessage("Vote limit for a position cannot exceed the number of candidates.");
            return;
            }
        }

        setErrorMessage('');

        if (ballotID) {
            try {
                const response = await fetch(`http://localhost:3000/api/updateBallot/${ballotID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(ballotObject),
                });

                console.log("Response: ",ballotObject);
    
                if (response.ok) {
                    const data = await response.json();
                    console.log("Ballot updated successfully: ", data);
                } else {
                    console.error("Failed to updated ballot: ", response.statusText);
                }
            } catch (error) {
                console.error("Error updating ballot: ", error);
                alert("An error occurred while submitting the ballot.");
            }
            return;
        };


        try {
            const response = await fetch(`http://localhost:3000/api/createBallot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ballotObject),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Ballot submitted successfully: ", data);
            } else {
                console.error("Failed to submit ballot: ", response.statusText);
            }
        } catch (error) {
            console.error("Error submitting ballot: ", error);
            alert("An error occurred while submitting the ballot.");
        }
    };

    return (
        <div className='ballot'>
            <button className='backButton' onClick={handleBackButton}>&lt; Back</button>

            <div className='ballotCreationHeader'>
                <div className='left'>
                    <input className="ballotCreationTextInput" type="text" placeholder="Ballot Name *" onChange={handleBallotNameChange} value={ballotName}/>
                    <input className="ballotCreationTextInput" type="text" placeholder="Ballot Description *" onChange={handleDescriptionChange} value={description}/>
                </div>
                <div className="right">
                    <div>
                        <label className="ballotLabel">Start Date *:</label>
                        <input className="ballotCreationTextInput" type="date" onChange={handleStartDateChange} value={startDate.slice(0, 10)}/>
                    </div>
                    <div>
                        <label className="ballotLabel">End Date *:</label>
                        <input className="ballotCreationTextInput" type="date" onChange={handleEndDateChange} value={endDate.slice(0, 10)}/>
                    </div>
                </div>
            </div>
            <div className='ballotBody'>
                {positionSectionArray}
                <button className="addPosition" onClick={() => addPositionField()}>Add Position</button>
                {initiativeSectionArray}
                <button className="addPosition" onClick={() => addInitiativeField()}>Add Initiative</button>
            </div>
            {errorMessage && <ErrorMessage message={errorMessage} />}
            <button className='submitBallot' onClick={submitBallot}>Create Ballot</button>
        </div>
    );
};

export default CreateBallot;