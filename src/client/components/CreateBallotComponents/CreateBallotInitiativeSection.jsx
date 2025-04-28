import React, { useState, useImperativeHandle, forwardRef } from 'react';

const CreateBallotInitiativeSection = forwardRef((props, ref) => {
    const [initiativeName, setInitiativeName] = useState('');
    const [description, setDescription] = useState('');
    const [responses, setResponses] = useState([]);

    useImperativeHandle(ref, () => ({
        getValue: () => ({
            initiativeName,
            description,
            responses,
        }),
    }));

    console.log("Responses: ", responses);

    const handleAddChoice = () => {
        // Logic to add a choice to the initiative
        console.log("Adding choice");
        const newChoice = {response: ''}
        setResponses((prevChoices) => [...prevChoices, newChoice]);
        
    }

    return (
        <div className='ballotVoteSection ballotInitiativeSection outline'>
            <input
                type='text'
                className='ballotCreationTextInput'
                value={initiativeName}
                onChange={(e) => setInitiativeName(e.target.value)}
                placeholder="Enter initiativeName"
            />
            <input
                type='text'
                className='ballotCreationTextInput'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
            />
            <div className='initiativeOptions'>
                {responses.map((choice, index) => (
                    <label key={index} className='createInitiativeOption'>
                        <input type="radio" name="initiativeChoice" value={choice} />
                        <input
                            type="text"
                            className='initiativeTextbox'
                            value={choice.response}
                            onChange={(e) => {
                                const newChoices = [...responses];
                                newChoices[index].response = e.target.value;
                                setResponses(newChoices);
                            }}
                            placeholder={`Choice ${index + 1}`}
                        />
                    </label>
                ))}
                <button className={"addChoiceButton"} onClick={handleAddChoice}>Add Choice</button>
            </div>
        </div>
    );
});

export default CreateBallotInitiativeSection;