import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

export const registerListSubNotebooks = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'list_sub_notebooks',
    'List sub-notebooks (child folders) in a specific notebook',
    {
      parentNotebookId: z
        .string()
        .describe('The ID of the parent notebook to list sub-notebooks from'),
    },
    async ({ parentNotebookId }) => {
      try {
        const allNotebooks = await context.client.getNotebooks();
        const subNotebooks = allNotebooks.filter(
          notebook => notebook.parent_id === parentNotebookId
        );

        const formattedList = subNotebooks
          .map(
            notebook =>
              `**${notebook.title}** (ID: ${notebook.id})\nCreated: ${new Date(notebook.created_time).toLocaleString()}`
          )
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: formattedList || 'No sub-notebooks found in this notebook.',
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
