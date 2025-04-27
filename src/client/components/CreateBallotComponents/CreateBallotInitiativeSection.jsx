import React, { useState } from 'react';

const CreateBallotInitiativeSection = ({ onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [choices, setChoices] = useState([]);

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
        const newChoice = {response: ''}
        setChoices((prevChoices) => [...prevChoices, newChoice]);
        
    }

    return (
        <div className='ballotVoteSection ballotInitiativeSection outline'>
            <input
                type='text'
                className='ballotCreationTextInput'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
            />
            <input
                type='text'
                className='ballotCreationTextInput'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
            />
            <div className='initiativeOptions'>
                {choices.map((choice, index) => (
                    <label key={index} className='createInitiativeOption'>
                        <input type="radio" name="initiativeChoice" value={choice} />
                        <input
                            type="text"
                            className='initiativeTextbox'
                            value={choice.response}
                            onChange={(e) => {
                                const newChoices = [...choices];
                                newChoices[index].response = e.target.value;
                                setChoices(newChoices);
                            }}
                            placeholder={`Choice ${index + 1}`}
                        />
                    </label>
                ))}
                <button className={"addChoiceButton"} onClick={handleAddChoice}>Add Choice</button>
            </div>
        </div>
    );
};

export default CreateBallotInitiativeSection;