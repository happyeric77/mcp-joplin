import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

export const registerCreateNotebook = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'create_notebook',
    'Create a new notebook in Joplin',
    {
      title: z.string().describe('The title of the new notebook'),
      parentId: z
        .string()
        .optional()
        .describe(
          'The ID of the parent notebook (optional, for sub-notebooks)'
        ),
    },
    async ({ title, parentId }) => {
      try {
        const notebookData: Record<string, unknown> = { title };
        if (parentId) {
          notebookData.parent_id = parentId;
        }

        const notebook = await context.client.createNotebook(notebookData);

        return {
          content: [
            {
              type: 'text' as const,
              text: `Notebook created successfully!\n\n**Title:** ${notebook.title}\n**ID:** ${notebook.id}\n**Created:** ${new Date(notebook.created_time).toLocaleString()}`,
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
