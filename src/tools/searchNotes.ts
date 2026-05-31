import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import {
  afterParamSchema,
  firstParamSchema,
  formatPaginationMetadata,
  formatToolError,
  getEndCursor,
  resolvePagination,
} from './pagination.js';
import { formatTodoMetadataLines } from './todoUtils.js';

const DEFAULT_FIRST = 20;

const paramsSchema = {
  query: z.string().describe('Search query string'),
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
      description: 'Search one paginated page of notes by query string',
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
          .map((note) => {
            const metadata = formatTodoMetadataLines(note).join('\n');
            const preview = note.body ? note.body.substring(0, 100) : '';
            return `**${note.title}** (ID: ${note.id})\n${metadata}\nUpdated: ${new Date(note.updated_time).toLocaleString()}\nPreview: ${preview}...`;
          })
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: `${paginationMetadata}\n\n${formattedResults || 'No notes found matching your query.'}`,
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
