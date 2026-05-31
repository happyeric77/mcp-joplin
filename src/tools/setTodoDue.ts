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
        const note = await getTodoMetadataNote(context, noteId);

        const dueTimestamp = parseDateToMs(dueAt);
        await updateTodoMetadata(context, noteId, { todo_due: dueTimestamp });

        const responseText = [
          'Todo due date set successfully!',
          '',
          `**Title:** ${note.title}`,
          `**ID:** ${note.id}`,
          `**Due:** ${formatTimestamp(dueTimestamp)}`,
        ].join('\n');

        return textResponse(responseText);
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
