import React from 'react';

const CompanyButton = ({companyName, handleClick}) => {

    return (
        <button className="companyButton" onClick={handleClick} >
            <p>{companyName}</p>
        </button>
    );

}

export default CompanyButton