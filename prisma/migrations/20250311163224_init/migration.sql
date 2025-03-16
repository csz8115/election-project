-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Member', 'Officer', 'Employee', 'Administrator');

-- CreateTable
CREATE TABLE "Company" (
    "companyID" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("companyID")
);

-- CreateTable
CREATE TABLE "User" (
    "userID" SERIAL NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fName" TEXT NOT NULL,
    "mName" TEXT NOT NULL,
    "lName" TEXT NOT NULL,
    "companyID" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "AssignedCompanies" (
    "companyID" INTEGER NOT NULL,
    "userID" INTEGER NOT NULL,

    CONSTRAINT "AssignedCompanies_pkey" PRIMARY KEY ("companyID","userID")
);

-- CreateTable
CREATE TABLE "Ballots" (
    "ballotID" SERIAL NOT NULL,
    "ballotName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "companyID" INTEGER NOT NULL,

    CONSTRAINT "Ballots_pkey" PRIMARY KEY ("ballotID")
);

-- CreateTable
CREATE TABLE "BallotInitiatives" (
    "initiativeID" SERIAL NOT NULL,
    "initiativeName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ballotID" INTEGER NOT NULL,

    CONSTRAINT "BallotInitiatives_pkey" PRIMARY KEY ("initiativeID")
);

-- CreateTable
CREATE TABLE "InitiativeResponses" (
    "responseID" SERIAL NOT NULL,
    "response" TEXT NOT NULL,
    "initiativeID" INTEGER NOT NULL,

    CONSTRAINT "InitiativeResponses_pkey" PRIMARY KEY ("responseID")
);

-- CreateTable
CREATE TABLE "BallotPositions" (
    "positionID" SERIAL NOT NULL,
    "positionName" TEXT NOT NULL,
    "voteNum" INTEGER NOT NULL,
    "writeIn" BOOLEAN NOT NULL,
    "ballotID" INTEGER NOT NULL,

    CONSTRAINT "BallotPositions_pkey" PRIMARY KEY ("positionID")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "candidateID" SERIAL NOT NULL,
    "fName" TEXT NOT NULL,
    "mName" TEXT NOT NULL,
    "lName" TEXT NOT NULL,
    "titles" TEXT,
    "positions" TEXT,
    "description" TEXT,
    "picture" TEXT,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("candidateID")
);

-- CreateTable
CREATE TABLE "BallotCandidates" (
    "candidateID" INTEGER NOT NULL,
    "positionID" INTEGER NOT NULL,

    CONSTRAINT "BallotCandidates_pkey" PRIMARY KEY ("candidateID","positionID")
);

-- CreateTable
CREATE TABLE "Votes" (
    "voteID" SERIAL NOT NULL,
    "ballotID" INTEGER NOT NULL,
    "userID" INTEGER NOT NULL,

    CONSTRAINT "Votes_pkey" PRIMARY KEY ("voteID")
);

-- CreateTable
CREATE TABLE "InitiativeVotes" (
    "voteID" INTEGER NOT NULL,
    "initiativeID" INTEGER NOT NULL,
    "responseID" INTEGER NOT NULL,

    CONSTRAINT "InitiativeVotes_pkey" PRIMARY KEY ("voteID","initiativeID","responseID")
);

-- CreateTable
CREATE TABLE "WriteInNames" (
    "nameID" SERIAL NOT NULL,
    "fName" TEXT NOT NULL,
    "mName" TEXT NOT NULL,
    "lName" TEXT NOT NULL,

    CONSTRAINT "WriteInNames_pkey" PRIMARY KEY ("nameID")
);

-- CreateTable
CREATE TABLE "PositionVotes" (
    "voteID" INTEGER NOT NULL,
    "positionID" INTEGER NOT NULL,
    "voteNum" INTEGER NOT NULL,
    "candidateID" INTEGER NOT NULL,
    "nameID" INTEGER,

    CONSTRAINT "PositionVotes_pkey" PRIMARY KEY ("voteID","positionID","voteNum")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_companyName_key" ON "Company"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyID_fkey" FOREIGN KEY ("companyID") REFERENCES "Company"("companyID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedCompanies" ADD CONSTRAINT "AssignedCompanies_companyID_fkey" FOREIGN KEY ("companyID") REFERENCES "Company"("companyID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedCompanies" ADD CONSTRAINT "AssignedCompanies_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ballots" ADD CONSTRAINT "Ballots_companyID_fkey" FOREIGN KEY ("companyID") REFERENCES "Company"("companyID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotInitiatives" ADD CONSTRAINT "BallotInitiatives_ballotID_fkey" FOREIGN KEY ("ballotID") REFERENCES "Ballots"("ballotID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeResponses" ADD CONSTRAINT "InitiativeResponses_initiativeID_fkey" FOREIGN KEY ("initiativeID") REFERENCES "BallotInitiatives"("initiativeID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotPositions" ADD CONSTRAINT "BallotPositions_ballotID_fkey" FOREIGN KEY ("ballotID") REFERENCES "Ballots"("ballotID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotCandidates" ADD CONSTRAINT "BallotCandidates_candidateID_fkey" FOREIGN KEY ("candidateID") REFERENCES "Candidate"("candidateID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotCandidates" ADD CONSTRAINT "BallotCandidates_positionID_fkey" FOREIGN KEY ("positionID") REFERENCES "BallotPositions"("positionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Votes" ADD CONSTRAINT "Votes_ballotID_fkey" FOREIGN KEY ("ballotID") REFERENCES "Ballots"("ballotID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Votes" ADD CONSTRAINT "Votes_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeVotes" ADD CONSTRAINT "InitiativeVotes_voteID_fkey" FOREIGN KEY ("voteID") REFERENCES "Votes"("voteID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeVotes" ADD CONSTRAINT "InitiativeVotes_initiativeID_fkey" FOREIGN KEY ("initiativeID") REFERENCES "BallotInitiatives"("initiativeID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeVotes" ADD CONSTRAINT "InitiativeVotes_responseID_fkey" FOREIGN KEY ("responseID") REFERENCES "InitiativeResponses"("responseID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionVotes" ADD CONSTRAINT "PositionVotes_voteID_fkey" FOREIGN KEY ("voteID") REFERENCES "Votes"("voteID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionVotes" ADD CONSTRAINT "PositionVotes_positionID_fkey" FOREIGN KEY ("positionID") REFERENCES "BallotPositions"("positionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionVotes" ADD CONSTRAINT "PositionVotes_candidateID_fkey" FOREIGN KEY ("candidateID") REFERENCES "Candidate"("candidateID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionVotes" ADD CONSTRAINT "PositionVotes_nameID_fkey" FOREIGN KEY ("nameID") REFERENCES "WriteInNames"("nameID") ON DELETE SET NULL ON UPDATE CASCADE;
