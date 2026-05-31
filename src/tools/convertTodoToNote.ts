import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { getTodoMetadataNote, updateTodoMetadata } from './todoUtils.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the todo note to convert'),
};

export const registerConvertTodoToNote = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.tool(
    'convert_todo_to_note',
    'Convert a native Joplin todo note back into a regular note',
    paramsSchema,
    async ({ noteId }) => {
      try {
        const note = await getTodoMetadataNote(context, noteId);

        await updateTodoMetadata(context, noteId, {
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

        return textResponse(responseText);
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
