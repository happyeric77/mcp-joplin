import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError, JoplinNote } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

const paramsSchema = {
  notebookId: z.string().describe('The ID of the notebook to list notes from'),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of results to return (default: 50)'),
};

export const registerListNotes = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'list_notes',
    'List notes in a specific notebook',
    paramsSchema,
    async ({ notebookId, limit: rawLimit }) => {
      const limit = rawLimit ?? 50;
      try {
        const results = await context.client.getNotesInNotebook(notebookId, {
          fields: 'id,title,updated_time,is_todo,todo_completed',
          limit,
        });

        const notes = results.items as JoplinNote[];
        const formattedList = notes
          .slice(0, limit)
          .map(note => {
            const todoStatus = note.is_todo
              ? note.todo_completed
                ? ' ✅'
                : ' ☐'
              : '';
            return `**${note.title}**${todoStatus} (ID: ${note.id})\nUpdated: ${new Date(note.updated_time).toLocaleString()}`;
          })
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: formattedList || 'No notes found in this notebook.',
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
