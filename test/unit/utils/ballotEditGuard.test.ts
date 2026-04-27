import {
  BallotNotFoundError,
  BallotStructureLockedError,
  assertBallotEditableByBallotID,
  assertBallotEditableByCandidateID,
  assertBallotEditableByInitiativeID,
  assertBallotEditableByPositionID,
  hasBallotEnded,
} from "../../../src/server/utils/ballotEditGuard.ts";

describe("ballotEditGuard", () => {
  test("hasBallotEnded is true only when now is after endDate", () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);

    expect(hasBallotEnded(future)).toBe(false);
    expect(hasBallotEnded(past)).toBe(true);
  });

  test("assertBallotEditableByBallotID allows active ballot", async () => {
    const db = {
      getBallot: jest.fn().mockResolvedValue({
        ballotID: 1,
        endDate: new Date(Date.now() + 60_000),
      }),
    };

    await expect(assertBallotEditableByBallotID(db, 1)).resolves.toBeUndefined();
  });

  test("assertBallotEditableByBallotID blocks ended ballot", async () => {
    const db = {
      getBallot: jest.fn().mockResolvedValue({
        ballotID: 2,
        endDate: new Date(Date.now() - 60_000),
      }),
    };

    await expect(assertBallotEditableByBallotID(db, 2)).rejects.toBeInstanceOf(
      BallotStructureLockedError,
    );
  });

  test("assertBallotEditableByPositionID blocks when position's ballot ended", async () => {
    const db = {
      getBallotByPositionID: jest.fn().mockResolvedValue({
        ballotID: 3,
        endDate: new Date(Date.now() - 60_000),
      }),
    };

    await expect(assertBallotEditableByPositionID(db, 10)).rejects.toBeInstanceOf(
      BallotStructureLockedError,
    );
  });

  test("assertBallotEditableByCandidateID blocks when candidate's ballot ended", async () => {
    const db = {
      getBallotByCandidateID: jest.fn().mockResolvedValue({
        ballotID: 4,
        endDate: new Date(Date.now() - 60_000),
      }),
    };

    await expect(assertBallotEditableByCandidateID(db, 11)).rejects.toBeInstanceOf(
      BallotStructureLockedError,
    );
  });

  test("assertBallotEditableByInitiativeID blocks when initiative's ballot ended", async () => {
    const db = {
      getBallotByInitiativeID: jest.fn().mockResolvedValue({
        ballotID: 5,
        endDate: new Date(Date.now() - 60_000),
      }),
    };

    await expect(assertBallotEditableByInitiativeID(db, 12)).rejects.toBeInstanceOf(
      BallotStructureLockedError,
    );
  });

  test("throws BallotNotFoundError when ballot cannot be resolved", async () => {
    const db = {
      getBallotByCandidateID: jest.fn().mockResolvedValue(null),
    };

    await expect(assertBallotEditableByCandidateID(db, 999)).rejects.toBeInstanceOf(
      BallotNotFoundError,
    );
  });
});

