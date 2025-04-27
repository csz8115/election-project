import React, { useState } from 'react';

const CreateBallotInitiativeSection = ({ onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title && description) {
            onSubmit({ title, description });
            setTitle('');
            setDescription('');
        }
    };

    const handleAddChoice = () => {
        // Logic to add a choice to the initiative
        console.log("Adding choice");
    }

    return (
        <div className='ballotVoteSection ballotInitiativeSection'>
        <h1>{""}</h1>
        <p>{""}</p>
        <div className='initiativeOptions'>
            {""}
            <label>
                <input type="radio" name={""} value={"Abstain"} onChange={() => handleChoice("Abstain")} />
                <input type="text" className='initiativeTextbox'></input>
            </label>
            <button className={"addChoiceButton"} onClick={handleAddChoice}>Add Choice</button>
        </div>
    </div>
    );
};

export default CreateBallotInitiativeSection;