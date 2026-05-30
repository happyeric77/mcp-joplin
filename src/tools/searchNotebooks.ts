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

const DEFAULT_FIRST = 20;

const paramsSchema = {
  query: z
    .string()
    .describe(
      'Search query string for notebook names. Joplin folder search uses * as a wildcard; use archive* for prefix matches like archive-250124.',
    ),
  first: firstParamSchema(DEFAULT_FIRST),
  after: afterParamSchema,
};

export const registerSearchNotebooks = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'search_notebooks',
    {
      description:
        'Search one paginated page of notebooks by name using Joplin folder search syntax. Use * for wildcard/prefix matches, e.g. archive*.',
      inputSchema: paramsSchema,
    },
    async ({ query, first, after }) => {
      try {
        const pagination = resolvePagination({
          first,
          after,
          defaultFirst: DEFAULT_FIRST,
          scope: `search_notebooks:${query}`,
        });
        const results = await context.client.search(
          query,
          'folder',
          'id,title,created_time,updated_time,parent_id',
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
          .map(
            (notebook) =>
              `**${notebook.title}** (ID: ${notebook.id})\nCreated: ${new Date(notebook.created_time).toLocaleString()}`,
          )
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: `${paginationMetadata}\n\n${formattedResults || 'No notebooks found matching your query.'}`,
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
