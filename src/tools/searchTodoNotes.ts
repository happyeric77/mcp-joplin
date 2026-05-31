import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { JoplinApiError, type JoplinNote } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import {
  afterParamSchema,
  firstParamSchema,
  formatPaginationMetadata,
  formatToolError,
  getEndCursor,
  resolvePagination,
} from './pagination.js';
import {
  TODO_NOTE_FIELDS,
  TODO_STATUS_VALUES,
  type TodoStatus,
  formatTimestamp,
  formatTodoIcon,
  formatTodoStatus,
} from './todoUtils.js';

const DEFAULT_FIRST = 20;
const DEFAULT_STATUS: TodoStatus = 'open';

const paramsSchema = {
  query: z.string().optional().describe('Optional global search query string'),
  status: z
    .enum(TODO_STATUS_VALUES)
    .optional()
    .describe('Todo status filter (default: open)'),
  first: firstParamSchema(DEFAULT_FIRST),
  after: afterParamSchema,
};

const buildTodoSearchQuery = (
  query: string | undefined,
  status: TodoStatus,
): string => {
  const terms: string[] = [];
  const trimmedQuery = query?.trim();
  if (trimmedQuery) {
    terms.push(trimmedQuery);
  }

  terms.push('type:todo');
  if (status === 'open') {
    terms.push('iscompleted:0');
  } else if (status === 'completed') {
    terms.push('iscompleted:1');
  }

  return terms.join(' ');
};

const formatTodoSearchResult = (note: JoplinNote): string => {
  const preview = note.body ? note.body.substring(0, 100) : '';
  return [
    `**${formatTodoIcon(note)} ${note.title}** (ID: ${note.id})`,
    `Status: ${formatTodoStatus(note)}`,
    `Due: ${formatTimestamp(note.todo_due)}`,
    `Completed: ${formatTimestamp(note.todo_completed)}`,
    `Updated: ${new Date(note.updated_time).toLocaleString()}`,
    `Preview: ${preview}...`,
  ].join('\n');
};

export const registerSearchTodoNotes = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.tool(
    'search_todo_notes',
    'Search one paginated page of native Joplin todo notes globally',
    paramsSchema,
    async ({ query, status, first, after }) => {
      try {
        const todoStatus = status ?? DEFAULT_STATUS;
        const searchQuery = buildTodoSearchQuery(query, todoStatus);
        const pagination = resolvePagination({
          first,
          after,
          defaultFirst: DEFAULT_FIRST,
          scope: `search_todo_notes:${searchQuery}`,
        });
        const results = await context.client.search(
          searchQuery,
          'note',
          TODO_NOTE_FIELDS,
          {
            page: pagination.page,
            limit: pagination.limit,
          },
        );

        const endCursor = getEndCursor(pagination, results.has_more);
        const paginationMetadata = formatPaginationMetadata({
          returnedCount: results.items.length,
          pageSize: pagination.limit,
          hasNextPage: results.has_more,
          endCursor,
        });

        const formattedResults = results.items
          .map(formatTodoSearchResult)
          .join('\n\n---\n\n');
        const outputText = `${paginationMetadata}\n\n${formattedResults || 'No todo notes found matching your query.'}`;

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
    },
  );
};
