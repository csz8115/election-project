import React from 'react';

const UserButton = ({username, accountType, firstName, lastName, handleClick}) => {

    return (
        <button className="userButton" onClick={handleClick} >
            <p>{username}</p>
            <p>{firstName} {lastName}</p>
            <p>{accountType}</p>
        </button>
    );

}

export default UserButton