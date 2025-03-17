-- Create Company Table
CREATE TABLE IF NOT EXISTS Company (
    companyID SERIAL PRIMARY KEY,   
    companyName TEXT UNIQUE NOT NULL
);

-- Create an ENUM type for the status column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE ACCOUNT_TYPE AS ENUM ('Member', 'Officer', 'Employee', 'Administrator');
    END IF;
END $$;
-- INSERT INTO "User" (userid, accounttype, username, password, fname, mname, lname, companyid)  VALUES (DEFAULT, 'Administrator', 'admin', '$2b$10$PcmqGy/eEoonBgRSAvFS2euQ/mjaNxdWao02Xh3rQ1o3ROI.vWgke', 'Ad', 'Admin', 'Min', 1);  

-- Create User Table
CREATE TABLE IF NOT EXISTS "User" (
    userID SERIAL PRIMARY KEY,
    accountType ACCOUNT_TYPE NOT NULL,    
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fName TEXT NOT NULL,
    mName TEXT NOT NULL,
    lName TEXT NOT NULL,
    companyID INT NOT NULL,                
    CONSTRAINT fk_companyID_User FOREIGN KEY (companyID) REFERENCES Company(companyID) ON DELETE CASCADE
);

-- Create AssignedCompanies Table
CREATE TABLE IF NOT EXISTS AssignedCompanies (
    companyID INT NOT NULL,   
    userID INT NOT NULL,
    PRIMARY KEY (companyID, userID),
    CONSTRAINT fk_companyID_AssignedCompanies FOREIGN KEY (companyID) REFERENCES Company(companyID) ON DELETE CASCADE,
    CONSTRAINT fk_userID_AssignedCompanies FOREIGN KEY (userID) REFERENCES "User"(userID) ON DELETE CASCADE
);

-- Create Ballots Table
CREATE TABLE IF NOT EXISTS Ballots (
    ballotID SERIAL PRIMARY KEY,
    ballotName TEXT NOT NULL,
    description TEXT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    companyID INT NOT NULL,                
    CONSTRAINT fk_companyID_Ballots FOREIGN KEY (companyID) REFERENCES Company(companyID) ON DELETE CASCADE
);

-- Create BallotInitiatives Table
CREATE TABLE IF NOT EXISTS BallotInitiatives (
    initiativeID SERIAL PRIMARY KEY,
    initiativeName TEXT NOT NULL,
    description TEXT NOT NULL,
    ballotID INT NOT NULL,                
    CONSTRAINT fk_ballotID_BallotInitiatives FOREIGN KEY (ballotID) REFERENCES Ballots(ballotID) ON DELETE CASCADE
);

-- Create InitiativeResponses Table
CREATE TABLE IF NOT EXISTS InitiativeResponses (
    responseID SERIAL PRIMARY KEY,
    response TEXT NOT NULL,
    initiativeID INT NOT NULL,                
    CONSTRAINT fk_initiativeID_InitiativeResponses FOREIGN KEY (initiativeID) REFERENCES BallotInitiatives(initiativeID) ON DELETE CASCADE
);

-- Create BallotPositions Table
CREATE TABLE IF NOT EXISTS BallotPositions (
    positionID SERIAL PRIMARY KEY,
    positionName TEXT NOT NULL,
    voteNum INT NOT NULL,
    writeIn BOOLEAN NOT NULL,
    ballotID INT NOT NULL,
    CONSTRAINT fk_ballotID_BallotPositions FOREIGN KEY (ballotID) REFERENCES Ballots(ballotID) ON DELETE CASCADE
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
    picture TEXT
);

-- Create BallotCandidates Table
CREATE TABLE IF NOT EXISTS BallotCandidates (
    candidateID INT NOT NULL,   
    positionID INT NOT NULL,
    PRIMARY KEY (candidateID, positionID),
    CONSTRAINT fk_candidateID_BallotCandidates FOREIGN KEY (candidateID) REFERENCES Candidate(candidateID) ON DELETE CASCADE,
    CONSTRAINT fk_positionID_BallotCandidates FOREIGN KEY (positionID) REFERENCES BallotPositions(positionID) ON DELETE CASCADE
);

-- Create Votes Table
CREATE TABLE IF NOT EXISTS Votes (
    voteID SERIAL PRIMARY KEY,
    ballotID INT NOT NULL,
    userID INT NOT NULL,
    CONSTRAINT fk_ballotID_Votes FOREIGN KEY (ballotID) REFERENCES Ballots(ballotID) ON DELETE CASCADE,
    CONSTRAINT fk_userID_Votes FOREIGN KEY (userID) REFERENCES "User"(userID) ON DELETE CASCADE
);

-- Create InitiativeVotes Table
CREATE TABLE IF NOT EXISTS InitiativeVotes (
    voteID INT NOT NULL,
    initiativeID INT NOT NULL,
    responseID INT NOT NULL,
    PRIMARY KEY (voteID, initiativeID, responseID),
    CONSTRAINT fk_voteID_InitiativeVotes FOREIGN KEY (voteID) REFERENCES Votes(voteID) ON DELETE CASCADE,
    CONSTRAINT fk_initiativeID_InitiativeVotes FOREIGN KEY (initiativeID) REFERENCES BallotInitiatives(initiativeID),
    CONSTRAINT fk_responseID_InitiativeVotes FOREIGN KEY (responseID) REFERENCES InitiativeResponses(responseID) ON DELETE CASCADE
);

-- Create WriteInNames Table
CREATE TABLE IF NOT EXISTS WriteInNames (
    nameID SERIAL PRIMARY KEY,
    fName TEXT NOT NULL,
    mName TEXT NOT NULL,
    lName TEXT NOT NULL
);

-- Create PositionVotes Table
CREATE TABLE IF NOT EXISTS PositionVotes (
    voteID INT NOT NULL,   
    positionID INT NOT NULL,
    voteNum INT NOT NULL,
    candidateID INT NOT NULL,
    nameID INT,  -- Can be NULL for non-write-in votes
    PRIMARY KEY (voteID, positionID, voteNum),
    CONSTRAINT fk_voteID_PositionVotes FOREIGN KEY (voteID) REFERENCES Votes(voteID) ON DELETE CASCADE,
    CONSTRAINT fk_positionID_PositionVotes FOREIGN KEY (positionID) REFERENCES BallotPositions(positionID),
    CONSTRAINT fk_candidateID_PositionVotes FOREIGN KEY (candidateID) REFERENCES Candidate(candidateID),
    CONSTRAINT fk_nameID_PositionVotes FOREIGN KEY (nameID) REFERENCES WriteInNames(nameID)
);
