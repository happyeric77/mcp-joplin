import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

export const registerDeleteNotebook = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'delete_notebook',
    {
      description: 'Delete a notebook from Joplin',
      inputSchema: {
        notebookId: z.string().describe('The ID of the notebook to delete'),
        permanent: z
          .boolean()
          .default(false)
          .describe(
            'Whether to permanently delete the notebook (default: false, moves to trash)',
          ),
      },
    },
    async ({ notebookId, permanent }) => {
      try {
        await context.client.deleteNotebook(notebookId, permanent);

        const action = permanent ? 'permanently deleted' : 'moved to trash';
        return textResponse(`Notebook ${action} successfully.`);
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
