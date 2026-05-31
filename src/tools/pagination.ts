import { z } from 'zod';

export const MAX_FIRST = 100;
const MAX_CURSOR_LENGTH = 512;

interface CursorPayload {
  page: number;
  limit: number;
  scope: string;
}

interface ResolvePaginationOptions {
  first?: number;
  after?: string;
  defaultFirst: number;
  scope: string;
}

export interface ResolvedPagination {
  page: number;
  limit: number;
  scope: string;
}

export class InvalidPaginationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaginationError';
  }
}

export const firstParamSchema = (defaultFirst: number) =>
  z
    .number()
    .int()
    .min(1)
    .max(MAX_FIRST)
    .optional()
    .describe(
      `Maximum number of results to return for this page (default: ${defaultFirst}, max: ${MAX_FIRST}); this never means all results`,
    );

export const afterParamSchema = z
  .string()
  .max(MAX_CURSOR_LENGTH)
  .optional()
  .describe('Opaque pagination cursor from the previous page endCursor');

const isValidPageNumber = (value: number): boolean =>
  Number.isInteger(value) && value >= 1;

const isValidLimit = (value: number): boolean =>
  Number.isInteger(value) && value >= 1 && value <= MAX_FIRST;

const isCursorPayload = (value: unknown): value is CursorPayload => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.page === 'number' &&
    typeof payload.limit === 'number' &&
    typeof payload.scope === 'string' &&
    payload.scope.length > 0 &&
    isValidPageNumber(payload.page) &&
    isValidLimit(payload.limit)
  );
};

const validateFirst = (first: number): void => {
  if (!isValidLimit(first)) {
    throw new InvalidPaginationError(
      `first must be an integer between 1 and ${MAX_FIRST}.`,
    );
  }
};

export const encodeCursor = (pagination: ResolvedPagination): string => {
  const payload: CursorPayload = {
    page: pagination.page,
    limit: pagination.limit,
    scope: pagination.scope,
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
};

const decodeCursor = (cursor: string): CursorPayload => {
  if (cursor.length > MAX_CURSOR_LENGTH) {
    throw new InvalidPaginationError(
      'Invalid cursor: use the exact endCursor returned by the previous page.',
    );
  }

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const payload: unknown = JSON.parse(decoded);

    if (!isCursorPayload(payload)) {
      throw new Error('Cursor payload is invalid.');
    }

    return payload;
  } catch {
    throw new InvalidPaginationError(
      'Invalid cursor: use the exact endCursor returned by the previous page.',
    );
  }
};

export const resolvePagination = ({
  first,
  after,
  defaultFirst,
  scope,
}: ResolvePaginationOptions): ResolvedPagination => {
  validateFirst(defaultFirst);

  if (first !== undefined) {
    validateFirst(first);
  }

  if (after !== undefined && after !== '') {
    const cursor = decodeCursor(after);
    if (cursor.scope !== scope) {
      throw new InvalidPaginationError(
        'Invalid pagination request: cursor does not match the current request parameters.',
      );
    }

    if (first !== undefined && first !== cursor.limit) {
      throw new InvalidPaginationError(
        'Invalid pagination request: when after is provided, omit first or use the same first value as the original page.',
      );
    }

    return cursor;
  }

  return {
    page: 1,
    limit: first ?? defaultFirst,
    scope,
  };
};

export const getEndCursor = (
  pagination: ResolvedPagination,
  hasNextPage: boolean,
): string | undefined => {
  if (!hasNextPage) {
    return undefined;
  }

  return encodeCursor({
    page: pagination.page + 1,
    limit: pagination.limit,
    scope: pagination.scope,
  });
};

export const formatPaginationMetadata = ({
  returnedCount,
  pageSize,
  hasNextPage,
  endCursor,
}: {
  returnedCount: number;
  pageSize: number;
  hasNextPage: boolean;
  endCursor?: string;
}): string => {
  const lines = [
    'pageInfo:',
    `- returnedCount: ${returnedCount}`,
    `- pageSize: ${pageSize}`,
    `- hasNextPage: ${hasNextPage ? 'true' : 'false'}`,
  ];

  if (endCursor) {
    lines.push(`- endCursor: ${endCursor}`);
  }

  if (hasNextPage && endCursor) {
    lines.push(
      '',
      `⚠️ Result is incomplete. Continue with after=${endCursor} before concluding coverage.`,
    );
  }

  return lines.join('\n');
};

export const formatToolError = (error: unknown): string =>
  error instanceof InvalidPaginationError
    ? `Pagination Error: ${error.message}`
    : `Error: ${error instanceof Error ? error.message : String(error)}`;
