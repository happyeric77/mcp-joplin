import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { JoplinMcpContext } from '../context.js';
import { JoplinApiError } from '../joplin-client.js';

const paramsSchema = {
  query: z.string().describe('Search query string'),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of results to return (default: 20)'),
};

export const registerSearchNotes = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'search_notes',
    'Search for notes by query string',
    paramsSchema,
    async ({ query, limit: rawLimit }) => {
      const limit = rawLimit ?? 20;
      try {
        const results = await context.client.search(
          query,
          'note',
          'id,title,body,parent_id,updated_time'
        );
        const notes = results.items.slice(0, limit);

        const formattedResults = notes
          .map(
            note =>
              `**${note.title}** (ID: ${note.id})\nUpdated: ${new Date(note.updated_time).toLocaleString()}\nPreview: ${'body' in note && note.body ? note.body.substring(0, 100) : ''}...`
          )
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: formattedResults || 'No notes found matching your query.',
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
