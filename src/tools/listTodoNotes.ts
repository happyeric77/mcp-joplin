import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  JoplinApiError,
  type JoplinNote,
  type JoplinNotebook,
} from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import {
  InvalidPaginationError,
  MAX_FIRST,
  afterParamSchema,
  firstParamSchema,
  formatToolError,
} from './pagination.js';
import {
  TODO_LIST_FIELDS,
  TODO_STATUS_VALUES,
  type TodoStatus,
  formatTimestamp,
  formatTodoIcon,
  formatTodoStatus,
  matchesTodoStatus,
} from './todoUtils.js';

const DEFAULT_FIRST = 50;
const DEFAULT_STATUS: TodoStatus = 'open';
const NOTE_SCAN_PAGE_SIZE = 100;
const MAX_SCAN_NOTE_PAGES = 25;
const MAX_CURSOR_LENGTH = 512;

interface ScannerPosition {
  notebookIndex: number;
  notePage: number;
  itemOffset: number;
}

interface TodoCursorPayload extends ScannerPosition {
  limit: number;
  status: TodoStatus;
  includeSubNotebooks: boolean;
  scope: string;
}

interface TodoScanResult {
  items: JoplinNote[];
  hasNextPage: boolean;
  endCursor?: string;
  scannedNotebooks: number;
  scannedNotePages: number;
}

const paramsSchema = {
  notebookId: z
    .string()
    .describe('The ID of the notebook to list todo notes from'),
  includeSubNotebooks: z
    .boolean()
    .optional()
    .describe('Whether to include todo notes from child notebooks'),
  status: z
    .enum(TODO_STATUS_VALUES)
    .optional()
    .describe('Todo status filter (default: open)'),
  first: firstParamSchema(DEFAULT_FIRST),
  after: afterParamSchema,
};

const isValidPositiveInteger = (value: number): boolean =>
  Number.isInteger(value) && value >= 1;

const isValidNonNegativeInteger = (value: number): boolean =>
  Number.isInteger(value) && value >= 0;

const isValidLimit = (value: number): boolean =>
  isValidPositiveInteger(value) && value <= MAX_FIRST;

const isTodoStatus = (value: unknown): value is TodoStatus =>
  value === 'open' || value === 'completed' || value === 'all';

const isTodoCursorPayload = (value: unknown): value is TodoCursorPayload => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.notebookIndex === 'number' &&
    typeof payload.notePage === 'number' &&
    typeof payload.itemOffset === 'number' &&
    typeof payload.limit === 'number' &&
    typeof payload.includeSubNotebooks === 'boolean' &&
    typeof payload.scope === 'string' &&
    payload.scope.length > 0 &&
    isTodoStatus(payload.status) &&
    isValidNonNegativeInteger(payload.notebookIndex) &&
    isValidPositiveInteger(payload.notePage) &&
    isValidNonNegativeInteger(payload.itemOffset) &&
    isValidLimit(payload.limit)
  );
};

const encodeTodoCursor = (cursor: TodoCursorPayload): string =>
  Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');

const decodeTodoCursor = (cursor: string): TodoCursorPayload => {
  if (cursor.length > MAX_CURSOR_LENGTH) {
    throw new InvalidPaginationError(
      'Invalid cursor: use the exact endCursor returned by the previous page.'
    );
  }

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const payload: unknown = JSON.parse(decoded);

    if (!isTodoCursorPayload(payload)) {
      throw new Error('Cursor payload is invalid.');
    }

    return payload;
  } catch {
    throw new InvalidPaginationError(
      'Invalid cursor: use the exact endCursor returned by the previous page.'
    );
  }
};

const validateFirst = (first: number): void => {
  if (!isValidLimit(first)) {
    throw new InvalidPaginationError(
      `first must be an integer between 1 and ${MAX_FIRST}.`
    );
  }
};

