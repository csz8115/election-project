import {React, useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CreateBallotPositionSection from '../components/CreateBallotComponents/CreateBallotPositionSection';
import CreateBallotIniativeSection from '../components/CreateBallotComponents/CreateBallotInitiativeSection';
import '../components/Ballot.css';


const CreateBallot = () => {
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

    return (
        <div className='ballot'>
            <div className='ballotCreationHeader'>
                <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
                <input className="ballotCreationTextInput" type="text" placeholder="Ballot Name" />
                <input className="ballotCreationTextInput" type="text" placeholder="Ballot Description" />
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