-- This SQL script creates a materialized view named "user_voting_status" that provides information about users and their voting status in a company.
-- The view includes the user's first name, last name, username, user ID, company ID, ballot ID, and whether the user has voted or not.
-- The view is created by joining the "user", "company", "ballots", and "votes" tables.
CREATE MATERIALIZED VIEW user_voting_status AS
SELECT DISTINCT
	u."fName",
	u."lName",
	u."username",
	u."userID",
	c."companyID",
	b."ballotID",
	CASE
		WHEN v."voteID" IS NOT NULL THEN TRUE
		ELSE FALSE
	END AS voted
FROM
	"user" u
	JOIN "company" c ON c."companyID" = u."companyID"
	JOIN "ballots" b ON b."companyID" = c."companyID"
	LEFT JOIN "votes" v ON v."userID" = u."userID"
	AND v."ballotID" = b."ballotID";

-- Function to check if a user has voted in a specific ballot
-- This function takes a ballot ID and a user ID as input parameters and returns a boolean value indicating whether the user has voted in that ballot.
-- It queries the "votes" table to check for the existence of a vote with the given ballot ID and user ID.
-- If a vote exists, it returns true; otherwise, it returns false.
-- It works since voting on a ballot is a transaction, so a user must vote on an entire ballot and not just on a single field for a ballot.
CREATE OR REPLACE FUNCTION check_ballot_voter(p_ballot_id INT, p_user_id INT)
RETURNS BOOLEAN AS $$
DECLARE
    vote_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM "votes"
        WHERE "ballotID" = p_ballot_id
          AND "userID" = p_user_id
    ) INTO vote_exists;

    RETURN vote_exists;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Unknown error during ballot voter check: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ballot_voting_status(p_ballot_id INT)
RETURNS TABLE (
    percentage_voted NUMERIC,
    voted_count INT,
    not_voted_count INT,
    out_user_id INT,
    out_username TEXT,
    out_fname TEXT,
    out_lname TEXT,
    out_has_voted BOOLEAN
) AS $$
DECLARE
    ballot_company_id INT;
BEGIN
    -- Get the companyID for the given ballot
    SELECT "companyID" INTO ballot_company_id
    FROM "ballots"
    WHERE "ballotID" = p_ballot_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ballot ID % not found', p_ballot_id;
    END IF;

    -- Main logic
    RETURN QUERY
    WITH all_members AS (
        SELECT "userID", "username", "fName", "lName"
        FROM "user"
        WHERE "accountType" = 'Member'
          AND "companyID" = ballot_company_id
    ),
    voted_users AS (
        SELECT DISTINCT "userID"
        FROM "votes"
        WHERE "ballotID" = p_ballot_id
    ),
    merged AS (
        SELECT 
            m."userID" AS user_id,
            m."username" AS username,
            m."fName" AS fname,
            m."lName" AS lname,
            (v."userID" IS NOT NULL) AS has_voted
        FROM all_members m
        LEFT JOIN voted_users v ON m."userID" = v."userID"
    ),
    count_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE has_voted) AS voted,
            COUNT(*) FILTER (WHERE NOT has_voted) AS not_voted,
            COUNT(*) AS total
        FROM merged
    )
    SELECT 
        ROUND((cs.voted::NUMERIC / GREATEST(cs.total, 1)) * 100, 2) AS percentage_voted,
        cs.voted AS voted_count,
        cs.not_voted AS not_voted_count,
        m.user_id AS out_user_id,
        m.username AS out_username,
        m.fname AS out_fname,
        m.lname AS out_lname,
        m.has_voted AS out_has_voted
    FROM merged m
    CROSS JOIN count_stats cs;
END;
$$ LANGUAGE plpgsql;
