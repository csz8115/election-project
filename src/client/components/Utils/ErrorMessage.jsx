import React from 'react';

const ErrorMessage = ({ message }) => {
    return (
        <div className='errorMessage'>
            <p>{message || 'ERROR: Something went wrong. Please try again later.'}</p>
        </div>
    );
};

export default ErrorMessage;

