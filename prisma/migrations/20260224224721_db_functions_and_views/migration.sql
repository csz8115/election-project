-- Materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS user_voting_status AS
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

-- check_ballot_voter
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
END;
$$ LANGUAGE plpgsql;

-- get_ballot_voting_status
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
  SELECT "companyID" INTO ballot_company_id
  FROM "ballots"
  WHERE "ballotID" = p_ballot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ballot ID % not found', p_ballot_id;
  END IF;

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