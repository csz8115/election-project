import React, { useState, useImperativeHandle, forwardRef } from 'react';
import ErrorMessage from '../Utils/ErrorMessage';

const CreateBallotInitiativeSection = forwardRef(({ details, deleteEvent }, ref) => {
    const [initiativeName, setInitiativeName] = useState(details?.initiativeName || '');
    const [description, setDescription] = useState(details?.description || '');
    const [responses, setResponses] = useState(details?.responses || []);
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

    const handleAddChoice = () => {
        const newChoice = { response: '' };
        setResponses((prevChoices) => [...prevChoices, newChoice]);
    };

    return (
        <div className='ballotVoteSection ballotInitiativeSection outline'>
            <img src='/images/delete.svg' className='deleteInitiative' alt='Delete Position' onClick={deleteEvent}></img>
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
                        <img
                            className='deleteChoice'
                            src='/images/delete.svg'
                            alt='Delete choice'
                            onClick={() => {
                                const newChoices = [...responses];
                                newChoices.splice(index, 1);
                                setResponses(newChoices);
                            }}
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