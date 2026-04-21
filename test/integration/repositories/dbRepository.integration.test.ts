import type { PrismaClient } from '@prisma/client';
import {
  applyMigrations,
  assertExpectedSchema,
  requireTestDatabaseUrl,
  resetPublicSchema,
} from './helpers/postgresTestHarness';
import { seedBallot, seedBaseCompanies, seedPosition, seedUser } from './helpers/seedHelpers';
import { describe, beforeAll, beforeEach, afterAll, test, expect, jest } from '@jest/globals';

jest.setTimeout(30000);
const DB_DEBUG = process.env.INTEGRATION_DB_DEBUG === '1';

describe('dbRepository integration (real Postgres + Prisma)', () => {
  let prisma: PrismaClient | undefined;
  let db: typeof import('../../../src/server/repositories/dbRepository.ts').db;
  let baseCompanies: { americanDream: { companyID: number }; acme: { companyID: number } };

  const createElectionFixture = async () => {
    if (!prisma) throw new Error('Prisma not initialized');

    const ballot = await seedBallot(prisma, { companyID: baseCompanies.acme.companyID });
    const position = await seedPosition(prisma, { ballotID: ballot.ballotID, positionName: 'President' });

    const candidate = await prisma.candidate.create({
      data: {
        fName: 'Jane',
        lName: 'Candidate',
        titles: 'Chair',
        description: 'Candidate description',
        picture: '',
      },
    });

    await prisma.ballotCandidates.create({
      data: {
        positionID: position.positionID,
        candidateID: candidate.candidateID,
      },
    });

    return { ballot, position, candidate };
  };

  beforeAll(async () => {
    try {
      // ✅ Fail fast with a clear message instead of skipping at module-load time.
      if (!process.env.DATABASE_URL_TEST) {
        throw new Error(
          'DATABASE_URL_TEST is not set. ' +
            'The integration DB bootstrap did not run. ' +
            'Check jest integration project: setupFiles (envSetup.ts) + globalSetup/globalTeardown.',
        );
      }

      const testDbUrl = requireTestDatabaseUrl();
      process.env.DATABASE_URL = testDbUrl;
      process.env.DATABASE_URL_TEST = testDbUrl;

      if (DB_DEBUG) {
        console.log(`[integration-db] beforeAll DATABASE_URL_TEST=${process.env.DATABASE_URL_TEST}`);
        console.log(`[integration-db] beforeAll DATABASE_URL=${process.env.DATABASE_URL}`);
      }

      applyMigrations(testDbUrl);

      jest.resetModules();
      jest.unmock('../../../src/server/utils/db/prisma');
      jest.unmock('../../../src/server/utils/db/prisma.ts');
      jest.unmock('../../../src/server/repositories/dbRepository.ts');

      const prismaModule = await import('../../../src/server/utils/db/prisma.ts');
      prisma = prismaModule.default as unknown as PrismaClient;

      const repositoryModule = await import('../../../src/server/repositories/dbRepository.ts');
      db = repositoryModule.db;

      await assertExpectedSchema(prisma);
    } catch (e) {
      console.error('INTEGRATION beforeAll FAILED:', e);
      throw e;
    }
  });

  beforeEach(async () => {
    if (!prisma) throw new Error('Prisma not initialized');
    await resetPublicSchema(prisma);
    baseCompanies = await seedBaseCompanies(prisma);
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  describe('company entity', () => {
    test('CRUD: create/get/delete company', async () => {
      const created = await db.createCompany({
        companyName: 'Zenith Labs',
        abbreviation: 'ZL',
        category: 'Testing',
      } as any);

      expect(created).toBeTruthy();

      const found = await db.getCompany(created!.companyID);
      expect(found?.companyName).toBe('Zenith Labs');

      const deleted = await db.removeCompany(created!.companyID);
      expect(deleted).toBe(true);

      const afterDelete = await db.getCompany(created!.companyID);
      expect(afterDelete).toBeNull();
    });

    test('edge: duplicate companyName returns undefined', async () => {
      await db.createCompany({ companyName: 'Unique Co', abbreviation: 'U1', category: 'A' } as any);
      const duplicate = await db.createCompany({ companyName: 'Unique Co', abbreviation: 'U2', category: 'B' } as any);
      expect(duplicate).toBeUndefined();
    });

    test('edge: getCompanyIDByName returns null when missing', async () => {
      const missing = await db.getCompanyIDByName('Does Not Exist');
      expect(missing).toBeNull();
    });

    test('edge: getCompaniesByIDs returns matching subset only', async () => {
      const rows = await db.getCompaniesByIDs([baseCompanies.americanDream.companyID]);
      expect(rows).toHaveLength(1);
      expect(rows[0].companyID).toBe(baseCompanies.americanDream.companyID);
    });

    test('edge: removeCompany not found returns undefined', async () => {
      const deleted = await db.removeCompany(999999);
      expect(deleted).toBeUndefined();
    });
  });

  describe('user entity', () => {
    test('CRUD: create/get/update/delete user', async () => {
      const created = await db.createUser({
        accountType: 'Member',
        username: 'repo_member_1',
        fName: 'Repo',
        lName: 'Member',
        password: 'hashed-password',
        companyID: baseCompanies.acme.companyID,
      } as any);

      expect(created).toBeTruthy();

      const fetched = await db.getUser(created!.userID);
      expect((fetched as any)?.username).toBe('repo_member_1');

      const updated = await db.updateUser(created!.userID, {
        ...created,
        username: 'repo_member_1_updated',
        fName: 'Updated',
      } as any);

      expect(updated?.username).toBe('repo_member_1_updated');
      expect(updated?.fName).toBe('Updated');

      const deleted = await db.deleteUser(created!.userID);
      expect(deleted).toBe(true);

      const afterDelete = await db.getUser(created!.userID);
      expect(afterDelete).toBeNull();
    });

    test('edge: duplicate username returns undefined', async () => {
      await db.createUser({
        accountType: 'Member',
        username: 'dup_user',
        fName: 'A',
        lName: 'B',
        password: 'hash',
        companyID: baseCompanies.acme.companyID,
      } as any);

      const duplicate = await db.createUser({
        accountType: 'Member',
        username: 'dup_user',
        fName: 'C',
        lName: 'D',
        password: 'hash',
        companyID: baseCompanies.acme.companyID,
      } as any);

      expect(duplicate).toBeUndefined();
    });

    test('edge: invalid FK company on create returns undefined', async () => {
      const created = await db.createUser({
        accountType: 'Member',
        username: 'bad_fk_user',
        fName: 'Bad',
        lName: 'Fk',
        password: 'hash',
        companyID: 999999,
      } as any);

      expect(created).toBeUndefined();
    });

    test('edge: checkUsername trims input and finds user', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const seeded = await seedUser(prisma, {
        username: 'trim_user',
        companyID: baseCompanies.acme.companyID,
      });

      const found = await db.checkUsername('  trim_user  ');

      expect(found).toBeTruthy();
      expect(found.userID).toBe(seeded.userID);
    });

    test('edge: getUserByUsername missing returns null', async () => {
      const found = await db.getUserByUsername('missing_user');
      expect(found).toBeNull();
    });
  });

  describe('candidate entity', () => {
    test('CRUD: create/get/update/delete candidate', async () => {
      const { position } = await createElectionFixture();

      const created = await db.createCandidate(position.positionID, 'John', 'Doe', 'Treasurer', 'Desc', '');
      expect(created).toBeTruthy();

      const found = await db.getCandidate(created!.candidateID);
      expect(found?.fName).toBe('John');

      const updated = await db.updateCandidate(created!.candidateID, { fName: 'Johnny' });
      expect(updated?.fName).toBe('Johnny');

      const deleted = await db.deleteCandidate(created!.candidateID);
      expect(deleted).toBe(true);

      const afterDelete = await db.getCandidate(created!.candidateID);
      expect(afterDelete).toBeUndefined();
    });

    test('edge: createCandidate invalid position returns undefined', async () => {
      const created = await db.createCandidate(999999, 'Bad', 'Candidate', '', '', '');
      expect(created).toBeUndefined();
    });

    test('edge: updateCandidate not found returns undefined', async () => {
      const updated = await db.updateCandidate(999999, { fName: 'missing' });
      expect(updated).toBeUndefined();
    });

    test('edge: createWriteInCandidate sets writeIn=true', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const candidateID = await db.createWriteInCandidate('Write', 'In');
      const row = await prisma.candidate.findUnique({ where: { candidateID } });

      expect(row).toBeTruthy();
      expect(row?.writeIn).toBe(true);
    });
  });

  describe('ballot entity', () => {
    test('CRUD: create/get/update/delete ballot', async () => {
      const created = await db.createBallot(
        {
          ballotName: 'Repo Ballot',
          description: 'Repository ballot test',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-12-31T00:00:00.000Z',
          companyID: baseCompanies.acme.companyID,
          userID: 1,
          positions: [],
          initiatives: [],
        } as any,
        [
          {
            positionName: 'Treasurer',
            allowedVotes: 1,
            writeIn: false,
            candidates: [{ fName: 'Terry', lName: 'Tester', titles: '', description: '', picture: '' }],
          },
        ] as any,
        [] as any,
      );

      expect(created).toBeTruthy();

      const found = await db.getBallot(created.ballotID);
      expect(found?.ballotName).toBe('Repo Ballot');

      const updated = await db.updateBallot(created.ballotID, {
        ballotName: 'Repo Ballot Updated',
        description: 'Updated desc',
      });
      expect(updated?.ballotName).toBe('Repo Ballot Updated');

      const deleted = await db.deleteBallot(created.ballotID);
      expect(deleted).toBe(true);

      const afterDelete = await db.getBallot(created.ballotID);
      expect(afterDelete).toBeNull();
    });

    test('edge: createBallot invalid company throws (rethrow behavior)', async () => {
      await expect(
        db.createBallot(
          {
            ballotName: 'Broken Ballot',
            description: 'Invalid FK',
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-12-31T00:00:00.000Z',
            companyID: 999999,
            userID: 1,
            positions: [],
            initiatives: [],
          } as any,
          [] as any,
          [] as any,
        ),
      ).rejects.toBeTruthy();
    });

    test('edge: updateBallot not found returns null', async () => {
      const updated = await db.updateBallot(999999, { ballotName: 'missing' });
      expect(updated).toBeNull();
    });

    test('edge: deleteBallot not found returns false', async () => {
      const deleted = await db.deleteBallot(999999);
      expect(deleted).toBe(false);
    });

    test('edge: getBallotIDs returns only company-matching ballots', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const acmeBallot = await seedBallot(prisma, { companyID: baseCompanies.acme.companyID, ballotName: 'Alpha' });
      await seedBallot(prisma, { companyID: baseCompanies.americanDream.companyID, ballotName: 'Beta' });

      const acmeBallots = await db.getBallotIDs(undefined, undefined, undefined, 'all', [baseCompanies.acme.companyID]);

      expect(acmeBallots.length).toBe(1);
      expect(acmeBallots[0]).toBe(acmeBallot.ballotID);
    });

    test('createBallot: persists ballot with one position and one candidate', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const created = await db.createBallot(
        {
          ballotName: 'Single Position Ballot',
          description: 'Created with one position/candidate',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2099-12-31T00:00:00.000Z',
          companyID: baseCompanies.acme.companyID,
          userID: 1,
          positions: [],
          initiatives: [],
        } as any,
        [
          {
            positionName: 'Board Chair',
            allowedVotes: 1,
            writeIn: false,
            candidates: [{ fName: 'Sam', lName: 'Nominee', titles: 'Chair', description: 'Experienced', picture: '' }],
          },
        ] as any,
        [] as any,
      );

      expect(created).toBeTruthy();

      const fetched = await db.getBallot(created.ballotID);
      expect(fetched).toBeTruthy();
      expect(fetched.ballotName).toBe('Single Position Ballot');
      expect(fetched.positions).toHaveLength(1);
      expect(fetched.positions[0].positionName).toBe('Board Chair');
      expect(fetched.positions[0].candidates).toHaveLength(1);
      expect(fetched.positions[0].candidates[0].candidate.fName).toBe('Sam');
      expect(fetched.positions[0].candidates[0].candidate.lName).toBe('Nominee');

      const persistedBallot = await prisma.ballots.findUnique({
        where: { ballotID: created.ballotID },
      });
      const persistedPositions = await prisma.ballotPositions.findMany({
        where: { ballotID: created.ballotID },
      });
      const persistedLinks = await prisma.ballotCandidates.findMany({
        where: { positionID: persistedPositions[0].positionID },
      });

      expect(persistedBallot).toBeTruthy();
      expect(persistedPositions).toHaveLength(1);
      expect(persistedLinks).toHaveLength(1);
    });

    test('createBallot: supports initiatives with initiative responses', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const created = await db.createBallot(
        {
          ballotName: 'Initiative Ballot',
          description: 'Ballot containing initiatives',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2099-12-31T00:00:00.000Z',
          companyID: baseCompanies.acme.companyID,
          userID: 1,
          positions: [],
          initiatives: [],
        } as any,
        [] as any,
        [
          {
            initiativeName: 'Adopt New Policy',
            description: 'Policy proposal',
            responses: [{ response: 'Approve' }, { response: 'Reject' }],
          },
        ] as any,
      );

      const fetched = await db.getBallot(created.ballotID);
      expect(fetched.initiatives).toHaveLength(1);
      expect(fetched.initiatives[0].initiativeName).toBe('Adopt New Policy');
      expect(fetched.initiatives[0].responses).toHaveLength(2);
      expect(fetched.initiatives[0].responses.map((row: any) => row.response).sort()).toEqual(['Approve', 'Reject']);

      const initiativeRows = await prisma.ballotInitiatives.findMany({
        where: { ballotID: created.ballotID },
      });
      const responseCount = await prisma.initiativeResponses.count({
        where: { initiativeID: initiativeRows[0].initiativeID },
      });

      expect(initiativeRows).toHaveLength(1);
      expect(responseCount).toBe(2);
    });

    test('createBallot: transaction rolls back when nested creation fails', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const rollbackBallotName = 'Rollback Candidate Failure Ballot';
      const rollbackPositionName = 'Rollback Candidate Failure Position';

      await expect(
        db.createBallot(
          {
            ballotName: rollbackBallotName,
            description: 'Should not persist',
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2099-12-31T00:00:00.000Z',
            companyID: baseCompanies.acme.companyID,
            userID: 1,
            positions: [],
            initiatives: [],
          } as any,
          [
            {
              positionName: rollbackPositionName,
              allowedVotes: 1,
              writeIn: false,
              candidates: [{ fName: null, lName: 'Broken', titles: '', description: '', picture: '' }],
            },
          ] as any,
          [] as any,
        ),
      ).rejects.toBeTruthy();

      const rolledBackBallot = await prisma.ballots.findMany({
        where: { ballotName: rollbackBallotName },
      });
      const rolledBackPosition = await prisma.ballotPositions.findMany({
        where: { positionName: rollbackPositionName },
      });

      expect(rolledBackBallot).toHaveLength(0);
      expect(rolledBackPosition).toHaveLength(0);
    });

    test('getBallots/getBallotIDs: search + open status + company filters stay consistent', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const openAcmeByName = await seedBallot(prisma, {
        companyID: baseCompanies.acme.companyID,
        ballotName: 'Budget Oversight 2028',
        description: 'Operations approval',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2099-12-31T00:00:00.000Z'),
      });
      const openAcmeByDescription = await seedBallot(prisma, {
        companyID: baseCompanies.acme.companyID,
        ballotName: 'Operations Election',
        description: 'Budget-focused election',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2099-12-31T00:00:00.000Z'),
      });
      await seedBallot(prisma, {
        companyID: baseCompanies.acme.companyID,
        ballotName: 'Budget Archived',
        description: 'Budget but closed',
        startDate: new Date('2000-01-01T00:00:00.000Z'),
        endDate: new Date('2000-12-31T00:00:00.000Z'),
      });
      await seedBallot(prisma, {
        companyID: baseCompanies.americanDream.companyID,
        ballotName: 'Budget External',
        description: 'Open but wrong company',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2099-12-31T00:00:00.000Z'),
      });

      const ballotPage = await db.getBallots(
        0,
        'budget',
        'ballotName',
        'asc',
        'open',
        [baseCompanies.acme.companyID],
      );
      const filteredIDs = await db.getBallotIDs(
        'budget',
        'ballotName',
        'asc',
        'open',
        [baseCompanies.acme.companyID],
      );

      expect(ballotPage).toBeTruthy();
      expect(ballotPage!.totalCount).toBe(2);
      expect(ballotPage!.ballots).toHaveLength(2);
      expect(ballotPage!.ballots.map((row) => row.ballotID)).toEqual(filteredIDs);
      expect(ballotPage!.ballots.map((row) => row.ballotID).sort((a, b) => a - b)).toEqual(
        [openAcmeByName.ballotID, openAcmeByDescription.ballotID].sort((a, b) => a - b),
      );
      expect(ballotPage!.ballots.every((row) => row.companyID === baseCompanies.acme.companyID)).toBe(true);
    });

    test('getBallots: closed status returns only closed ballots', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const closedBallot = await seedBallot(prisma, {
        companyID: baseCompanies.acme.companyID,
        ballotName: 'Closed Compliance Vote',
        description: 'Already ended',
        startDate: new Date('2000-01-01T00:00:00.000Z'),
        endDate: new Date('2000-12-31T00:00:00.000Z'),
      });
      await seedBallot(prisma, {
        companyID: baseCompanies.acme.companyID,
        ballotName: 'Open Compliance Vote',
        description: 'Still active',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2099-12-31T00:00:00.000Z'),
      });

      const closedPage = await db.getBallots(0, undefined, 'ballotName', 'asc', 'closed');
      expect(closedPage).toBeTruthy();
      expect(closedPage!.ballots).toHaveLength(1);
      expect(closedPage!.ballots[0].ballotID).toBe(closedBallot.ballotID);
    });

    test('getBallots: pagination fields are correct', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      for (let i = 0; i < 41; i += 1) {
        await seedBallot(prisma, {
          companyID: baseCompanies.acme.companyID,
          ballotName: `Paginated Ballot ${String(i).padStart(2, '0')}`,
          description: 'Pagination scenario',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2099-12-31T00:00:00.000Z'),
        });
      }

      const firstPage = await db.getBallots(
        0,
        'Paginated Ballot',
        'ballotName',
        'asc',
        'all',
        [baseCompanies.acme.companyID],
      );
      const secondPage = await db.getBallots(
        1,
        'Paginated Ballot',
        'ballotName',
        'asc',
        'all',
        [baseCompanies.acme.companyID],
      );
      const allIDs = await db.getBallotIDs(
        'Paginated Ballot',
        'ballotName',
        'asc',
        'all',
        [baseCompanies.acme.companyID],
      );

      expect(firstPage).toBeTruthy();
      expect(firstPage!.ballots).toHaveLength(40);
      expect(firstPage!.totalCount).toBe(41);
      expect(firstPage!.hasNextPage).toBe(true);
      expect(firstPage!.hasPreviousPage).toBe(false);
      expect(firstPage!.nextCursor).toBe('1');

      expect(secondPage).toBeTruthy();
      expect(secondPage!.ballots).toHaveLength(1);
      expect(secondPage!.totalCount).toBe(41);
      expect(secondPage!.hasNextPage).toBe(false);
      expect(secondPage!.hasPreviousPage).toBe(true);
      expect(secondPage!.nextCursor).toBeNull();

      expect(allIDs).toHaveLength(41);
      expect(firstPage!.ballots.map((row) => row.ballotID)).toEqual(allIDs.slice(0, 40));
      expect(secondPage!.ballots.map((row) => row.ballotID)).toEqual(allIDs.slice(40));
    });

    test('changeBallotDates: updates one ballot end date and persists', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const ballot = await seedBallot(prisma, {
        companyID: baseCompanies.acme.companyID,
        ballotName: 'Single Date Update Ballot',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
      });

      const newEndDate = new Date('2027-05-20T00:00:00.000Z');
      const updated = await db.changeBallotDates(ballot.ballotID, undefined, newEndDate);
      const persisted = await prisma.ballots.findUnique({ where: { ballotID: ballot.ballotID } });

      expect(new Date(updated.endDate).toISOString()).toBe(newEndDate.toISOString());
      expect(persisted).toBeTruthy();
      expect(persisted!.endDate.toISOString()).toBe(newEndDate.toISOString());
    });

    test('changeBallotDates: updates multiple ballots when passed an ID array', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const ballotOne = await seedBallot(prisma, {
        companyID: baseCompanies.acme.companyID,
        ballotName: 'Bulk Date Update 1',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
      });
      const ballotTwo = await seedBallot(prisma, {
        companyID: baseCompanies.acme.companyID,
        ballotName: 'Bulk Date Update 2',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
      });

      const newEndDate = new Date('2028-01-15T00:00:00.000Z');
      const updatedRows = await db.changeBallotDates([ballotOne.ballotID, ballotTwo.ballotID], undefined, newEndDate);
      const persistedRows = await prisma.ballots.findMany({
        where: {
          ballotID: { in: [ballotOne.ballotID, ballotTwo.ballotID] },
        },
        orderBy: { ballotID: 'asc' },
      });

      expect(updatedRows).toHaveLength(2);
      expect(updatedRows.every((row: any) => new Date(row.endDate).toISOString() === newEndDate.toISOString())).toBe(true);
      expect(persistedRows).toHaveLength(2);
      expect(persistedRows.every((row) => row.endDate.toISOString() === newEndDate.toISOString())).toBe(true);
    });

    test('changeBallotDates: throws when neither start nor end date is provided', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const ballot = await seedBallot(prisma, {
        companyID: baseCompanies.acme.companyID,
        ballotName: 'No Date Payload Ballot',
      });

      await expect(db.changeBallotDates(ballot.ballotID, undefined, undefined)).rejects.toThrow(
        'At least one of newStartDate or newEndDate must be provided',
      );
    });
  });

  describe('ballot position entity', () => {
    test('CRUD: create/get/update/delete ballot position', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const ballot = await seedBallot(prisma, { companyID: baseCompanies.acme.companyID });

      const created = await db.createBallotPosition({
        ballotID: ballot.ballotID,
        positionName: 'Secretary',
        allowedVotes: 1,
        writeIn: false,
        candidates: [{ fName: 'Alex', lName: 'Vote', titles: '', description: '', picture: '' }],
      } as any);

      expect(created).toBeTruthy();

      const existsFlag = await db.getBallotPosition(created!.positionID);
      expect(existsFlag).toBe(true);

      const updated = await db.updateBallotPosition(created!.positionID, {
        positionName: 'Secretary Updated',
      } as any);
      expect(updated?.positionName).toBe('Secretary Updated');

      const deleted = await db.deleteBallotPosition(created!.positionID);
      expect(deleted).toBe(true);

      const afterDelete = await db.getBallotPosition(created!.positionID);
      expect(afterDelete).toBeUndefined();
    });

    test('edge: createBallotPosition invalid ballot returns undefined', async () => {
      const created = await db.createBallotPosition({
        ballotID: 999999,
        positionName: 'Missing Parent',
        allowedVotes: 1,
        writeIn: false,
        candidates: [],
      } as any);

      expect(created).toBeUndefined();
    });

    test('edge: updateBallotPosition not found returns undefined', async () => {
      const updated = await db.updateBallotPosition(999999, { positionName: 'x' } as any);
      expect(updated).toBeUndefined();
    });

    test('edge: deleteBallotPosition not found returns undefined', async () => {
      const deleted = await db.deleteBallotPosition(999999);
      expect(deleted).toBeUndefined();
    });
  });

  describe('initiative/response entity', () => {
    test('CRUD: create/get/delete initiative and response', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const ballot = await seedBallot(prisma, { companyID: baseCompanies.acme.companyID });

      const created = await db.createInitiative({
        ballotID: ballot.ballotID,
        initiativeName: 'Policy A',
        description: 'Adopt policy A',
        responses: [{ response: 'Yes' }, { response: 'No' }],
      } as any);

      expect(created).toBeTruthy();

      const found = await db.getInitiative(created!.initiativeID);
      expect(found?.initiativeName).toBe('Policy A');

      const responseRow = await prisma.initiativeResponses.findFirst({
        where: { initiativeID: created!.initiativeID },
      });
      expect(responseRow).toBeTruthy();

      const responseById = await db.getResponse(responseRow!.responseID);
      expect(responseById?.responseID).toBe(responseRow!.responseID);

      const deletedResponse = await db.deleteResponse(responseRow!.responseID);
      expect(deletedResponse).toBe(true);

      const deletedInitiative = await db.deleteInitiative(created!.initiativeID);
      expect(deletedInitiative).toBe(true);
    });

    test('edge: createInitiative without ballotID returns undefined', async () => {
      const created = await db.createInitiative({
        initiativeName: 'Broken',
        description: 'Missing ballot',
        responses: [],
      } as any);

      expect(created).toBeUndefined();
    });

    test('edge: getInitiative/getResponse missing return null', async () => {
      const initiative = await db.getInitiative(999999);
      const response = await db.getResponse(999999);

      expect(initiative).toBeNull();
      expect(response).toBeNull();
    });

    test('edge: deleteInitiative/deleteResponse missing return undefined', async () => {
      const deletedInitiative = await db.deleteInitiative(999999);
      const deletedResponse = await db.deleteResponse(999999);

      expect(deletedInitiative).toBeUndefined();
      expect(deletedResponse).toBeUndefined();
    });
  });

  describe('vote/status behavior', () => {
    test('createVote() + checkVoterStatus() happy path', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const user = await seedUser(prisma, { username: 'voter_1', companyID: baseCompanies.acme.companyID });
      const { ballot, position, candidate } = await createElectionFixture();

      const voteCreated = await db.createVote(user.userID, ballot.ballotID, position.positionID, candidate.candidateID);
      expect(voteCreated).toBe(true);

      const voted = await db.checkVoterStatus(ballot.ballotID, user.userID);
      expect(voted).toBe(true);
    });

    test('edge: checkVoterStatus for missing vote returns false', async () => {
      if (!prisma) throw new Error('Prisma not initialized');

      const user = await seedUser(prisma, { username: 'voter_2', companyID: baseCompanies.acme.companyID });
      const ballot = await seedBallot(prisma, { companyID: baseCompanies.acme.companyID });

      const voted = await db.checkVoterStatus(ballot.ballotID, user.userID);
      expect(voted).toBe(false);
    });

    test('edge: createVote invalid foreign keys returns undefined', async () => {
      const created = await db.createVote(999999, 999999, 999999, 999999);
      expect(created).toBeUndefined();
    });
  });
});
