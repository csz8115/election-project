type QueryOperation =
  | 'findMany'
  | 'findUnique'
  | 'create'
  | 'update'
  | 'delete'
  | 'raw'
  | 'other';

type QuerySample = {
  model: string;
  operation: QueryOperation;
  durationMs: number;
  timestamp: string;
  success: boolean;
};

type OperationAggregate = {
  model: string;
  operation: QueryOperation;
  averageDurationMs: number;
  count: number;
};

const MAX_RECENT_QUERIES = 500;
const MAX_SLOW_QUERIES = 100;
const SLOW_QUERY_THRESHOLD_MS = 250;

const state: {
  totalQueries: number;
  totalDurationMs: number;
  slowestQueryDurationMs: number;
  queryErrors: number;
  queriesByOperation: Record<QueryOperation, number>;
  operationAggs: Map<string, { model: string; operation: QueryOperation; count: number; totalDurationMs: number }>;
  recentSlowQueries: QuerySample[];
} = {
  totalQueries: 0,
  totalDurationMs: 0,
  slowestQueryDurationMs: 0,
  queryErrors: 0,
  queriesByOperation: {
    findMany: 0,
    findUnique: 0,
    create: 0,
    update: 0,
    delete: 0,
    raw: 0,
    other: 0,
  },
  operationAggs: new Map(),
  recentSlowQueries: [],
};

function resetState(): void {
  state.totalQueries = 0;
  state.totalDurationMs = 0;
  state.slowestQueryDurationMs = 0;
  state.queryErrors = 0;
  state.queriesByOperation = {
    findMany: 0,
    findUnique: 0,
    create: 0,
    update: 0,
    delete: 0,
    raw: 0,
    other: 0,
  };
  state.operationAggs = new Map();
  state.recentSlowQueries = [];
}

function normalizeOperation(action?: string): QueryOperation {
  if (!action) return 'other';
  if (action === 'findMany') return 'findMany';
  if (action === 'findUnique' || action === 'findUniqueOrThrow') return 'findUnique';
  if (action.startsWith('create')) return 'create';
  if (action.startsWith('update') || action.startsWith('upsert')) return 'update';
  if (action.startsWith('delete')) return 'delete';
  if (action.includes('Raw') || action === '$queryRaw' || action === '$executeRaw') return 'raw';
  return 'other';
}

function pushSlowQuery(sample: QuerySample): void {
  state.recentSlowQueries.push(sample);
  if (state.recentSlowQueries.length > MAX_SLOW_QUERIES) {
    state.recentSlowQueries.shift();
  }
}

export function recordQueryStat(input: {
  model?: string;
  action?: string;
  durationMs: number;
  success: boolean;
}): void {
  const operation = normalizeOperation(input.action);
  const model = input.model ?? 'raw';
  const durationMs = Number.isFinite(input.durationMs) ? Math.max(0, input.durationMs) : 0;

  state.totalQueries += 1;
  state.totalDurationMs += durationMs;
  state.slowestQueryDurationMs = Math.max(state.slowestQueryDurationMs, durationMs);
  state.queriesByOperation[operation] += 1;

  if (!input.success) {
    state.queryErrors += 1;
  }

  const opKey = `${model}:${operation}`;
  const existing = state.operationAggs.get(opKey);
  if (existing) {
    existing.count += 1;
    existing.totalDurationMs += durationMs;
  } else {
    state.operationAggs.set(opKey, {
      model,
      operation,
      count: 1,
      totalDurationMs: durationMs,
    });
  }

  if (durationMs >= SLOW_QUERY_THRESHOLD_MS || !input.success) {
    pushSlowQuery({
      model,
      operation,
      durationMs,
      timestamp: new Date().toISOString(),
      success: input.success,
    });
  }
}

export function getQueryStatsSnapshot(): {
  totalQueries: number;
  averageQueryDurationMs: number;
  slowestQueryDurationMs: number;
  queryErrors: number;
  queriesByOperation: {
    findMany: number;
    findUnique: number;
    create: number;
    update: number;
    delete: number;
    raw: number;
  };
  slowestOperations: OperationAggregate[];
  recentSlowQueries: Array<{
    model: string;
    operation: QueryOperation;
    durationMs: number;
    timestamp: string;
  }>;
} {
  const averageQueryDurationMs =
    state.totalQueries > 0 ? state.totalDurationMs / state.totalQueries : 0;

  const slowestOperations: OperationAggregate[] = Array.from(state.operationAggs.values())
    .map((entry) => ({
      model: entry.model,
      operation: entry.operation,
      averageDurationMs: entry.count > 0 ? entry.totalDurationMs / entry.count : 0,
      count: entry.count,
    }))
    .sort((a, b) => b.averageDurationMs - a.averageDurationMs)
    .slice(0, 10);

  const boundedSlowQueries = state.recentSlowQueries
    .slice(-MAX_RECENT_QUERIES)
    .map(({ model, operation, durationMs, timestamp }) => ({
      model,
      operation,
      durationMs,
      timestamp,
    }))
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 20);

  return {
    totalQueries: state.totalQueries,
    averageQueryDurationMs,
    slowestQueryDurationMs: state.slowestQueryDurationMs,
    queryErrors: state.queryErrors,
    queriesByOperation: {
      findMany: state.queriesByOperation.findMany,
      findUnique: state.queriesByOperation.findUnique,
      create: state.queriesByOperation.create,
      update: state.queriesByOperation.update,
      delete: state.queriesByOperation.delete,
      raw: state.queriesByOperation.raw,
    },
    slowestOperations,
    recentSlowQueries: boundedSlowQueries,
  };
}

// Test-only helper to isolate unit tests.
export function __resetQueryStatsForTests(): void {
  resetState();
}
