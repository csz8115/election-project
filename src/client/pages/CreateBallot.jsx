import {React, useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CreateBallotPositionSection from '../components/CreateBallotComponents/CreateBallotPositionSection';
import CreateBallotIniativeSection from '../components/CreateBallotComponents/CreateBallotInitiativeSection';
import '../components/Ballot.css';


const CreateBallot = () => {
    const [ballot, setBallot] = useState(null);
    const [ballotName, setBallotName] = useState({
        ballotName: '',
        description: '',
        startDate: '',
        endDate: '',
    });

    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [positionArray, setPositionArray] = useState([]);
    const [initiativeArray, setInitiativeArray] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();

    const handleBackButton = () => {
        navigate(-1);
    }

    const positionSectionArray = positionArray.map((position, index) => (
        <CreateBallotPositionSection key={index} />
    ));

    const initiativeSectionArray = initiativeArray.map((initiative, index) => (
        <CreateBallotIniativeSection key={index} />
    ));

    const addPositionField = () => {
        console.log("Adding position field");
        const newPositionSection = <CreateBallotPositionSection key={positionSectionArray.length+1}/>
        setPositionArray((prevPositions) => [...prevPositions, newPositionSection]);
        console.log(positionSectionArray);
    }

    const addInitiativeField = () => {
        console.log("Adding initiative field");
        const newInitiativeSection = <CreateBallotIniativeSection key={initiativeSectionArray.length+1}/>
        setInitiativeArray((prevInitiatives) => [...prevInitiatives, newInitiativeSection]);
        console.log(initiativeSectionArray);
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

    const handleBallotSubmit = () => {
        const ballotObject = {
            ballotName: ballotName,
            description: description,
            startDate: startDate,
            endDate: endDate,
            positions: positionArray,
            initiatives: initiativeArray,
        }
    }

    return (
        <div className='ballot'>
            <button className='backButton' onClick={handleBackButton}>&lt; Back</button>

            <div className='ballotCreationHeader'>
                <div className='left'>
                    <input className="ballotCreationTextInput" type="text" placeholder="Ballot Name" onChange={handleBallotNameChange}/>
                    <input className="ballotCreationTextInput" type="text" placeholder="Ballot Description" onChange={handleDescriptionChange} />
                </div>
                <div className="right">
                    <div>
                        <label className="ballotLabel">Start Date:</label>
                        <input className="ballotCreationTextInput" type="date" onChange={handleStartDateChange} />
                    </div>
                    <div>
                        <label className="ballotLabel">End Date:</label>
                        <input className="ballotCreationTextInput" type="date" onChange={handleEndDateChange}/>
                    </div>
                </div>
            </div>
            <div className='ballotBody'>
                {positionSectionArray}
                <button className="addPosition" onClick={() => addPositionField()}>Add Position</button>
                {initiativeSectionArray}
                <button className="addPosition" onClick={() => addInitiativeField()}>Add Initiative</button>
            </div>
            <button className='submitBallot'>Create Ballot</button>
        </div>
    );
};

export default CreateBallot;