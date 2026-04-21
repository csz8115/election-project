import { execSync } from 'node:child_process';
import type { PrismaClient } from '@prisma/client';

const DB_DEBUG = process.env.INTEGRATION_DB_DEBUG === '1';

export function requireTestDatabaseUrl(): string {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) {
    throw new Error('DATABASE_URL_TEST is required for integration repository tests');
  }
  return url;
}

export function applyMigrations(databaseUrl: string): void {
  try {
    if (DB_DEBUG) {
      console.log(`[integration-db] prisma migrate deploy on DATABASE_URL=${databaseUrl}`);
    }

    execSync('npx prisma migrate deploy', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        PRISMA_HIDE_UPDATE_MESSAGE: '1',
        PRISMA_HIDE_UPDATE_NOTIFIER: '1',
      },
    });
  } catch (error) {
    if (error instanceof Error && 'stderr' in error) {
      const stderr = String((error as { stderr?: Buffer | string }).stderr ?? '');
      if (stderr.trim()) {
        process.stderr.write(stderr);
      }
    }
    throw error;
  }
}

export async function assertExpectedSchema(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `;

  const names = new Set(rows.map((row) => row.tablename));
  const required = ['company', 'user', 'ballots', 'candidate', 'ballotPositions'];

  for (const table of required) {
    if (!names.has(table)) {
      throw new Error(`Schema assumption failed: missing table '${table}'`);
    }
  }
}

export async function resetPublicSchema(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
  `;

  if (tables.length === 0) {
    throw new Error('No public tables found to reset');
  }

  const tableList = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
}
