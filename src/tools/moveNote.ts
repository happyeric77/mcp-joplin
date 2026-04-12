import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { JoplinMcpContext } from '../context.js';
import { JoplinApiError } from '../joplin-client.js';

export const registerMoveNote = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'move_note',
    'Move a note to a different notebook',
    {
      noteId: z.string().describe('The ID of the note to move'),
      targetNotebookId: z.string().describe('The ID of the target notebook'),
    },
    async ({ noteId, targetNotebookId }) => {
      try {
        await context.client.updateNote(noteId, {
          parent_id: targetNotebookId,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Note moved successfully to notebook ${targetNotebookId}.`,
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
