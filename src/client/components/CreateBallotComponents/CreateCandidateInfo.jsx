import {React, useState, useEffect } from 'react';

const CreateCandidateInfo = ({ candidateDetails, show, handleClose, handleSave, handleDelete }) => {

    const [fName, setfName] = useState('');
    const [lName, setlName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [canDelete, setCanDelete] = useState(false);
    
    console.log("Candidate Details: ", candidateDetails);
    

    useEffect(() => {
        if (candidateDetails) {
            const { fName, lName, description, imageUrl } = candidateDetails;
            setfName(fName);
            setlName(lName);
            setDescription(description);
            setImageUrl(imageUrl);
            setCanDelete(true);
        }
    }, [candidateDetails]);


    const onSave = () => {
        handleSave({ fName, lName, description, imageUrl });
        setfName('');
        setlName('');
        setDescription('');
        handleClose();
    };

    if (!show) return null;

    return (
        <div className="candidateInfoModal">
            <h1>Create Candidate Info</h1>
            <input
                type="text"
                placeholder="First Name"
                value={fName}
                onChange={(e) => setfName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Last Name"
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
                onChange={(e) => setImageUrl(e.target.value)}
            />
            {canDelete && (
                <button className="candidateInfoModalButton deleteButton" onClick={() => handleDelete(candidateDetails)}>Delete</button>
            )}
            <button className="candidateInfoModalButton saveButton" onClick={onSave}>Save</button>
            <button onClick={handleClose}>Cancel</button>
        </div>
    )
}
        
export default CreateCandidateInfo;