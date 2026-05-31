import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import {
  TODO_METADATA_FIELDS,
  assertRegularNote,
  formatTimestamp,
  formatTodoStatus,
  parseDateToMs,
} from './todoUtils.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the regular note to convert'),
  dueAt: z
    .string()
    .optional()
    .describe(
      'Optional due date/time as an ISO string or millisecond timestamp',
    ),
  completedAt: z
    .string()
    .optional()
    .describe(
      'Optional completion date/time as an ISO string or millisecond timestamp',
    ),
};

export const registerConvertNoteToTodo = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.tool(
    'convert_note_to_todo',
    'Convert a regular Joplin note into a native todo note',
    paramsSchema,
    async ({ noteId, dueAt, completedAt }) => {
      try {
        const note = await context.client.getNote(noteId, TODO_METADATA_FIELDS);
        assertRegularNote(note);

        const todo_due = dueAt ? parseDateToMs(dueAt) : 0;
        const todo_completed = completedAt ? parseDateToMs(completedAt) : 0;
        await context.client.updateNote(noteId, {
          is_todo: 1,
          todo_due,
          todo_completed,
        });

        const responseText = [
          'Note converted to todo successfully!',
          '',
          `**Title:** ${note.title}`,
          `**ID:** ${note.id}`,
          `**Status:** ${formatTodoStatus({
            is_todo: 1,
            todo_completed,
          })}`,
          `**Due:** ${formatTimestamp(todo_due)}`,
          `**Completed:** ${formatTimestamp(todo_completed)}`,
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