const resolveTodoCursor = ({
  first,
  after,
  status,
  includeSubNotebooks,
  scope,
}: {
  first?: number;
  after?: string;
  status: TodoStatus;
  includeSubNotebooks: boolean;
  scope: string;
}): TodoCursorPayload => {
  validateFirst(DEFAULT_FIRST);

  if (first !== undefined) {
    validateFirst(first);
  }

  if (after !== undefined && after !== '') {
    const cursor = decodeTodoCursor(after);
    if (cursor.scope !== scope) {
      throw new InvalidPaginationError(
        'Invalid pagination request: cursor does not match the current request parameters.'
      );
    }

    if (first !== undefined && first !== cursor.limit) {
      throw new InvalidPaginationError(
        'Invalid pagination request: when after is provided, omit first or use the same first value as the original page.'
      );
    }

    if (
      cursor.status !== status ||
      cursor.includeSubNotebooks !== includeSubNotebooks
    ) {
      throw new InvalidPaginationError(
        'Invalid pagination request: cursor does not match the current todo filters.'
      );
    }

    return cursor;
  }

  return {
    notebookIndex: 0,
    notePage: 1,
    itemOffset: 0,
    limit: first ?? DEFAULT_FIRST,
    status,
    includeSubNotebooks,
    scope,
  };
};

const collectNotebookIds = (notebook: JoplinNotebook): string[] => [
  notebook.id,
  ...(notebook.children ?? []).flatMap(collectNotebookIds),
];

const findNotebookIds = (
  notebooks: JoplinNotebook[],
  notebookId: string
): string[] | undefined => {
  for (const notebook of notebooks) {
    if (notebook.id === notebookId) {
      return collectNotebookIds(notebook);
    }

    const childMatch = findNotebookIds(notebook.children ?? [], notebookId);
    if (childMatch) {
      return childMatch;
    }
  }

  return undefined;
};

const resolveNotebookIds = async (
  context: JoplinMcpContext,
  notebookId: string,
  includeSubNotebooks: boolean
): Promise<string[]> => {
  if (!includeSubNotebooks) {
    return [notebookId];
  }

  const notebookTree = await context.client.getNotebookTree();
  const notebookIds = findNotebookIds(notebookTree, notebookId);
  if (!notebookIds) {
    throw new Error(`Notebook with ID ${notebookId} not found.`);
  }

  return notebookIds;
};

const getNextPositionAfterPage = (
  page: { has_more: boolean },
  position: ScannerPosition,
  notebookCount: number
): ScannerPosition | undefined => {
  if (page.has_more) {
    return {
      notebookIndex: position.notebookIndex,
      notePage: position.notePage + 1,
      itemOffset: 0,
    };
  }

  const nextNotebookIndex = position.notebookIndex + 1;
  if (nextNotebookIndex >= notebookCount) {
    return undefined;
  }

  return {
    notebookIndex: nextNotebookIndex,
    notePage: 1,
    itemOffset: 0,
  };
};

const getNextPositionAfterItem = (
  itemIndex: number,
  page: { items: JoplinNote[]; has_more: boolean },
  position: ScannerPosition,
  notebookCount: number
): ScannerPosition | undefined => {
  const nextItemOffset = itemIndex + 1;
  if (nextItemOffset < page.items.length) {
    return {
      notebookIndex: position.notebookIndex,
      notePage: position.notePage,
      itemOffset: nextItemOffset,
    };
  }

  return getNextPositionAfterPage(page, position, notebookCount);
};

