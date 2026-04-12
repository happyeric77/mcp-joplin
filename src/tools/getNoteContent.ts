import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { JoplinMcpContext } from '../context.js';
import { JoplinApiError } from '../joplin-client.js';

export const registerGetNoteContent = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'get_note_content',
    'Get the content of a specific note by ID',
    {
      noteId: z.string().describe('The ID of the note to retrieve'),
    },
    async ({ noteId }) => {
      try {
        const note = await context.client.getNote(noteId);
        return {
          content: [
            { type: 'text' as const, text: `# ${note.title}\n\n${note.body}` },
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
