import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { JoplinMcpContext } from '../context.js';
import { JoplinApiError } from '../joplin-client.js';

export const registerSearchNotebooks = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'search_notebooks',
    'Search for notebooks by name',
    {
      query: z.string().describe('Search query string for notebook names'),
    },
    async ({ query }) => {
      try {
        const allNotebooks = await context.client.getNotebooks();
        const queryLower = query.toLowerCase();

        const matchingNotebooks = allNotebooks.filter(notebook =>
          notebook.title.toLowerCase().includes(queryLower)
        );

        const formattedResults = matchingNotebooks
          .map(
            notebook =>
              `**${notebook.title}** (ID: ${notebook.id})\nCreated: ${new Date(notebook.created_time).toLocaleString()}`
          )
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text:
                formattedResults || 'No notebooks found matching your query.',
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
                  : `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
};
