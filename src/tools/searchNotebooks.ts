import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { formatNotebookSummary } from './formatters.js';
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
      'Search query string for notebook names. Joplin folder search uses * as a wildcard. If the query does not already contain *, it is automatically wrapped as *query* for substring matching.',
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
        'Search one paginated page of notebooks by name using Joplin folder search syntax. Queries without * are automatically wrapped as *query* for substring matching. Use explicit * to control wildcard position, e.g. archive*.',
      inputSchema: paramsSchema,
    },
    async ({ query, first, after }) => {
      try {
        const effectiveQuery = query.includes('*') ? query : `*${query}*`;
        const pagination = resolvePagination({
          first,
          after,
          defaultFirst: DEFAULT_FIRST,
          scope: `search_notebooks:${effectiveQuery}`,
        });
        const results = await context.client.search(
          effectiveQuery,
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
          .map(formatNotebookSummary)
          .join('\n\n---\n\n');

        return textResponse(
          `${paginationMetadata}\n\n${formattedResults || 'No notebooks found matching your query.'}`,
        );
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
