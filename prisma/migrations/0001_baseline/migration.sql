-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Member', 'Admin', 'Officer', 'Employee');

-- CreateTable
CREATE TABLE "company" (
    "companyID" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "abbreviation" TEXT,
    "category" TEXT,

    CONSTRAINT "company_pkey" PRIMARY KEY ("companyID")
);

-- CreateTable
CREATE TABLE "employeeSocietyAssignment" (
    "assignmentID" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "companyID" INTEGER NOT NULL,

    CONSTRAINT "employeeSocietyAssignment_pkey" PRIMARY KEY ("assignmentID")
);

-- CreateTable
CREATE TABLE "ballots" (
    "ballotID" SERIAL NOT NULL,
    "ballotName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "companyID" INTEGER NOT NULL,

    CONSTRAINT "ballots_pkey" PRIMARY KEY ("ballotID")
);

-- CreateTable
CREATE TABLE "candidate" (
    "candidateID" SERIAL NOT NULL,
    "fName" TEXT NOT NULL,
    "lName" TEXT NOT NULL,
    "titles" TEXT,
    "description" TEXT,
    "picture" TEXT,
    "writeIn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "candidate_pkey" PRIMARY KEY ("candidateID")
);

-- CreateTable
CREATE TABLE "user" (
    "userID" SERIAL NOT NULL,
    "accountType" "AccountType" NOT NULL DEFAULT 'Member',
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fName" TEXT NOT NULL,
    "lName" TEXT NOT NULL,
    "companyID" INTEGER NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "votes" (
    "voteID" SERIAL NOT NULL,
    "ballotID" INTEGER NOT NULL,
    "userID" INTEGER NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("voteID")
);

-- CreateTable
CREATE TABLE "ballotInitiatives" (
    "initiativeID" SERIAL NOT NULL,
    "initiativeName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ballotID" INTEGER NOT NULL,

    CONSTRAINT "ballotInitiatives_pkey" PRIMARY KEY ("initiativeID")
);

-- CreateTable
CREATE TABLE "initiativeResponses" (
    "responseID" SERIAL NOT NULL,
    "response" TEXT NOT NULL,
    "initiativeID" INTEGER NOT NULL,

    CONSTRAINT "initiativeResponses_pkey" PRIMARY KEY ("responseID")
);

-- CreateTable
CREATE TABLE "initiativeVotes" (
    "voteID" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "initiativeID" INTEGER NOT NULL,
    "ballotID" INTEGER NOT NULL,
    "responseID" INTEGER NOT NULL,

    CONSTRAINT "initiativeVotes_pkey" PRIMARY KEY ("voteID")
);

-- CreateTable
CREATE TABLE "ballotPositions" (
    "positionID" SERIAL NOT NULL,
    "positionName" TEXT NOT NULL,
    "allowedVotes" INTEGER NOT NULL,
    "writeIn" BOOLEAN NOT NULL,
    "ballotID" INTEGER NOT NULL,

    CONSTRAINT "ballotPositions_pkey" PRIMARY KEY ("positionID")
);

-- CreateTable
CREATE TABLE "ballotCandidates" (
    "candidateID" INTEGER NOT NULL,
    "positionID" INTEGER NOT NULL,

    CONSTRAINT "ballotCandidates_pkey" PRIMARY KEY ("candidateID","positionID")
);

-- CreateTable
CREATE TABLE "positionVotes" (
    "voteID" INTEGER NOT NULL,
    "positionID" INTEGER NOT NULL,
    "candidateID" INTEGER NOT NULL,

    CONSTRAINT "positionVotes_pkey" PRIMARY KEY ("voteID","positionID")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_companyName_key" ON "company"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "employeeSocietyAssignment_userID_companyID_key" ON "employeeSocietyAssignment"("userID", "companyID");

-- CreateIndex
CREATE INDEX "company_end_date_index" ON "ballots"("companyID", "endDate");

-- CreateIndex
CREATE INDEX "company_start_end_date_index" ON "ballots"("companyID", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "ballot_user_index" ON "votes"("ballotID", "userID");

-- CreateIndex
CREATE INDEX "user_initiative_index" ON "initiativeVotes"("userID", "initiativeID");

-- AddForeignKey
ALTER TABLE "employeeSocietyAssignment" ADD CONSTRAINT "employeeSocietyAssignment_userID_fkey" FOREIGN KEY ("userID") REFERENCES "user"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employeeSocietyAssignment" ADD CONSTRAINT "employeeSocietyAssignment_companyID_fkey" FOREIGN KEY ("companyID") REFERENCES "company"("companyID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_companyID_fkey" FOREIGN KEY ("companyID") REFERENCES "company"("companyID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_companyID_fkey" FOREIGN KEY ("companyID") REFERENCES "company"("companyID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_ballotID_fkey" FOREIGN KEY ("ballotID") REFERENCES "ballots"("ballotID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_userID_fkey" FOREIGN KEY ("userID") REFERENCES "user"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballotInitiatives" ADD CONSTRAINT "ballotInitiatives_ballotID_fkey" FOREIGN KEY ("ballotID") REFERENCES "ballots"("ballotID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiativeResponses" ADD CONSTRAINT "initiativeResponses_initiativeID_fkey" FOREIGN KEY ("initiativeID") REFERENCES "ballotInitiatives"("initiativeID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiativeVotes" ADD CONSTRAINT "initiativeVotes_initiativeID_fkey" FOREIGN KEY ("initiativeID") REFERENCES "ballotInitiatives"("initiativeID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiativeVotes" ADD CONSTRAINT "initiativeVotes_responseID_fkey" FOREIGN KEY ("responseID") REFERENCES "initiativeResponses"("responseID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiativeVotes" ADD CONSTRAINT "initiativeVotes_userID_fkey" FOREIGN KEY ("userID") REFERENCES "user"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiativeVotes" ADD CONSTRAINT "initiativeVotes_ballotID_fkey" FOREIGN KEY ("ballotID") REFERENCES "ballots"("ballotID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballotPositions" ADD CONSTRAINT "ballotPositions_ballotID_fkey" FOREIGN KEY ("ballotID") REFERENCES "ballots"("ballotID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballotCandidates" ADD CONSTRAINT "ballotCandidates_candidateID_fkey" FOREIGN KEY ("candidateID") REFERENCES "candidate"("candidateID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballotCandidates" ADD CONSTRAINT "ballotCandidates_positionID_fkey" FOREIGN KEY ("positionID") REFERENCES "ballotPositions"("positionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positionVotes" ADD CONSTRAINT "positionVotes_candidateID_fkey" FOREIGN KEY ("candidateID") REFERENCES "candidate"("candidateID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positionVotes" ADD CONSTRAINT "positionVotes_positionID_fkey" FOREIGN KEY ("positionID") REFERENCES "ballotPositions"("positionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positionVotes" ADD CONSTRAINT "positionVotes_voteID_fkey" FOREIGN KEY ("voteID") REFERENCES "votes"("voteID") ON DELETE CASCADE ON UPDATE CASCADE;

