type BallotEditableRecord = {
    ballotID?: number;
    endDate?: Date | string;
};

class BallotNotFoundError extends Error {
    constructor(message = 'Ballot does not exist') {
        super(message);
        this.name = 'BallotNotFoundError';
    }
}

class BallotStructureLockedError extends Error {
    constructor(message = 'This election has ended. Structure edits are disabled.') {
        super(message);
        this.name = 'BallotStructureLockedError';
    }
}

function hasBallotEnded(endDate?: Date | string): boolean {
    if (!endDate) return false;
    const parsed = new Date(endDate);
    if (Number.isNaN(parsed.getTime())) return false;
    return new Date().getTime() > parsed.getTime();
}

function assertBallotIsEditable(ballot: BallotEditableRecord | null | undefined): void {
    if (!ballot || !ballot.ballotID) {
        throw new BallotNotFoundError();
    }
    if (hasBallotEnded(ballot.endDate)) {
        throw new BallotStructureLockedError();
    }
}

async function assertBallotEditableByBallotID(db: any, ballotID: number): Promise<void> {
    const ballot = await db.getBallot(ballotID);
    assertBallotIsEditable(ballot);
}

async function assertBallotEditableByPositionID(db: any, positionID: number): Promise<void> {
    const ballot = await db.getBallotByPositionID(positionID);
    assertBallotIsEditable(ballot);
}

async function assertBallotEditableByCandidateID(db: any, candidateID: number): Promise<void> {
    const ballot = await db.getBallotByCandidateID(candidateID);
    assertBallotIsEditable(ballot);
}

async function assertBallotEditableByInitiativeID(db: any, initiativeID: number): Promise<void> {
    const ballot = await db.getBallotByInitiativeID(initiativeID);
    assertBallotIsEditable(ballot);
}

export {
    BallotNotFoundError,
    BallotStructureLockedError,
    hasBallotEnded,
    assertBallotIsEditable,
    assertBallotEditableByBallotID,
    assertBallotEditableByPositionID,
    assertBallotEditableByCandidateID,
    assertBallotEditableByInitiativeID,
};