const scanTodoNotes = async (
  context: JoplinMcpContext,
  notebookIds: string[],
  cursor: TodoCursorPayload
): Promise<TodoScanResult> => {
  const items: JoplinNote[] = [];
  const scannedNotebookIndexes = new Set<number>();
  let scannedNotePages = 0;
  let position: ScannerPosition | undefined = {
    notebookIndex: cursor.notebookIndex,
    notePage: cursor.notePage,
    itemOffset: cursor.itemOffset,
  };

  while (
    position &&
    items.length < cursor.limit &&
    scannedNotePages < MAX_SCAN_NOTE_PAGES
  ) {
    const notebookId = notebookIds[position.notebookIndex];
    if (!notebookId) {
      position = undefined;
      break;
    }

    const page = await context.client.getNotesInNotebook(notebookId, {
      fields: TODO_LIST_FIELDS,
      page: position.notePage,
      limit: NOTE_SCAN_PAGE_SIZE,
    });
    scannedNotebookIndexes.add(position.notebookIndex);
    scannedNotePages += 1;

    let nextPosition: ScannerPosition | undefined;
    for (let index = position.itemOffset; index < page.items.length; index++) {
      const note = page.items[index];
      if (matchesTodoStatus(note, cursor.status)) {
        items.push(note);
        if (items.length === cursor.limit) {
          nextPosition = getNextPositionAfterItem(
            index,
            page,
            position,
            notebookIds.length
          );
          break;
        }
      }
    }

    if (items.length === cursor.limit) {
      return {
        items,
        hasNextPage: nextPosition !== undefined,
        endCursor: nextPosition
          ? encodeTodoCursor({ ...cursor, ...nextPosition })
          : undefined,
        scannedNotebooks: scannedNotebookIndexes.size,
        scannedNotePages,
      };
    }

    position = getNextPositionAfterPage(page, position, notebookIds.length);
  }

  return {
    items,
    hasNextPage: position !== undefined,
    endCursor: position
      ? encodeTodoCursor({ ...cursor, ...position })
      : undefined,
    scannedNotebooks: scannedNotebookIndexes.size,
    scannedNotePages,
  };
};

const formatScanPaginationMetadata = ({
  returnedCount,
  pageSize,
  hasNextPage,
  endCursor,
  scannedNotebooks,
  scannedNotePages,
}: {
  returnedCount: number;
  pageSize: number;
  hasNextPage: boolean;
  endCursor?: string;
  scannedNotebooks: number;
  scannedNotePages: number;
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

  lines.push(
    `- scannedNotebooks: ${scannedNotebooks}`,
    `- scannedNotePages: ${scannedNotePages}`
  );

  if (hasNextPage && endCursor) {
    lines.push(
      '',
      `⚠️ Result is incomplete. Continue with after=${endCursor} before concluding coverage.`
    );
  }

  return lines.join('\n');
};

const formatTodoNote = (note: JoplinNote): string =>
  [
    `**${formatTodoIcon(note)} ${note.title}** (ID: ${note.id})`,
    `Status: ${formatTodoStatus(note)}`,
    `Due: ${formatTimestamp(note.todo_due)}`,
    `Completed: ${formatTimestamp(note.todo_completed)}`,
    `Updated: ${new Date(note.updated_time).toLocaleString()}`,
  ].join('\n');

export const registerListTodoNotes = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'list_todo_notes',
    'List one paginated page of native Joplin todo notes in a specific notebook',
    paramsSchema,
    async ({ notebookId, includeSubNotebooks, status, first, after }) => {
      const includeChildren = includeSubNotebooks ?? false;
      const todoStatus = status ?? DEFAULT_STATUS;
      const scope = `list_todo_notes:${notebookId}:${includeChildren}:${todoStatus}`;

      try {
        const cursor = resolveTodoCursor({
          first,
          after,
          status: todoStatus,
          includeSubNotebooks: includeChildren,
          scope,
        });
        const notebookIds = await resolveNotebookIds(
          context,
          notebookId,
          includeChildren
        );
        const result = await scanTodoNotes(context, notebookIds, cursor);

        const paginationMetadata = formatScanPaginationMetadata({
          returnedCount: result.items.length,
          pageSize: cursor.limit,
          hasNextPage: result.hasNextPage,
          endCursor: result.endCursor,
          scannedNotebooks: result.scannedNotebooks,
          scannedNotePages: result.scannedNotePages,
        });

        const formattedList = result.items
          .map(formatTodoNote)
          .join('\n\n---\n\n');
        const outputText = `${paginationMetadata}\n\n${formattedList || 'No todo notes found in this notebook scope.'}`;

        return {
          content: [
            {
              type: 'text' as const,
              text: outputText,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text:
                error instanceof JoplinApiError
                  ? `Joplin API Error: ${error.message}`
                  : formatToolError(error),
            },
          ],
        };
      }
    }
  );
};
