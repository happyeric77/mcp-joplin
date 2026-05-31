import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import {
  TODO_METADATA_FIELDS,
  assertTodoNote,
  formatTimestamp,
  parseDateToMs,
} from './todoUtils.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the todo note to update'),
  dueAt: z
    .string()
    .describe('Due date/time as an ISO string or millisecond timestamp'),
};

export const registerSetTodoDue = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.tool(
    'set_todo_due',
    'Set the due date on a native Joplin todo note',
    paramsSchema,
    async ({ noteId, dueAt }) => {
      try {
        const note = await context.client.getNote(noteId, TODO_METADATA_FIELDS);
        assertTodoNote(note);

        const dueTimestamp = parseDateToMs(dueAt);
        await context.client.updateNote(noteId, { todo_due: dueTimestamp });

        const responseText = [
          'Todo due date set successfully!',
          '',
          `**Title:** ${note.title}`,
          `**ID:** ${note.id}`,
          `**Due:** ${formatTimestamp(dueTimestamp)}`,
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
    },
  );
};
