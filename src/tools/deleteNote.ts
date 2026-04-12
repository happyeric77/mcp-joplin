import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

export const registerDeleteNote = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'delete_note',
    'Delete a note from Joplin',
    {
      noteId: z.string().describe('The ID of the note to delete'),
      permanent: z
        .boolean()
        .default(false)
        .describe(
          'Whether to permanently delete the note (default: false, moves to trash)'
        ),
    },
    async ({ noteId, permanent }) => {
      try {
        await context.client.deleteNote(noteId, permanent);

        const action = permanent ? 'permanently deleted' : 'moved to trash';
        return {
          content: [
            { type: 'text' as const, text: `Note ${action} successfully.` },
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
