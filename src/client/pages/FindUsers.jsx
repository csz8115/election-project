import {React, useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useHeartbeat } from "../hooks/useHeartbeat";
import ErrorMessage from '../components/Utils/ErrorMessage'; // Import the Error component
import UserButton from '../components/UserComponents/UserButton';
import '../components/UserComponents/User.css'

const FindUsers = () => {

    const [userList, setUserList] = useState(null);

    const user = useSelector((state) => {
            return {
                userID: state.userID,
                username: state.username,
                accountType: state.accountType,
                fName: state.fName,
                lName: state.lName,
                companyID: state.companyID,
                companyName: state.companyName,
            };
    });
    useHeartbeat(user.username);
    const navigate = useNavigate();

    const handleUserClick = (username) => {
        console.log("Username: ", username);
        navigate('/EditUser', {state: {username: username}});
    }

    const [searchItem, setSearchItem] = useState('')

    const handleInputChange = (e) => { 
        const searchTerm = e.target.value;
        setSearchItem(searchTerm);

        var filteredItems = userList;

        if(searchTerm !== ""){
            const lowerSearch = searchTerm.toLowerCase();
            filteredItems = userList.filter((user) => {
                const fullName = `${user.fName} ${user.lName}`.toLowerCase();
                return (
                    fullName.includes(lowerSearch)
                );
            });
        }
        
        
        setFilteredUsers(filteredItems);
      }

    //TODO: fetch list of users and use usestate set

    //temp below:

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/v1/admin/getAllUsers`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                console.log(result);
                setUserList(result);
            }
            catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }
    , []);

    const [filteredUsers, setFilteredUsers] = useState(userList);

    useEffect(() => {
        if (userList) {
            setFilteredUsers(userList);
        }
    }, [userList]);

    //list of user objects to put in return
    const listComponents = [];
    if(filteredUsers != null){
        filteredUsers.map(user => {
            listComponents.push(
                <UserButton 
                    key={user.username}
                    username={user.username}
                    firstName={user.fName}
                    lastName={user.lName}
                    accountType={user.accountType}
                    handleClick={() => handleUserClick(user.username)}
                />
            );
        });
    }

    //checks if users are returned, else returns not found message
    if(true){
        return(
            <div>
                <h1>Find User</h1>
                <div>      
                    <input
                        type="text"
                        value={searchItem}
                        onChange={handleInputChange}
                        placeholder='Type to search'
                    />
                </div>
                <div className="userList">
                    {listComponents && listComponents.length > 0 ? (
                            listComponents
                        ) : (
                            <h3>No Users Found</h3>
                        )}
                </div>
            </div>
        );
    }else{
        return (
            <div>
                    <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
                    <h2>Stats not available</h2>
                </div>
        );
    }

}

export default FindUsers;