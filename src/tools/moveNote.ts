import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

export const registerMoveNote = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'move_note',
    {
      description: 'Move a note to a different notebook',
      inputSchema: {
        noteId: z.string().describe('The ID of the note to move'),
        targetNotebookId: z.string().describe('The ID of the target notebook'),
      },
    },
    async ({ noteId, targetNotebookId }) => {
      try {
        await context.client.updateNote(noteId, {
          parent_id: targetNotebookId,
        });

        return textResponse(
          `Note moved successfully to notebook ${targetNotebookId}.`,
        );
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
