import React from 'react';
import './BallotPositionSection'

const BallotInitiativeSection = ({initiativeTitle, propositionDescription}) => {
    return (

    <div className='ballotInitiativeSection'>
        <h1>{initiativeTitle}</h1>
        <p>{propositionDescription}</p>
        <div className='initiativeOptions'>
            <label>
                <input type="radio" name="vote" value="yes" />
                Yes
            </label>
            <label>
                <input type="radio" name="vote" value="no" />
                No
            </label>
            <label>
                <input type="radio" name="vote" value="abstain" />
                Abstain
            </label>
        </div>
    </div>

    );
};

export default BallotInitiativeSection;