import React, { useState, forwardRef, useImperativeHandle } from 'react';

const BallotInitiativeSection = forwardRef(({ initiativeObject }, ref) => {
    const [selected, setSelected] = useState(null);

    const handleChoice = (responseID) => {
        setSelected(responseID);
    };

    // ✅ Expose selected value to parent via ref
    useImperativeHandle(ref, () => ({
        getSelectedChoice: () => {
            if (selected === null || selected === "Abstain") return null;
            return {
                initiativeID: initiativeObject.initiativeID,
                initiativeName: initiativeObject.initiativeName,
                description: initiativeObject.description,
                responseID: selected,
            };
        }
    }));

    const choicesInput = initiativeObject.responses.map(choice => (
        <label key={choice.responseID}>
            <input 
                type="radio" 
                name={`vote_${initiativeObject.initiativeID}`}
                value={choice.responseID} 
                onChange={() => handleChoice(choice.responseID)} 
            />
            {choice.response}
        </label>
    ));

    return (
        <div className='ballotVoteSection ballotInitiativeSection'>
            <h1>{initiativeObject.initiativeName}</h1>
            <p>{initiativeObject.description}</p>
            <div className='initiativeOptions'>
                {choicesInput}
                <label>
                    <input
                        type="radio"
                        name={`vote_${initiativeObject.initiativeID}`}
                        value="Abstain"
                        onChange={() => handleChoice("Abstain")}
                    />
                    Abstain
                </label>
            </div>
        </div>
    );
});

export default BallotInitiativeSection;
