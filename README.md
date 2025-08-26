# Election Management Platform

This is a  full-stack election system for managing voters, ballots, initiatives, and results at scale.
Built with Node.js/Express, PostgreSQL, JWT role-based auth, Redis caching, and Pino logging.
Designed to simulate enterprise workloads (20k+ users, 1.4M+ votes) with auditing, analytics views, and robust DB features (materialized views, triggers, PL/pgSQL).

## Highlights
- Realistic Scale: 20K+ users, 1.4M+ votes
- Secure auth: JWTs with granular roles & permissions.
- DB power features: materialized views, triggers, stored functions for eligibility & analytics.
- Performance: Redis caching + indexed queries; Pino structured logs.
- Auditing: append-only audit trail for admin actions & ballot events.
- API: clean REST endpoints with pagination, filtering, and input validation.
- Dev Ops: Metrics, Commit and Push Hooks with env based config

## Tech Stack
- Backend: Node.js, Express
- Database: PostgreSQL (Prisma ORM, PL/pgSQL, triggers, materialized views)
- Cache/Analytics: Redis
- Auth: JWT (access + refresh)
- Logging: Pino (JSON structured logs)'
- Testing: Jest

## Database (Overview)

![Election App ERD](./public/images/electionERD.png)

### Table Descriptions

- **users**  
  Stores system accounts (admins, clerks, election managers, voters).  
  Key columns: `id`, `email`, `role`.  
  Enforced with role-based permissions; linked to `audit_log` for accountability.  

- **voters**  
  Contains voter registration records and eligibility attributes.  
  Key columns: `id`, `precinct_id`, `status`.  
  Eligibility checked via `voter_eligibility()` PL/pgSQL function.  

- **elections**  
  Defines election events and their lifecycle.  
  Key columns: `id`, `name`, `start_date`, `end_date`.  
  Related to `contests` and `ballots`.  

- **contests**  
  Represents positions, referenda, or questions within an election.  
  Key columns: `id`, `election_id`, `title`.  
  Linked to `candidates` and `votes`.  

- **candidates**  
  Holds candidate or option information for a contest.  
  Key columns: `id`, `contest_id`, `name`.  
  Referenced in `votes` records.  

- **ballots**  
  Issued to voters for a specific election.  
  Key columns: `id`, `voter_id`, `election_id`, `status`.  
  Integrity enforced by triggers; audited on issuance and casting.  

- **votes**  
  Stores individual selections on a ballot.  
  Key columns: `id`, `ballot_id`, `contest_id`, `candidate_id`.  
  Aggregated into materialized views for results reporting.  

- **initiative_votes**  
  Records votes for ballot initiatives (referenda or propositions).  
  Key columns: `id`, `ballot_id`, `initiative_id`, `choice`.  

- **audit_log**  
  Append-only log of sensitive system and admin actions.  
  Populated by triggers on `users`, `ballots`, `votes`, etc.  
  Key columns: `id`, `action`, `actor_id`, `timestamp`, `details`.  

### Materialized Views

- **`user_voting_status`**  
  Snapshot of each user’s voting status across all ballots in their company.  
  Used for dashboards, quick “who has/hasn’t voted” checks, and progress reporting.

### Functions

- **`check_ballot_voter(p_ballot_id int, p_user_id int) RETURNS boolean`**  
  Returns `TRUE` if the given user has cast a vote in the specified ballot, otherwise `FALSE`.  
  Useful for API guards and ensuring a user cannot vote more than once.  

- **`get_ballot_voting_status(p_ballot_id int) RETURNS TABLE (...)`**  
  Provides both aggregate stats (percentage, counts) and per-member voting status for a ballot’s company.  
  Outputs each member’s info (`user_id`, `username`, `fname`, `lname`) alongside their `has_voted` flag.  
  Designed for dashboards showing overall progress and who has/hasn’t voted.

## Roles & Permissions

CREATE A TABLE TO SHOWCASE ROLES AND PERMISSIONS

## API 

ADD API DOCS HERE

## Database 

INSERT CONTENT here 

## Performance and Caching 

INSERT CONTENT HERE

## Security and Auditing

## Frontend 

DESCRIPTION 

SCREENSHOTS 

