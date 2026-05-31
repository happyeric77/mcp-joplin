import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import {
  TODO_METADATA_FIELDS,
  assertTodoNote,
  formatTimestamp,
  parseDateToMs,
} from './todoUtils.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the todo note to complete'),
  completedAt: z
    .string()
    .optional()
    .describe(
      'Optional completion date/time as an ISO string or millisecond timestamp; defaults to now'
    ),
};

export const registerCompleteTodoNote = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'complete_todo_note',
    'Mark a native Joplin todo note as completed',
    paramsSchema,
    async ({ noteId, completedAt }) => {
      try {
        const note = await context.client.getNote(noteId, TODO_METADATA_FIELDS);
        assertTodoNote(note);

        const completedTimestamp = completedAt
          ? parseDateToMs(completedAt)
          : Date.now();
        await context.client.updateNote(noteId, {
          todo_completed: completedTimestamp,
        });

        const responseText = [
          'Todo note completed successfully!',
          '',
          `**Title:** ${note.title}`,
          `**ID:** ${note.id}`,
          `**Completed:** ${formatTimestamp(completedTimestamp)}`,
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
