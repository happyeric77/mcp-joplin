import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { formatNoteSearchResult } from './formatters.js';
import {
  afterParamSchema,
  firstParamSchema,
  formatPaginationMetadata,
  getEndCursor,
  resolvePagination,
} from './pagination.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

const DEFAULT_FIRST = 20;

const paramsSchema = {
  query: z
    .string()
    .describe(
      'Search query string. Joplin uses SQLite FTS4 which tokenizes on non-alphanumeric characters including emoji — avoid prefixing queries with emoji or special characters. Search by keywords rather than exact title strings for best results.',
    ),
  first: firstParamSchema(DEFAULT_FIRST),
  after: afterParamSchema,
};

export const registerSearchNotes = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'search_notes',
    {
      description:
        'Search one paginated page of notes. Uses SQLite FTS4 which tokenizes on non-alphanumeric characters including emoji — search by keywords for best results, not exact title strings.',
      inputSchema: paramsSchema,
    },
    async ({ query, first, after }) => {
      try {
        const pagination = resolvePagination({
          first,
          after,
          defaultFirst: DEFAULT_FIRST,
          scope: `search_notes:${query}`,
        });
        const results = await context.client.search(
          query,
          'note',
          'id,title,body,parent_id,updated_time,is_todo,todo_due,todo_completed',
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
          .map(formatNoteSearchResult)
          .join('\n\n---\n\n');

        return textResponse(
          `${paginationMetadata}\n\n${formattedResults || 'No notes found matching your query.'}`,
        );
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
