import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import { TODO_METADATA_FIELDS, assertTodoNote } from './todoUtils.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the todo note to convert'),
};

export const registerConvertTodoToNote = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'convert_todo_to_note',
    'Convert a native Joplin todo note back into a regular note',
    paramsSchema,
    async ({ noteId }) => {
      try {
        const note = await context.client.getNote(noteId, TODO_METADATA_FIELDS);
        assertTodoNote(note);

        await context.client.updateNote(noteId, {
          is_todo: 0,
          todo_due: 0,
          todo_completed: 0,
        });

        const responseText = [
          'Todo note converted to regular note successfully!',
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
