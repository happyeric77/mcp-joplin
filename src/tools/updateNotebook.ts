import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

const paramsSchema = {
  notebookId: z.string().describe('The ID of the notebook to update'),
  title: z.string().describe('The new title for the notebook'),
};

export const registerUpdateNotebook = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'update_notebook',
    {
      description: 'Update the title of an existing notebook',
      inputSchema: paramsSchema,
    },
    async ({ notebookId, title }) => {
      try {
        const notebook = await context.client.updateNotebook(notebookId, {
          title,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Notebook updated successfully!\n\n**Title:** ${notebook.title}\n**ID:** ${notebook.id}`,
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
    },
  );
};
