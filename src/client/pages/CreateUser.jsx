import { React, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorMessage from '../components/Utils/ErrorMessage';
import '../components/UserComponents/User.css';


const baseUrl = import.meta.env.VITE_API_BASE;

const CreateUser = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [accountType, setAccountType] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyID, setCompanyID] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleBackButton = () => {
        navigate(-1);
    };

    const handleSubmit = async () => {
        const newUser = {
            username,
            password,
            accountType,
            fName: firstName,
            lName: lastName,
            companyID: parseInt(companyID) || nil
        };

        console.log("Payload being sent:", newUser);

        // Validation
        if (!newUser.username) {
            setErrorMessage('Username is required.');
            return;
        }
        if (!newUser.password) {
            setErrorMessage('Password is required.');
            return;
        }
        if (!newUser.accountType) {
            setErrorMessage('Account type is required.');
            return;
        }
        if (!newUser.fName) {
            setErrorMessage('First name is required.');
            return;
        }
        if (!newUser.lName) {
            setErrorMessage('Last name is required.');
            return;
        }
        if (!newUser.companyID) {
            setErrorMessage('Company ID is required.');
            return;
        }

        setErrorMessage('');

        try {
            const response = await fetch(`${baseUrl}api/v1/admin/createUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for authentication
                body: JSON.stringify(newUser),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('User created successfully:', data);
                alert('User created successfully!');
                navigate(-1); // Navigate back after successful creation
            } else {
                const errorData = await response.json();
                console.error('Failed to create user:', errorData);
                setErrorMessage(errorData.error || 'Failed to create user.');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            setErrorMessage('An error occurred while creating the user.');
        }
    };

    return (
        <div className="user">
            <button className="backButton" onClick={handleBackButton}>
                &lt; Back
            </button>

            <div className="userCreationHeader">
                <h1>Create New User</h1>
            </div>

            <div className="userForm">
                <input
                    className="userInput"
                    type="text"
                    placeholder="Username *"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className="userInput"
                    type="password"
                    placeholder="Password *"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <select
                    className="userInput"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                >
                    <option value="">Select Account Type *</option>
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                    <option value="Officer">Officer</option>
                    <option value="Employee">Employee</option>
                </select>
                <input
                    className="userInput"
                    type="text"
                    placeholder="First Name *"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                    className="userInput"
                    type="text"
                    placeholder="Last Name *"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />
                <input
                    className="userInput"
                    type="text"
                    placeholder="Company ID (optional)"
                    value={companyID}
                    onChange={(e) => setCompanyID(e.target.value)}
                />
            </div>

            {errorMessage && <ErrorMessage message={errorMessage} />}

            <button className="submitUser" onClick={handleSubmit}>
                Create User
            </button>
        </div>
    );
};

export default CreateUser;