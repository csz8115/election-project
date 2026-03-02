import type { PrismaClient } from '@prisma/client';

type CompanySeed = {
  companyName: string;
  abbreviation: string;
  category: string;
};

export async function seedBaseCompanies(prisma: PrismaClient): Promise<{
  americanDream: { companyID: number };
  acme: { companyID: number };
}> {
  const defaults: CompanySeed[] = [
    { companyName: 'American Dream', abbreviation: 'AD', category: 'Default' },
    { companyName: 'Acme Corp', abbreviation: 'AC', category: 'General' },
  ];

  const created = [] as { companyID: number }[];
  for (const company of defaults) {
    const row = await prisma.company.create({ data: company, select: { companyID: true } });
    created.push(row);
  }

  return {
    americanDream: created[0],
    acme: created[1],
  };
}

export async function seedUser(prisma: PrismaClient, input: {
  username: string;
  companyID: number;
  accountType?: 'Member' | 'Admin' | 'Officer' | 'Employee';
  fName?: string;
  lName?: string;
  password?: string;
}) {
  return prisma.user.create({
    data: {
      username: input.username,
      companyID: input.companyID,
      accountType: input.accountType ?? 'Member',
      fName: input.fName ?? 'Test',
      lName: input.lName ?? 'User',
      password: input.password ?? 'hashed-password',
    },
  });
}

export async function seedBallot(prisma: PrismaClient, input: {
  companyID: number;
  ballotName?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return prisma.ballots.create({
    data: {
      companyID: input.companyID,
      ballotName: input.ballotName ?? 'Integration Ballot',
      description: input.description ?? 'Integration ballot description',
      startDate: input.startDate ?? new Date('2026-01-01T00:00:00.000Z'),
      endDate: input.endDate ?? new Date('2026-12-31T00:00:00.000Z'),
    },
  });
}

export async function seedPosition(prisma: PrismaClient, input: {
  ballotID: number;
  positionName?: string;
  allowedVotes?: number;
  writeIn?: boolean;
}) {
  return prisma.ballotPositions.create({
    data: {
      ballotID: input.ballotID,
      positionName: input.positionName ?? 'President',
      allowedVotes: input.allowedVotes ?? 1,
      writeIn: input.writeIn ?? false,
    },
  });
}
