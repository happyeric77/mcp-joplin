import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

export const registerDeleteNote = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'delete_note',
    {
      description: 'Delete a note from Joplin',
      inputSchema: {
        noteId: z.string().describe('The ID of the note to delete'),
        permanent: z
          .boolean()
          .default(false)
          .describe(
            'Whether to permanently delete the note (default: false, moves to trash)',
          ),
      },
    },
    async ({ noteId, permanent }) => {
      try {
        await context.client.deleteNote(noteId, permanent);

        const action = permanent ? 'permanently deleted' : 'moved to trash';
        return textResponse(`Note ${action} successfully.`);
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
