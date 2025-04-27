import React, { useState } from 'react';

const CreateCandidateInfo = ({ show, handleClose, handleSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const onSave = () => {
        handleSave({ name, description });
        setName('');
        setDescription('');
        handleClose();
    };

    if (!show) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2>Add Candidate Info</h2>
                    <button style={styles.closeButton} onClick={handleClose}>
                        &times;
                    </button>
                </div>
                <div style={styles.body}>
                    <form>
                        <div style={styles.formGroup}>
                            <label htmlFor="candidateName">Name</label>
                            <input
                                type="text"
                                id="candidateName"
                                placeholder="Enter candidate name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <div style={{ ...styles.formGroup, marginTop: '1rem' }}>
                            <label htmlFor="candidateDescription">Description</label>
                            <textarea
                                id="candidateDescription"
                                rows={3}
                                placeholder="Enter candidate description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={styles.textarea}
                            />
                        </div>
                    </form>
                </div>
                <div style={styles.footer}>
                    <button style={styles.cancelButton} onClick={handleClose}>
                        Cancel
                    </button>
                    <button style={styles.saveButton} onClick={onSave}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '400px',
        padding: '1rem',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #ddd',
        paddingBottom: '0.5rem',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
    },
    body: {
        marginTop: '1rem',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        padding: '0.5rem',
        fontSize: '1rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
    },
    textarea: {
        padding: '0.5rem',
        fontSize: '1rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        resize: 'none',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '1rem',
    },
    cancelButton: {
        backgroundColor: '#ccc',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        cursor: 'pointer',
        marginRight: '0.5rem',
    },
    saveButton: {
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

export default CreateCandidateInfo;