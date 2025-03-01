-- if database doesnt exist create it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'my_database') THEN
        EXECUTE CREATE DATABASE American_Dream_DB;
    END IF;
END $$;


-- Create Company Table
CREATE TABLE IF NOT EXISTS Company (
    companyID SERIAL PRIMARY KEY,   
    companyName TEXT UNIQUE NOT NULL,
);

-- Create an ENUM type for the status column
CREATE TYPE ACCOUNT_TYPE AS ENUM ('Member', 'Officer', 'Employee', 'Administrator');

-- Create User Table
CREATE TABLE IF NOT EXISTS User (
    userID SERIAL PRIMARY KEY,
    accountType ACCOUNT_TYPE NOT NULL,    
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fName TEXT NOT NULL,
    mName TEXT NOT NULL,
    lName TEXT NOT NULL,
    companyID INT NOT NULL,                
    CONSTRAINT fk_companyID_User_Company FOREIGN KEY (companyID) REFERENCES Company(companyID) ON DELETE CASCADE
);

-- Create AssignedCompanies Table
CREATE TABLE IF NOT EXISTS AssignedCompanies (
    companyID INT NOT NULL,   
    userID INT NOT NULL,
    PRIMARY KEY (companyID, userID)
    FOREIGN KEY (companyID) REFERENCES Company(companyID) ON DELETE CASCADE
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE
);

-- Create Ballots Table
CREATE TABLE IF NOT EXISTS Ballots (
    ballotID SERIAL PRIMARY KEY,
    ballotName TEXT NOT NULL,
    description TEXT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    companyID INT NOT NULL,                
    FOREIGN KEY (companyID) REFERENCES Company(companyID) ON DELETE CASCADE
);

-- Create BallotInitiatives Table
CREATE TABLE IF NOT EXISTS BallotInitiatives (
    initiativeID SERIAL PRIMARY KEY,
    initiativeName TEXT NOT NULL,
    description TEXT NOT NULL,
    ballotID INT NOT NULL,                
    FOREIGN KEY (ballotID) REFERENCES Ballots(ballotID) ON DELETE CASCADE
);

-- Create InitiativeResponses Table
CREATE TABLE IF NOT EXISTS InitiativeResponses (
    responseID SERIAL PRIMARY KEY,
    response TEXT NOT NULL,
    initiativeID INT NOT NULL,                
    FOREIGN KEY (initiativeID) REFERENCES BallotInitiatives(initiativeID) ON DELETE CASCADE
);

-- Create BallotPositions Table
CREATE TABLE IF NOT EXISTS BallotPositions (
    positionID SERIAL PRIMARY KEY,
    positionName TEXT NOT NULL,
    voteNum INT NOT NULL,
    writeIn BOOLEAN NOT NULL,
    ballotID INT NOT NULL,
    FOREIGN KEY (ballotID) REFERENCES Ballots(ballotID) ON DELETE CASCADE
);

-- Create Candidate Table
CREATE TABLE IF NOT EXISTS Candidate (
    candidateID SERIAL PRIMARY KEY,
    fName TEXT NOT NULL,
    mName TEXT NOT NULL,
    lName TEXT NOT NULL,
    titles TEXT,
    positions TEXT,
    description TEXT,
    picture TEXT,
);

-- add database trigger to merge candidates if they are the same when one is created
-- add database trigger to remove all candidates that are not in ballotcandidates when a row is removed from ballot candidates
-- Create BallotCandidates Table
CREATE TABLE IF NOT EXISTS BallotCandidates (
    candidateID INT NOT NULL,   
    positionID INT NOT NULL,
    PRIMARY KEY (candidateID, positionID)
    FOREIGN KEY (candidateID) REFERENCES Candidate(candidateID) ON DELETE CASCADE
    FOREIGN KEY (positionID) REFERENCES BallotPositions(positionID) ON DELETE CASCADE
);

-- Create Votes Table
CREATE TABLE IF NOT EXISTS Votes (
    voteID SERIAL PRIMARY KEY,
    ballotID INT NOT NULL,
    userID INT NOT NULL,
    FOREIGN KEY (ballotID) REFERENCES Ballots(ballotID) ON DELETE CASCADE
    FOREIGN KEY (ballotID) REFERENCES User(ballotID) ON DELETE CASCADE
);

-- Create InitiativeVotes Table
CREATE TABLE IF NOT EXISTS InitiativeVotes (
    voteID INT NOT NULL,
    initiativeID INT NOT NULL,
    responseID INT NOT NULL,
    PRIMARY KEY (voteID, initiativeID, responseID)
    FOREIGN KEY (voteID) REFERENCES Votes(voteID) ON DELETE CASCADE
    FOREIGN KEY (initiativeID) REFERENCES BallotInitiatives(initiativeID) 
    FOREIGN KEY (responseID) REFERENCES InitiativeResponses(responseID) ON DELETE CASCADE
);

-- Create PositionVotes Table
CREATE TABLE IF NOT EXISTS PositionVotes (
    voteID INT NOT NULL,   
    positionID INT NOT NULL,
    voteNum INT NOT NULL,
    nameID INT NOT NULL,
    candidateID INT NOT NULL,
    PRIMARY KEY (voteID, positionID, voteNum)
    FOREIGN KEY (voteID) REFERENCES Votes(voteID) ON DELETE CASCADE
    FOREIGN KEY (positionID) REFERENCES BallotPositions(positionID)
    FOREIGN KEY (candidateID) REFERENCES Candidate(candidateID)
    FOREIGN KEY (nameID) REFERENCES WriteInNames(nameID)
);

-- Create WriteInNames Table
CREATE TABLE IF NOT EXISTS WriteInNames (
    nameID SERIAL PRIMARY KEY,
    fName TEXT NOT NULL,
    mName TEXT NOT NULL,
    lName TEXT NOT NULL,
);
