import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import { TODO_METADATA_FIELDS, assertTodoNote } from './todoUtils.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the todo note to reopen'),
};

export const registerReopenTodoNote = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'reopen_todo_note',
    'Reopen a completed native Joplin todo note',
    paramsSchema,
    async ({ noteId }) => {
      try {
        const note = await context.client.getNote(noteId, TODO_METADATA_FIELDS);
        assertTodoNote(note);

        await context.client.updateNote(noteId, { todo_completed: 0 });

        const responseText = [
          'Todo note reopened successfully!',
          '',
          `**Title:** ${note.title}`,
          `**ID:** ${note.id}`,
        ].join('\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: responseText,
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
