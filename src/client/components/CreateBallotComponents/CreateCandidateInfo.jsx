import {React, useState, useEffect } from 'react';
import ErrorMessage from '../Utils/ErrorMessage';

const CreateCandidateInfo = ({ candidateDetails, show, handleClose, handleSave, handleDelete }) => {

    const [fName, setfName] = useState('');
    const [lName, setlName] = useState('');
    const [description, setDescription] = useState('');
    const [picture, setPicture] = useState('');
    const [canDelete, setCanDelete] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
        

    useEffect(() => {
        if (candidateDetails) {
            const { fName, lName, description, picture, titles } = candidateDetails;
            setfName(fName);
            setlName(lName);
            setDescription(description);
            setPicture(picture);
            setCanDelete(true);
        }
    }, [candidateDetails]);


    const onSave = () => {

        if (!fName) {
            setErrorMessage('Please include first name.');
            return;
        }
        if (!lName) {
            setErrorMessage('Please include last name.');
            return;
        }

        handleSave({ fName, lName, description, picture });
        setfName('');
        setlName('');
        setDescription('');
        setPicture('');
        handleClose();
    };

    if (!show) return null;

    return (
        <div className="candidateInfoModal">
            <h1>Create Candidate Info</h1>
            <input
                type="text"
                placeholder="First Name *"
                value={fName}
                onChange={(e) => setfName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Last Name *"
                value={lName}
                onChange={(e) => setlName(e.target.value)}
            />
            <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <input
                type="url"
                placeholder="Image URL"
                value={picture}
                onChange={(e) => setPicture(e.target.value)}
            />
            {canDelete && (
                <button className="candidateInfoModalButton deleteButton" onClick={() => handleDelete(candidateDetails)}>Delete</button>
            )}
            {errorMessage && <ErrorMessage message={errorMessage} />}
            <button className="candidateInfoModalButton saveButton" onClick={onSave}>Save</button>
            <button onClick={handleClose}>Cancel</button>
        </div>
    )
}
        
export default CreateCandidateInfo;