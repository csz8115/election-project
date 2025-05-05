import React from 'react';

const UserButton = ({username, accountType, firstName, lastName, handleClick}) => {

    return (
        <div className="userButton" >
            <p>{username}</p>
            <p>{firstName} {lastName}</p>
            <p>{accountType}</p>
            <button className="deleteButton" onClick={handleClick}>Delete User</button>
        </div>
    );

}

export default UserButton