import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BallotVoteSection from '../components/BallotVoteSection'
import BallotInitiativeSection from '../components/BallotInitiativeSection';
import '../components/Ballot.css';


const Ballot = () => {
    const location = useLocation();
    const navigate = useNavigate();

    
    if (!location.state) {
        return (
            <div className='ballot'>
                <h1>Ballot Not Found</h1>
                <p>Please go back to the dashboard and select a ballot.</p>
            </div>
        );
    }

    const ballotID = location.state;


    const handleBackButton = () => {
        navigate(-1);
    }

    const ballotObject = {
        "ballotID": 2,
        "ballotName": "2001 Board Elections",
        "description": "No Description",
        "startDate": "2001-07-21T00:00:00.000Z",
        "endDate": "2001-09-12T00:00:00.000Z",
        "companyID": 1,
        "company": {
            "companyID": 1,
            "companyName": "American Medical Association",
            "abbreviation": "AMA",
            "category": "Medicine"
        },
        "positions": [
            {
                "positionID": 5,
                "positionName": "Secretary",
                "allowedVotes": 1,
                "writeIn": false,
                "ballotID": 2,
                "_count": {
                    "positionVotes": 64
                },
                "candidates": [
                    {
                        "candidateID": 10,
                        "positionID": 5,
                        "candidate": {
                            "candidateID": 10,
                            "fName": "Aaron",
                            "lName": "Gonzalez",
                            "titles": "MSL",
                            "description": "",
                            "picture": "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                            "_count": {
                                "positionVotes": 31
                            }
                        }
                    },
                    {
                        "candidateID": 11,
                        "positionID": 5,
                        "candidate": {
                            "candidateID": 11,
                            "fName": "Betty",
                            "lName": "Hanson",
                            "titles": "",
                            "description": "",
                            "picture": "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                            "_count": {
                                "positionVotes": 33
                            }
                        }
                    }
                ]
            },
            {
                "positionID": 4,
                "positionName": "Treasurer",
                "allowedVotes": 1,
                "writeIn": false,
                "ballotID": 2,
                "_count": {
                    "positionVotes": 64
                },
                "candidates": [
                    {
                        "candidateID": 7,
                        "positionID": 4,
                        "candidate": {
                            "candidateID": 7,
                            "fName": "Dylan",
                            "lName": "King",
                            "titles": "",
                            "description": "",
                            "picture": "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                            "_count": {
                                "positionVotes": 18
                            }
                        }
                    },
                    {
                        "candidateID": 8,
                        "positionID": 4,
                        "candidate": {
                            "candidateID": 8,
                            "fName": "Laura",
                            "lName": "Mitchell",
                            "titles": "PharmD",
                            "description": "",
                            "picture": "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                            "_count": {
                                "positionVotes": 24
                            }
                        }
                    },
                    {
                        "candidateID": 9,
                        "positionID": 4,
                        "candidate": {
                            "candidateID": 9,
                            "fName": "Zachary",
                            "lName": "Turner",
                            "titles": "",
                            "description": "",
                            "picture": "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                            "_count": {
                                "positionVotes": 22
                            }
                        }
                    }
                ]
            },
            {
                "positionID": 6,
                "positionName": "Vice President",
                "allowedVotes": 1,
                "writeIn": false,
                "ballotID": 2,
                "_count": {
                    "positionVotes": 64
                },
                "candidates": [
                    {
                        "candidateID": 12,
                        "positionID": 6,
                        "candidate": {
                            "candidateID": 12,
                            "fName": "Mary",
                            "lName": "Reed",
                            "titles": "",
                            "description": "With a background in psychology and a passion for mental health advocacy, this individual has dedicated their career to breaking down stigma and expanding access to quality mental healthcare services. Their work in community outreach and counseling has provided support and healing to countless individuals navigating life's challenges.",
                            "picture": "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                            "_count": {
                                "positionVotes": 36
                            }
                        }
                    },
                    {
                        "candidateID": 13,
                        "positionID": 6,
                        "candidate": {
                            "candidateID": 13,
                            "fName": "Roger",
                            "lName": "Jackson",
                            "titles": "MA",
                            "description": "",
                            "picture": "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                            "_count": {
                                "positionVotes": 28
                            }
                        }
                    }
                ]
            }
        ],
        "initiatives": []
    }

    var positionSectionArray = [];
    ballotObject.positions.map(position => {
        positionSectionArray.push(<BallotVoteSection
            key={ballotObject.ballotID+'_'+position.positionName} 
            positionTitle={position.positionName} 
            votingLimit={position.allowedVotes}
            candidates={position.candidates}>
            </BallotVoteSection>);
    });

    return (
        <div className='ballot'>
            <button className='backButton' onClick={handleBackButton}>&lt; Back</button>
            <h1>{ballotObject.ballotName}</h1>
            <h3>{ballotObject.company.companyName}</h3>
            <p>{ballotObject.description}</p>
            <div className='ballotBody'>
                {positionSectionArray}
                <BallotInitiativeSection 
                    initiativeTitle={'Initiative One'}
                    propositionDescription={"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}
                />
            </div>
            <button className='submitBallot'>Submit Ballot</button>
        </div>
    );
};

export default Ballot;