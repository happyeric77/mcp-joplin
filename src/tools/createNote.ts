import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { JoplinMcpContext } from '../context.js';
import { JoplinApiError } from '../joplin-client.js';

const paramsSchema = {
  title: z.string().describe('The title of the new note'),
  body: z.string().describe('The content of the new note (Markdown format)'),
  notebookId: z
    .string()
    .optional()
    .describe('The ID of the notebook to create the note in (optional)'),
};

export const registerCreateNote = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'create_note',
    'Create a new note in Joplin',
    paramsSchema,
    async ({ title, body, notebookId }) => {
      try {
        const noteData: Record<string, unknown> = { title, body };
        if (notebookId) {
          noteData.parent_id = notebookId;
        }

        const note = await context.client.createNote(noteData);

        return {
          content: [
            {
              type: 'text' as const,
              text: `Note created successfully!\n\n**Title:** ${note.title}\n**ID:** ${note.id}\n**Created:** ${new Date(note.created_time).toLocaleString()}`,
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
