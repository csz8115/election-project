//DATABASE SETUP
const {response} = require('express');
const DAError = require('./DAError');

const { Pool } = require('pg');

const pool = new Pool({
    user: '',
    host: 'local',
    database: '',
    password: 'password',
    port: 5432,
});

pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL');
    client.release();
  })
  .catch(err => console.error('Connection error', err.stack));

module.exports = pool;

//THINGS TO DO
// - add functionality for employees the users in most of these functions are only for society memebers as employee users have other stuff
// - add/finish error handling and logging 
// all transaction wrapped and prepared statements
// no looping queries
// incluide audit trails


//MAKE SURE TO CONSIDER THE NUMBER OF VOTES WHEN WORKING WITH BALLOT AND VOTE FUNCTIONS (SO far all good just remeber for vote tally and createvote 
//ADD PERCENTAGES TO TALLYBALLOTVOTERS function

//PROBABLY WILL NEED TO ADD TABLE FOR ROLES & AUTHORIZATIONS AS WELL AS FOR TABLE SESSION AND USERS
//PROBABLT WILL NEED TO ADD FUNCTIONS FOR SOCIETY REPORT AND SYSTEMS REPORT 
//MIGHT NEED TO GET AVERAGE QUERY RESPONSE TIME FORM METE TABLES IN DATABASE FOR A REPORT FUNCTION


//DATA FUNCTIONS
/**
 * Queries database for user information, 
 * converts it to a object; 
 * If successful returns user.
 * 
 * Throws error if there is no user with that ID | Username. 
 * Throws error message on a database error.
 *
 * @param {number|string} uservar           The ID or Username of the User.
 *
 * @return {user} user
 */ 
function getUser(userVar) { 
    //this still needs error handling and error checking
    if(Number.isInteger(userVar)) {
        try {
            return getUserWithID(userVar);
        } catch (error) {
            throw error;
        }
    } else if(typeof userVar === 'string') {
        try {
            return getUserWithUsername(userVar);
        } catch (error) {
            throw error;
        }
    } else {
        throw new DAError('parameter is not a string or number'); 
    }
}


/**
 * Called by getUser(), 
 * Queries database for user information, 
 * converts it to a object; 
 * If successful returns user.
 * 
 * Throws error if there is no user with that ID. 
 * Throws error message on a database error.
 *
 * @param {number} userID           The ID of the User.
 *
 * @return {user} user
 */ 
async function getUserWithID(userID) {
    // Create SELECT statement for database 
    var statement = "SELECT username, password, fName, mName, lName, accountType, companyID "
    + "FROM User WHERE userID = $1;";
    var values = [userID];
    // Query database
    try {
        var result = await pool.query(statement, values);
        userResult = result.rows[0];
        // Create JSON user
        if(result.rows[0].length === 0){
            //throw & log error
            throw new DAError('no user with that ID');
        } else {
            var user = {
                userID: userID,
                username: userResult[0],
                password: userResult[1],
                fName: userResult[2],
                mName: userResult[3],
                lName: userResult[4],
                accountType: userResult[5],
                companyID: userResult[6]
            }
            // Return user
            return user;
        }
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }    
}

/**
 * Called by getUser(), Queries database for user information, converts it to file format; If successful returns user, else
 * returns null; 
 * 
 * Throws error if there is no user with that Username. 
 * Throws error message on a database error.
 *
 * @param {String} username           The username of the User.
 *
 * @return {user} user
 */ 
