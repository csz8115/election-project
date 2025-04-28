import React, { useState, useImperativeHandle, forwardRef } from 'react';
import ErrorMessage from '../Utils/ErrorMessage';

const CreateBallotInitiativeSection = forwardRef((props, ref) => {
    const [initiativeName, setInitiativeName] = useState('');
    const [description, setDescription] = useState('');
    const [responses, setResponses] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    useImperativeHandle(ref, () => ({
        getValue: () => {
            if (!initiativeName.trim()) {
                setErrorMessage("Initiative name is required.");
                return null;
            }
            if (!description.trim()) {
                setErrorMessage("Description is required.");
                return null;
            }
            if (responses.length === 0) {
                setErrorMessage("At least one response is required.");
                return null;
            }
            if (responses.some((choice) => !choice.response.trim())) {
                setErrorMessage("All responses must have a value.");
                return null;
            }
            setErrorMessage('');
            return {
                initiativeName,
                description,
                responses,
            };
        },
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
            {errorMessage && (
                <ErrorMessage message={errorMessage} />
            )}
        </div>
    );
});

export default CreateBallotInitiativeSection;