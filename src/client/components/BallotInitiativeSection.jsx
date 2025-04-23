import React from 'react';
import { useState } from 'react';
import './BallotPositionSection'

const BallotInitiativeSection = ({initiativeObject, returnChoice}) => {

    const handleChoice = (responseID) => {
        if (responseID === "Abstain") {
            returnChoice(null);
            return;
        }
        const initiativeSubmissionObject = {
            initiativeID: initiativeObject.initiativeID,
            initiativeName: initiativeObject.initiativeName,
            description: initiativeObject.description,
            responseID: responseID,
        }
        returnChoice(initiativeSubmissionObject);
    }

    var choicesInput = [];
    initiativeObject.responses.map(choice => {
        choicesInput.push(
            <label key={choice.responseID}>
                <input 
                    type="radio" 
                    name={`vote_${initiativeObject.initiativeID}`}
                    value={choice.responseID} 
                    onChange={() => handleChoice(choice.responseID)} 
                />
                {choice.response}
            </label>
        );
    });
    

    return (

    <div className='ballotVoteSection ballotInitiativeSection'>
        <h1>{initiativeObject.initiativeTitle}</h1>
        <p>{initiativeObject.description}</p>
        <div className='initiativeOptions'>
            {choicesInput}
            <label>
                <input type="radio" name={`vote_${initiativeObject.initiativeID}`} value={"Abstain"} onChange={() => handleChoice("Abstain")} />
                Abstain
            </label>
        </div>
    </div>

    );
};

export default BallotInitiativeSection;