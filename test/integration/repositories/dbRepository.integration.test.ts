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