import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import {
  formatTimestamp,
  getTodoMetadataNote,
  parseDateToMs,
  updateTodoMetadata,
} from './todoUtils.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the todo note to complete'),
  completedAt: z
    .string()
    .optional()
    .describe(
      'Optional completion date/time as an ISO string or millisecond timestamp; defaults to now',
    ),
};

export const registerCompleteTodoNote = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.tool(
    'complete_todo_note',
    'Mark a native Joplin todo note as completed',
    paramsSchema,
    async ({ noteId, completedAt }) => {
      try {
        const note = await getTodoMetadataNote(context, noteId);

        const completedTimestamp = completedAt
          ? parseDateToMs(completedAt)
          : Date.now();
        await updateTodoMetadata(context, noteId, {
          todo_completed: completedTimestamp,
        });

        const responseText = [
          'Todo note completed successfully!',
          '',
          `**Title:** ${note.title}`,
          `**ID:** ${note.id}`,
          `**Completed:** ${formatTimestamp(completedTimestamp)}`,
        ].join('\n');

        return textResponse(responseText);
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