async function getUserWithUsername(username) {
    // Create SELECT statement for database 
    var statement = "SELECT userID, password, fName, mName, lName, accountType, companyID "
    "FROM User WHERE username = $1;";
    var values = [username];
    // Query database
    try {
        var result = await pool.query(statement, values);
        userResult = result.rows[0];
        // Create JSON user
        if(result.rows[0].length === 0){
            //throw & log error
            throw new DAError('no user with that username');
        } else {
            var user = {
                userID: userResult[0],
                username: username,
                password: userResult[1],
                fName: userResult[2],
                mName: userResult[3],
                lName: userResult[4],
                accountType: userResult[5],
                companyID: userResult[6]
            }
            // Return user
            return user;
        }
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/** 
 * Queries database for information on users belonging to a certain company, 
 * converts it to a object; 
 * if successful returns users. 
 *
 * Throws error if there is no company with that ID.
 * Throws error message on a database error.
 *
 * @param {number} companyID           The ID of the company/society.
 *
 * @return {users} users
 */ 
async function getUsers(companyID) {
    // Create Select Statement
    var statement = "SELECT userID, username, fName, mName, lName "
    + "FROM User WHERE companyID = $1;";
    var values = [companyID];
    // Query database
    try {
        var result = await pool.query(statement, values);
        if(result.rows.length === 0){
            //throw & log error 
            throw new DAError('no users with that CompanyID or no company with that ID');
        } else {
            //Create JSON users
            var users = { 
                companyID: companyID,
                users: []
            };
            for (let i = 0; i < result.rows.length; i++) {
                users.users.push({
                    userID: result.rows[i][0],
                    username: result.rows[i][1],
                    fName: result.rows[i][2],
                    mName: result.rows[i][3],
                    lName: result.rows[i][4]
                });    
            } 
            //Return Users
            return users;
        }
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

//This stil needs errors
//THIS STILL NEEDS CHECK USERNAME HELPERFUNCTION OR DO IT IN FUNCTION WITH TRANSACTION
/**
 * inserts user information onto the database; 
 * if successful returns true.
 * 
 * Throws error if the file is missing necessary information.
 * Throws error message on a database error.
 *
 * @param {user} user           The JSON file describing the user.
 *
 * @return {boolean} completed
 */ 
async function createUser(user) {
    //Check Username Isn't Already Taken
    if (checkUsername(user.username)) {
        //create insert statement
        var statement = "INSERT INTO users (accountType, username, password, fName, mName, lName, companyID) "
        +"VALUES ($1, $2, $3, $4, $5, $6, $7);";
        var values = [user.accountType, user.username, user.password, user.fName, user.mName, user.lName, user.companyID];
        //Insert user into database
        try {
            var result = await pool.query(statement, values);
            //return result
            if(result.rowCount == 1){
                return true;
            } else {
                //throw & log error
            }
        } catch (error) {
            //throw database error & Log
        }
    } else {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

//This stil needs errors
/**
 * updates information onto the database; 
 * if successful returns true.
 *
 * Throws error if the file is missing necessary information.
 * Throws error message on a database error.
 *
 * @param {user} user           The JSON file describing the user.
 *
 * @return {boolean} completed
 */ 
async function updateUser(user) {
    //Create update Statement
    var statement = "UPDATE users "
    + "SET password = $1, accountType = $2, fName = $3, mName = $4, lName = $5 "
    + "WHERE userID = $6;";
    var values = [user.password, user.accountType, user.fName, user.mName, user.lName, user.userID];
    //update databse
    try {
        var result = await pool.query(statement, values); 
        //return result
        if(result.rowCount >= 1){
            return true;
        } else {
            //throw & log error
        }
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

//This stil needs errors
/**
 * tells the database to delete that user; 
 * if successful returns true.
 * 
 * Throws error if there is no user with that ID. 
 * Throws error message on a database error.
 *
 * @param {number} userID           The ID of the User.
 *
 * @return {boolean} completed
 */ 
async function removeUser(userID) {
    //Create delete statement
    var statement = "DELETE FROM users "
    + "WHERE userID = $1;";
    var values = [userID];
    //delete from database
    try {
        var result = await pool.query(statement, values); 
        //return result
        if(result.rowCount >= 1){
            return true;
        } else {
            //throw & log error
        }
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/**
 * Queries database for company information, 
 * converts it to object; 
 * If successful returns company. 
 * 
 * Throws error if there is no company with that ID. 
 * Throws error message on a database error.
 *
 * @param {number} companyID           The ID company of the User.
 *
 * @return {company} company
 */ 
async function getCompany(companyID) {
    // Create SELECT statement for database 
    var statement = "SELECT companyName "
    + "FROM Company "
    + "WHERE companyID = $1;";
    var values = [companyID];
    // Query database
    try {
        var result = await pool.query(statement, values); 
        if (result.rows[0].length === 0){
            //Throw & log error
            throw new DAError('no company with that ID');
        } else {
            // Create JSON user
            var company = {
                companyID: companyID,
                companyName: result.rows[0][0]
            }
            // Return user
            return company;
        }
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/**
 * Queries database for all companies and their information, 
 * converts it to a object; 
 * If successful returns companies.
 * 
 * Throws error message on a database error.
 *
 * @return {companies} companies
 */ 
async function getCompanies() {
    // Create SELECT statement for database 
    var statement = "SELECT companyID, companyName "
    + "FROM Company;";
    // Query database
    try {
        var result = await pool.query(statement);
        // Create JSON object
        var companies = {
            companies: []
        }
        for (let i = 0; i < result.rows.length; i++) {
            companies.companies.push({
                companyID: result.rows[i][0],
                companyName: result.rows[i][1]
            });
        }
        // Return user
        return companies;
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/**
 * Queries database for all companies and their information that an employee is assigned to, 
 * converts it to object; 
 * If successful returns companies. 
 * 
 * Throws error message on a database error.
 * Throws error message when no companies are assigned to user.
 * Throws error if no user with that ID.
 * 
 * @param {number} userID       The ID os the User.
 *
 * @return {companies} companies
 */ 
async function getEmployeeCompanies(userID) {
    // Create SELECT statement for database 
    var statement = "SELECT c.companyID, c.companyName "
    + "FROM company c "
    + "JOIN AssignedCompanies ac ON ac.companyID = c.companyID "
    + "JOIN User u ON u.userID = ac.userID "
    + "WHERE u.userID = $1;";
    var values = [userID];
    // Query database
    try {
        var result = await pool.query(statement, values); 
        if (result.rows.length === 0) {
            //throw & log DAError
            throw new DAError('no user with that ID or no Companies assigned to that user');
        }
        // Create JSON object
        var companies = {
            companies: []
        }
        for (let i = 0; i < result.rows.length; i++) {
            companies.companies.push({
                companyID: result.rows[i][0],
                companyName: result.rows[i][1]
            });
        }
        // Return user
        return companies;       
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/**
 * tells the database to delete that company; 
 * if successful returns true.
 * 
 * Throws error if there is no company with that ID. 
 * Throws error message on a database error.
 *
 * @param {number} companyID           The ID of the company.
 *
 * @return {boolean} completed
 */ 
async function removeCompany(companyID) {
    //Create delete statement
    var statement = "DELETE FROM Company "
        + "WHERE companyID = $1;";
        var values = [companyID];
    //delete from database
    try {
        var result = await pool.query(statement, values); 
        //return result
        if(result.rowCount >= 1){
            return true;
        } else {
            throw new DAError('no company with that ID');
        }
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/**
 * inserts information onto the database; 
 * if successful returns true.
 * 
 * Throws error if the file is missing necessary information.
 * Throws error message on a database error.
 *
 * @param {vote} vote           The JSON file describing the vote.
 *
 * @return {boolean} completed.
 */ 
async function createVote(vote) {
    try {
        //START TRANSACTION
        var client = await pool.connect();
        await client.query('BEGIN');
        
        //insert into vote table
        var statement = "INSERT INTO Votes (userID, ballotID) "
        + "VALUES ($1, $2) "
        + "RETURNING voteID;";
        var values = [vote.userID, vote.ballotID];
        var result = await client.query(statement, values);
        //check if it went through
        if (result.rowCount >= 1) {
            //get voteID
            vote.voteID = result.rows[0][0];

            //insert into initiative table
            for (let i = 0; i < vote.initiativesVotes.length; i++) {
                var initiativeVote = vote.initiativesVotes[i];
                statement = "INSERT INTO InitiativeVotes (voteID, initiativeID, responseID) "
                + "VALUES ($1, $2, $3);";
                values = [vote.voteID, initiativeVote.initiativeID, initiativeVote.responseID];
                result = await client.query(statement, values);
                //check if it went through
                if (!(result.rowCount >= 1)){
                    //throw & log DAError
                    throw new DAError('vote failed on initiativeVotes');
                }
            }

            //insert in position table
            for (let i = 0; i < vote.positionsVotes.length; i++) {
                var positionVote = vote.positionsVotes[i];
                //check if vote is writeIn or not
                if (positionVote.writeIn == null){
                    //insert with candidates
                    statement = "INSERT INTO PositionVotes (voteID, positionID, voteNum, candidateID) "
                    + "VALUES ( $1, $2, $3, $4);";
                    values = [vote.voteID, positionVote.positionID, positionVote.voteNumber, positionVote.candidateID];
                    result = await client.query(statement, values);
                    //check if it went through
                    if (!(result.rowCount >= 1)){
                        //throw & log DAError
                        throw new DAError('vote failed on positionVotes with candidate');
                    }
                } else {
                    //check if writein exists
                    statement = "SELECT nameID "
                    + "FROM WriteInNames "
                    + "WHERE fName = $1 AND mName = $2 AND lname = $3;";
                    values = [positionVote.writeIn.fName, positionVote.writeIn.mName, positionVote.writeIn.lName];
                    result = await client.query(statement, values);
                    if (result.rows[0].length === 0) {
                        //insert writein
                        statement = "INSERT INTO WriteInNames (fName, mName, lName) "
                        + "VALUES ($1, $2, $3) RETURNING nameID;";
                        values = [positionVote.writeIn.fName, positionVote.writeIn.fName, positionVote.writeIn.fName];
                        result = await client.query(statement);
                        //check if it went through
                        if (result.rowCount >= 1){
                            //insert position Vote
                            positionVote.writeIn.nameID = result.rows[0][0];
                            statement = "INSERT INTO PositionVotes (voteID, positionID, voteNum, nameID) "
                            + "VALUES ($1, $2, $3, $4);";
                            values = [vote.voteID, positionVote.positionID, positionVote.voteNumber, positionVote.nameID]
                            result = await client.query(statement);
                            //check if it went through
                            if (!(result.rowCount >= 1)){
                                //throw & log DAError
                                throw new DAError('vote failed on positionVotes with writeIn');
                            }
                        } else {
                            //throw & log DAError
                            throw new DAError('vote failed on positionVotes on writeIn');
                        }
                    } else {
                        //insert position Vote
                        vote.writeIn.nameID = result.rows[0][0];
                        statement = "INSERT INTO PositionVotes (voteID, positionID, voteNum, nameID) "
                        + "VALUES ($1, $2, $3, $4);";
                        values = [vote.voteID, positionVote.positionID, positionVote.voteNumber, positionVote.nameID]
                        result = await client.query(statement);
                        //check if it went through
                        if (!(result.rowCount >= 1)){
                            //throw & log DAError
                            throw new DAError('vote failed on positionVotes with writeIn');
                        }
                    }
                }             
            }
        } else {
            //throw & log DAError
            throw new DAError('vote failed on vote');
        }
        //END TRANSACTION
        await  client.query('COMMIT');
        client.release();
        //return boolean
        return true;
    } catch (error) {
        //END TRANSACTION
        await  client.query('ROLLBACK');
        //check error type
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }        
    } finally {
        client.release();
    }
}

/**
 * Queries database for complete ballot information based on basic ballot object, 
 * converts all queried info into a object; 
 * if successful returns ballot.
 * 
 * Throws error if there is no ballot with that ID. 
 * Throws error message on a database error.
 *
 * @param {basicBallot} ballot           The ID of the Ballot.
 *
 * @return {fullBallot} ballot.
 */ 
async function getBallot(ballot) { 
    //consider changeing these statements to procedures 
    //get ballotinfo
    var fullBallot = {
        ballotID: ballot.ballotID,
        ballotName: ballot.ballotName,
        description: ballot.description,
        startDate: ballot.startDate,
        endDate: ballot.endDate,
        companyID: ballot.companyID,
        ballotPositions: [],
        ballotInitiatives: []
    }
    try {
        //get ballot positions
        var statement = "SELECT positionID, positionName, voteNum, writeIn "
        + "FROM BallotPositions "
        + "WHERE ballotID = $1;";
        var values = [fullBallot.ballotID];
        var result = await pool.query(statement, values);
        if (!(result.rows.length === 0)){
            var positionResults = result.rows
            for (let i = 0; i < positionResults.length; i++) {
                var ballotPosition = {
                    positionID: positionResults[i][0],
                    positionName: positionResults[i][1],
                    voteNumber: positionResults[i][2],
                    writeIn: positionResults[i][3],
                    candidates: []        
                }
                //get ballot positions candidates
                statement = "SELECT c.candidateID, c.fName, c.mName, c.lName, c.titles, c.positions, c.description, c.picture "
                + "FROM Candidate c "
                + "JOIN BallotCandidates b ON c.candidateID = b.candidateID "
                + "WHERE b.positionID = $1;";
                values = [ballotPosition.positionID]; 
                result = await pool.query(statement, values);
                if (!(result.rows.length === 0)) {
                    var candidateResults = result.rows;
                    for (let n = 0; n < candidateResults.length; n++) {
                        var ballotPositionCandidate = {
                            candidateID: candidateResults[n][0],
                            fName: candidateResults[n][1],
                            mName: candidateResults[n][2],
                            lName: candidateResults[n][3],
                            titles: candidateResults[n][4],
                            positions: candidateResults[n][5],
                            description: candidateResults[n][6],
                            picture: candidateResults[n][7]        
                        }
                        //add candidate to positions
                        ballotPosition.candidates.push(ballotPositionCandidate);
                    }
                } else {
                    //throw & log error
                    throw new DAError('failed on position candidates');
                }
                //add position to ballot
                fullBallot.ballotPositions.push(ballotPosition);
            }
        } else {
            //throw & log error
            throw new DAError('failed on positions');
        }

        //get ballot initiatives
        statement = "SELECT initiativeID, initiativeName, description "
        + "FROM BallotInitiatives "
        + "WHERE ballotID = $1;";
        values = [fullBallot.ballotID];
        result = await pool.query(statement, values);
        if (!(result.rows.length === 0)){
            var initiativeResults = result.rows
            for (let i = 0; i < initiativeResults.length; i++) {
                var ballotInitiative = {
                    initiativeID: initiativeResults[i][0],
                    initiativeName: initiativeResults[i][1],
                    description: initiativeResults[i][2],
                    responses: []
                }
                //get ballot initiative responses
                statement = "SELECT responseID, response "
                + "FROM InitiativeResponses "
                + "WHERE initiativeID = $1;";
                values = [ballotInitiative.initiativeID]; 
                result = await pool.query(statement, values);
                if (!(result.rows.length === 0)) {
                    var responseResults = result.rows;
                    for (let n = 0; n < responseResults.length; n++) {
                        var ballotInitiativeResponse = {
                            responseID: responseResults[n][0],
                            response: responseResults[n][1]
                        }
                        //add response to inititative
                        ballotInitiative.responses.push(ballotInitiativeResponse);
                    }
                } else {
                    //throw & log error
                    throw new DAError('failed on initiative response');
                }
                //add initiative to ballot
                fullBallot.ballotInitiatives.push(ballotInitiative);
            }
        } else {
            //throw & log error
            throw new DAError('failed on initiatives');
        }
        //return ballot
        return fullBallot;
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/**
 * Queries database for basic ballot information on all ballot for a company based on companyID, 
 * converts it into a object; 
 * if successful returns companyBallots.
 * 
 * Throws error if there is no company with that ID. 
 * Throws error message on a database error.
 *
 * @param {number} CompanyID           The ID of the Company.
 *
 * @return {ballots} companyBallots.
 */ 
async function getCompanyBallots(companyID) {
    //create Select statement
    var statement = "SELECT ballotID, ballotName, description, startDate, endDate "
    + "FROM Ballots "
    + "WHERE companyID = $1;";
    var values = [companyID];
    //query database
    try {
        var result = await pool.query(statement, values);
        if(result.rows.length === 0){
            //throw & log error 
            throw new DAError('no ballots with that CompanyID or no company with that ID');
        }
        //create Ballots JSON object
        var ballots = {
            ballots: []
        }
        for (let i = 0; i < result.rows.length; i++) {
            ballots.ballots.push({
                ballotID: result.rows[i][0],
                ballotName: result[i][1],
                description: result[i][2],
                startDate: result[i][3],
                endDate: result[i][4],
                companyID: companyID
            });
        }
        //return result
        return ballots;
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/**
 * Queries database for basic ballot information on all active ballots for a company based on companyID, 
 * converts it into a object; 
 * if successful returns activeCompanyBallots.
 * 
 * Throws error if there is no company with that ID. 
 * Throws error message on a database error.
 *
 * @param {number} CompanyID           The ID of the Company.
 *
 * @return {ballots} activeCompanyBallots.
 */ 
async function getActiveBallots(companyID) {
    //get current date
    var date = new Date().toISOString().split('T')[0];
    //create Select statement
    var statement = "SELECT ballotID, ballotName, description, startDate, endDate "
    + "FROM Ballots "
    + "WHERE companyID = $1 AND (startDate < $2 AND endDate > $2);";
    var values = [companyID, date];
    //query database
    try {
        var result = await pool.query(statement, values);
        if(result.rows.length === 0){
            //throw & log error 
            throw new DAError('no company with that ID or no active ballots with that companyID');
        }
        //create Ballots JSON object
        var ballots = {
            ballots: []
        }
        for (let i = 0; i < result.rows.length; i++) {
            ballots.ballots.push({
                ballotID: result.rows[i][0],
                ballotName: result[i][1],
                description: result[i][2],
                startDate: result[i][3],
                endDate: result[i][4],
                companyID: companyID
            });
        }
        //return result
        return ballots;
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/**
 * Queries database for basic ballot information on all ballots (that have not started yet) for a company based on companyID,
 * converts it into a object; 
 * if successful returns inactiveCompanyBallots.
 * 
 * Throws error if there is no company with that ID. 
 * Throws error message on a database error.
 *
 * @param {number} CompanyID           The ID of the Company.
 *
 * @return {ballots} inactiveCompanyBallots.
 */ 
async function getInActiveBallots(companyID) {
    //get current date
    var date = new Date().toISOString().split('T')[0];
    //create Select statement
    var statement = "SELECT ballotID, ballotName, description, startDate, endDate "
    + "FROM Ballots "
    + "WHERE companyID = $1 AND startDate > $2;";
    var values = [companyID, date];
    //query database
    try {
        var result = await pool.query(statement, values);
        if(result.rows.length === 0){
            //throw & log error 
            throw new DAError('no company with that ID or no inactive ballots with that companyID');
        }
        //create Ballots JSON object
        var ballots = {
            ballots: []
        }
        for (let i = 0; i < result.rows.length; i++) {
            ballots.ballots.push({
                ballotID: result.rows[i][0],
                ballotName: result[i][1],
                description: result[i][2],
                startDate: result[i][3],
                endDate: result[i][4],
                companyID: companyID
            });
        }
        //return result
        return ballots;
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/**
 * Queries database for basic ballot information on all ballots (that have ended) for a company based on companyID, 
 * converts it into a object; 
 * if successful returns finishedCompanyBallots.
 * 
 * Throws error if there is no company with that ID. 
 * Throws error message on a database error.
 *
 * @param {number} CompanyID           The ID of the Company.
 *
 * @return {ballots} finishedCompanyBallots.
 */ 
async function getFinishedBallots(companyID) {
    //get current date
    var date = new Date().toISOString().split('T')[0];
    //create Select statement
    var statement = "SELECT ballotID, ballotName, description, startDate, endDate "
    + "FROM Ballots "
    + "WHERE companyID = $1 AND endDate < $2;";
    var values = [companyID, date];
    //query database
    try {
        var result = await pool.query(statement, values);
        if(result.rows.length === 0){
            //throw & log error 
            throw new DAError('no company with that ID or no finished ballots with that companyID');
        }
        //create Ballots JSON object
        var ballots = {
            ballots: []
        }
        for (let i = 0; i < result.rows.length; i++) {
            ballots.ballots.push({
                ballotID: result.rows[i][0],
                ballotName: result[i][1],
                description: result[i][2],
                startDate: result[i][3],
                endDate: result[i][4],
                companyID: companyID
            });
        }
        //return result
        return ballots;
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

//I DONT KNOW IF I ACTUALLY NEED THIS
/**
 * Queries database for basic ballot information on all ballot for all companies assigned to an employee based on userID, 
 * converts it into a object; if successful returns employeeBallots.
 * 
 * Throws error if there is no user with that ID or if that employee doesnot have any company. 
 * Throws error message on a database error.
 *
 * @param {number} CompanyID           The ID of the Company.
 *
 * @return {employeeBallots} employeeBallots.
 */ 
async function getEmployeeBallots(userID) { 
    //create Select statement
    var statement = "SELECT b.ballotID, b.ballotName, b.description, b.startDate, b.endDate, b.companyID "
    + "FROM Ballots b "
    + "JOIN Company c ON c.companyID = b.companyID "
    + "JOIN AssignedCompanies ac ON ac.companyID = c.companyID "
    + "JOIN User u ON u.userID = ac.userID "
    + "WHERE u.userID = $1;";
    var values = [userID];
    //query database
    try {
        var result = await pool.query(statement, values);
        if(result.rows.length === 0){
            //throw & log error 
            throw new DAError('no ballots with that CompanyID or no company with that ID or no user with that ID');
        }
        //create Ballots JSON object
        var ballots = {
            ballots: []
        }
        for (let i = 0; i < result.rows.length; i++) {
            ballots.ballots.push({
                ballotID: result.rows[i][0],
                ballotName: result[i][1],
                description: result[i][2],
                startDate: result[i][3],
                endDate: result[i][4],
                companyID: result[i][5]
            });
        }
        //return result
        return ballots;
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}

/** 
 * inserts ballot information into the database; 
 * if successful returns true.
 * 
 * Throws error if the file is missing necessary information.
 * Throws error message on a database error.
 *
 * @param {fullBallot} ballot           The JSON file describing the Ballot.
 *
 * @return {boolean} completed.
 */ 
async function createBallot(ballot) {
    try {
        //START TRANSACTION
        var client = await pool.connect();
        await client.query('BEGIN');

        //insert into ballot table
        var statement = "INSERT INTO Ballots (ballotName, description, startDate, endDate, companyID) "
        + "VALUES ($1, $2, $3, $4, $5) "
        + "RETURNING ballotID;";
        var values = [ballot.ballotName, ballot.description, ballot.startDate, ballot.endDate, ballot.companyID];
        var result = await client.query(statement, values);
        //check if it went through
        if (result.rowCount >= 1) {
            var ballotID = result.rows[0].ballotID;
            
            //insert into positions
            for (let i = 0; i < ballot.ballotPositions.length; i++) {
                statement = "INSERT INTO BallotPositions (positionName, voteNum, writeIn, ballotID) "
                + "VALUES ($1, $2, $3, $4) "
                + "RETURNING positionID;";
                values = [ballot.ballotPositions[i].positionName, ballot.ballotPositions[i].voteNum, ballot.ballotPositions[i].writeIn, ballotID];
                result = await client.query(statement, values);
                //check if it went through
                if (result.rowCount >= 1) {
                    var positionID = result.rows[0].positionID;
                    //insert into position candidates
                    for (let n = 0; n < ballot.ballotPositions.candidates.length; n++) {
                        statement = "INSERT INTO Candidate (fName, mName, lName, titles, positions, description, picture) "
                        + "VALUES ($1, $2, $3, $4, $5, $6, $7) "
                        + "RETURNING candidateID;";
                        values = [ballot.ballotPositions[i].candidates[n].fName, 
                        ballot.ballotPositions[i].candidates[n].mName,
                        ballot.ballotPositions[i].candidates[n].lName,
                        ballot.ballotPositions[i].candidates[n].titles,
                        ballot.ballotPositions[i].candidates[n].positions,
                        ballot.ballotPositions[i].candidates[n].description,
                        ballot.ballotPositions[i].candidates[n].picture];
                        result = await client.query(statement, values);
                        var candidateID = result.rows[0].candidateID;
                        //check if it went through
                        if (result.rowCount >= 1) {
                            var candidateID = result.rows[0].candidateID;
                            //insert into ballot candidates
                            statement = "INSERT INTO BallotCandidates (candidateID, positionID) "
                            + "VALUES ($1, $2) ";
                            values = [candidateID, positionID];
                            result = await pool.query(statement, values);
                            //check if it went through
                            if (!(result.rowCount >= 1)) {
                                //throw & log DAError
                                throw new DAError('ballot failed on BallotCandidates');
                            }
                        } else {
                            //throw & log DAError
                            throw new DAError('ballot failed on Candidate');
                        }                       
                    }
                } else {
                    //throw & log DAError
                    throw new DAError('ballot failed on BallotPositions');
                }
            }

            //insert into initiatives
            for (let i = 0; i < ballot.ballotInitiatives.length; i++) {
                statement = "INSERT INTO BallotInitiatives (initiativeName, voteNum, writeIn, ballotID) "
                + "VALUES ($1, $2, $3, $4) "
                + "RETURNING initiativeID;";
                values = [ballot.ballotInitiatives[i].initiativeName, ballot.ballotInitiatives[i].voteNum, ballot.ballotInitiatives[i].writeIn, ballotID]
                result = await client.query(statement, values);
                //check if it went through
                if (result.rowCount >= 1) {
                    var initiativeID = result.rows[0].initiativeID;
                    //insert into initiatives responses
                    for (let n = 0; n < ballot.ballotInitiatives.responses.length; n++) {
                        statement = "INSERT INTO InitiativeResponses (response, initiativeID) "
                        + "VALUES ($1, $2);";
                        values = [ballot.ballotInitiatives[i].responses[n].response, initiativeID]
                        result = await client.query(statement, values);
                        //check if it went through
                        if (!(result.rowCount >= 1)) {
                            //throw & log DAError
                            throw new DAError('ballot failed on InitiativeResponses');
                        }
                    }
                } else {
                    //throw & log DAError
                    throw new DAError('ballot failed on BallotInitiatives');
                }   
            }
        } else {
            //throw & log DAError
            throw new DAError('ballot failed on Ballots');
        }
        //END TRANSACTION
        await  client.query('COMMIT');
        client.release();
        //return boolean
        return true;
    } catch (error) {
        //END TRANSACTION
        await  client.query('ROLLBACK');
        //check error type
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    } finally {
        //RELEASE CLIENT
        client.release();
    }
}

/** 
 * updates ballot information into the database; 
 * if successful returns true.
 * 
 * Throws error if the file is missing necessary information.
 * Throws error message on a database error.
 *
 * @param {fullBallot} ballot           The object describing the Ballot.
 *
 * @return {boolean} completed.
 */ 
async function updateBallot(ballot) {
    try {
        //get Date
        var date = new Date().toISOString().split('T')[0];
        
        //START TRANSACTION
        var client = await pool.connect();
        await client.query('BEGIN');

        //CHECK TO MAKE SURE BALLOT IS NOT ACTIVE OR FINISHED BEFORE UPDATING
        var statement = "SELECT startDate FROM Ballots WHERE ballotID = $1 AND startDate = $2;"
        var values = [ballot.ballotID, date];
        var result = await client.query(statement, values);
        //check if it went through
        if (result.rows[0].length === 0) {
            //throw & log DAError
            throw new DAError('ballot failed on ballot lookup');
        }
        

        //insert into ballot table
        statement = "Update Ballots "
        + "SET ballotName = $1, description = $2, "
        + "startDate = $3, endDate = $4, companyID = $5 "
        + "WHERE ballotID = $6;";
        values = [ballot.ballotName, ballot.description, ballot.startDate, ballot.endDate, ballot.companyID, ballot.ballotID];
        result = await client.query(statement, values);
        //check if it went through
        if (!(result.rowCount >= 1)) {
            //throw & log DAError
            throw new DAError('ballot failed on Ballots');
        }

        //remove all ballot positions
        statement = "DELETE FROM BallotPositions "
        + "WHERE ballotID = $1;";
        values = [ballot.ballotID];
        //check if it went through
        if (!(result.rowCount >= 1)) {
            //throw & log DAError
            throw new DAError('ballot failed on position delete');
        }

        //remove all ballot initiatives
        statement = "DELETE FROM BallotInitiatives "
        + "WHERE ballotID = $1;";
        values = [ballot.ballotID];
        //check if it went through
        if (!(result.rowCount >= 1)) {
            //throw & log DAError
            throw new DAError('ballot failed on initiative delete');
        }

        var ballotID = ballot.ballotID;
        //insert into positions
        for (let i = 0; i < ballot.ballotPositions.length; i++) {
            statement = "INSERT INTO BallotPositions (positionName, voteNum, writeIn, ballotID) "
            + "VALUES ($1, $2, $3, $4) "
            + "RETURNING positionID;";
            values = [ballot.ballotPositions[i].positionName, ballot.ballotPositions[i].voteNum, ballot.ballotPositions[i].writeIn, ballotID];
            result = await client.query(statement, values);
            //check if it went through
            if (result.rowCount >= 1) {
                var positionID = result.rows[0].positionID;
                //insert into position candidates
                for (let n = 0; n < ballot.ballotPositions.candidates.length; n++) {
                    statement = "INSERT INTO Candidate (fName, mName, lName, titles, positions, description, picture) "
                    + "VALUES ($1, $2, $3, $4, $5, $6, $7) "
                    + "RETURNING candidateID;";
                    values = [ballot.ballotPositions[i].candidates[n].fName, 
                    ballot.ballotPositions[i].candidates[n].mName,
                    ballot.ballotPositions[i].candidates[n].lName,
                    ballot.ballotPositions[i].candidates[n].titles,
                    ballot.ballotPositions[i].candidates[n].positions,
                    ballot.ballotPositions[i].candidates[n].description,
                    ballot.ballotPositions[i].candidates[n].picture];
                    result = await client.query(statement, values);
                    var candidateID = result.rows[0].candidateID;
                    //check if it went through
                    if (result.rowCount >= 1) {
                        var candidateID = result.rows[0].candidateID;
                        //insert into ballot candidates
                        statement = "INSERT INTO BallotCandidates (candidateID, positionID) "
                        + "VALUES ($1, $2) ";
                        values = [candidateID, positionID];
                        result = await pool.query(statement, values);
                        //check if it went through
                        if (!(result.rowCount >= 1)) {
                            //throw & log DAError
                            throw new DAError('ballot failed on BallotCandidates');
                        }
                    } else {
                        //throw & log DAError
                        throw new DAError('ballot failed on Candidate');
                    }                       
                }
            } else {
                //throw & log DAError
                throw new DAError('ballot failed on BallotPositions');
            }
        }

        //insert into initiatives
        for (let i = 0; i < ballot.ballotInitiatives.length; i++) {
            statement = "INSERT INTO BallotInitiatives (initiativeName, voteNum, writeIn, ballotID) "
            + "VALUES ($1, $2, $3, $4) "
            + "RETURNING initiativeID;";
            values = [ballot.ballotInitiatives[i].initiativeName, ballot.ballotInitiatives[i].voteNum, ballot.ballotInitiatives[i].writeIn, ballotID]
            result = await client.query(statement, values);
            //check if it went through
            if (result.rowCount >= 1) {
                var initiativeID = result.rows[0].initiativeID;
                //insert into initiatives responses
                for (let n = 0; n < ballot.ballotInitiatives.responses.length; n++) {
                    statement = "INSERT INTO InitiativeResponses (response, initiativeID) "
                    + "VALUES ($1, $2);";
                    values = [ballot.ballotInitiatives[i].responses[n].response, initiativeID]
                    result = await client.query(statement, values);
                    //check if it went through
                    if (!(result.rowCount >= 1)) {
                        //throw & log DAError
                        throw new DAError('ballot failed on InitiativeResponses');
                    }
                }
            } else {
                //throw & log DAError
                throw new DAError('ballot failed on BallotInitiatives');
            }   
        }
        //END TRANSACTION
        await  client.query('COMMIT');
        client.release();
        //return boolean
        return true;
    } catch (error) {
        //END TRANSACTION
        await  client.query('ROLLBACK');
        //check error type
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    } finally {
        client.release();
    }
    
}

/**
 * Queries the database for the ballot & votes for that ballot based on the ballot, 
 * calculates the vote for each position & candidate; 
 * if successful returns ballotResults.
 * 
 * Throws error if there is no ballot or any sub-tables with that ID. 
 * Throws error message on a database error.
 *
 * @param {fullBallot} ballot           The full ballot.
 *
 * @return {tallyBallot} ballotResults.
 */ 
async function tallyBallot(ballot) {
    //create tallyBallot
    var tallyBallot = {
        ballotID: ballot.ballotID,
        ballotName: ballot.ballotName,
        description: ballot.description,
        companyID: ballot.companyID,
        positions: [],
        initiatives: []
    }
    var statement = '';
    try {
        //get ballot positions
        for (let i = 0; i < ballot.ballotPositions.length; i++) {
            var ballotPosition = ballot.ballotPositions[i];
            //create tallyPosition
            var tallyPosition = {
                positionID : ballotPosition.positionID,
                positionName: ballotPosition.positionName,
                positionResults: []
            }
            //get from database all candidates & writeIns voted for with their vote count 
            statement = "SELECT "
            + "COALESCE(c.candidateID, w.nameID) AS ID, "
            + "COALESCE(c.fName, w.fName) AS fName, "
            + "COALESCE(c.mName, w.mName) AS mName, "
            + "COALESCE(c.lName, w.lName) AS lName, "
            + "COUNT(DISTINCT pv.voteID || '-' || pv.voteNum) AS total_votes, "
            + "CASE "
            + "WHEN c.candidateID IS NOT NULL THEN 'Candidate' "
            + "WHEN w.nameID IS NOT NULL THEN 'Write-In' "
            + "END AS type "
            + "FROM positionVotes pv "
            + "LEFT JOIN Candidate c ON pv.candidateID = c.candidateID "
            + "LEFT JOIN WriteIn w ON pv.nameID = w.nameID "
            + "WHERE pv.positionID = $1 "
            + "GROUP BY COALESCE(c.candidateID, w.nameID), COALESCE(c.fName, w.fName), COALESCE(c.mName, w.mName), COALESCE(c.lName, w.lName), type;"
            var values = [tallyPosition.positionID];
            var result = await pool.query(statement, values);
            //check for response
            if (!(result.rows.length === 0)){
                //create candidates/writeins
                for(let n = 0; n < result.rows.length; n++){
                    var tallyPositionResults = {
                        type: result.rows[n][5],
                        ID: result.rows[n][0],
                        fName: result.rows[n][1],
                        mName: result.rows[n][2],
                        lName: result.rows[n][3],
                        voteCount: result.rows[n][4]
                    }
                    //push positionResults to tallyPosition
                    tallyPosition.responses.push(tallyPositionResults);
                }
            } else {
                //throw & log DAError
                throw new DAError('failed on positions');
            }
            //push tallyposition to tallyballot
            tallyBallot.positions.push(tallyPosition);
        }
        //get ballot initiatives
        for (let i = 0; i < ballot.ballotInitiatives.length; i++) {
            var ballotInitiative = ballot.ballotInitiatives[i];
            var tallyinitiative = {
                initiativeID : ballotInitiative.initiativeID,
                initiativeName : ballotInitiative.initiativeName,
                description : ballotInitiative.description,
                responses: []
            }
            //get from database all initiative responses voted for with their vote count
            statement = "SELECT ir.responseID, ir.response, COUNT(DISTINCT iv.voteID) AS voteCount "
            + "FROM InitiativeResponses ir "
            + "LEFT JOIN InitiativeVotes iv ON iv.responseID = ir.responesID AND iv.initiativeID = ir.initiativeID "
            + "WHERE ir.initiativeID = $1 "
            + "GROUP BY ir.responseID, ir.response;";
            values = [tallyPosition.positionID];
            result = await pool.query(statement, values);
            //check for response
            if (!(result.rows.length === 0)){
                for(let n = 0; n < result.rows.length; n++){
                    var tallyResponse = {
                        responseID: result.rows[n][0],
                        response: result.rows[n][1],
                        voteCount: result.rows[n][2]
                    }
                    //push responses to tallyInitiative
                    tallyinitiative.responses.push(tallyResponse);
                }
            } else {
                //throw & log DAError
                throw new DAError('failed on initiatives');
            }
            //push tallyInitiative to tallyBallot
            tallyBallot.initiatives.push(tallyinitiative);
        }    
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
    
}


/**
 * Queries the database for all the votes & their respective user for a ballot, 
 * as well as for all the users of that company that have not yet voted, 
 * compiles a list of all users that have voted and have not voted; 
 * if successful returns ballotVoters.
 * 
 * Throws error if there is no vote with that ID. 
 * Throws error message on a database error.
 *
 * @param {number} ballotID           The ID of the Ballot.
 *
 * @return {tallyBallotVoters} ballotVoters.
 */ 
async function tallyBallotVoters(ballotID) {
    //create SELECT statement for voters
    var statement = "SELECT u.fName, u.mName, u.lName, CASE(WHEN v.voteID IS NOT NULL THEN true ELSE false END) AS voted "
    + "FROM User u "
    + "JOIN Company c ON c.companyID = u.companyID "
    + "JOIN Ballots b ON b.companyID = c.companyID "
    + "LEFT JOIN Votes v ON v.userID = u.userID AND v.ballotID = b.ballotID "
    + "WHERE b.ballotID = $1;";
    var values = [ballotID];
    try {
        var result = await pool.query(statement, values);
        if (result.rows.length === 0) {
            //throw & log DAError
            throw new DAError('no ballot with that ID');
        }
        //build ballotVoters
        var ballotVoters = {
            votedPecantage: 0,
            voters: []
        }
        //update ballotVoters
        for (let i = 0; i < result.rows.length; i++) {
            var voters = {
                fName: result.rows[i][0],
                lName: result.rows[i][1],
                mName: result.rows[i][2],
                companyName: result.rows[i][3]
            };
            ballotVoters.voters.push(voters);
        }

        //create SELECT statement for vote percantage
        statement = "SELECT COUNT(DINSTINCT v.userID) * 100.0 / COUNT(DISTINCT u.userID) AS votedPercantage "
        + "FROM User u "
        + "JOIN Company c ON c.companyID = u.companyID "
        + "JOIN Ballots b ON b.companyID = c.companyID "
        + "LEFT JOIN Votes v ON v.userID = u.userID AND v.ballotID = b.ballotID "
        + "WHERE b.ballotID = $1;";
        //Check Result
        result = await pool.query(statement, values);
        if (result.rows[0].length === 0) {
            //throw & log DAError
            throw new DAError('no ballot with that ID');
        }
        //update ballotVoters
        ballotVoters.votedPecantage =  result.rows[0][0];

        // Return ballotVoters
        return ballotVoters;
    } catch (error) {
        if (error == DAError){
            throw error;
        } else {
            //throw database error & Log
        }
    }
}