import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

export const registerDeleteNotebook = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'delete_notebook',
    'Delete a notebook from Joplin',
    {
      notebookId: z.string().describe('The ID of the notebook to delete'),
      permanent: z
        .boolean()
        .default(false)
        .describe(
          'Whether to permanently delete the notebook (default: false, moves to trash)'
        ),
    },
    async ({ notebookId, permanent }) => {
      try {
        await context.client.deleteNotebook(notebookId, permanent);

        const action = permanent ? 'permanently deleted' : 'moved to trash';
        return {
          content: [
            {
              type: 'text' as const,
              text: `Notebook ${action} successfully.`,
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
