import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { getTodoMetadataNote, updateTodoMetadata } from './todoUtils.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the todo note to update'),
};

export const registerClearTodoDue = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.tool(
    'clear_todo_due',
    'Clear the due date on a native Joplin todo note',
    paramsSchema,
    async ({ noteId }) => {
      try {
        const note = await getTodoMetadataNote(context, noteId);

        await updateTodoMetadata(context, noteId, { todo_due: 0 });

        const responseText = [
          'Todo due date cleared successfully!',
          '',
          `**Title:** ${note.title}`,
          `**ID:** ${note.id}`,
        ].join('\n');

        return textResponse(responseText);
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
