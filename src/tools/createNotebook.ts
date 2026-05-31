import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

export const registerCreateNotebook = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'create_notebook',
    {
      description: 'Create a new notebook in Joplin',
      inputSchema: {
        title: z.string().describe('The title of the new notebook'),
        parentId: z
          .string()
          .optional()
          .describe(
            'The ID of the parent notebook (optional, for sub-notebooks)',
          ),
      },
    },
    async ({ title, parentId }) => {
      try {
        const notebookData: Record<string, unknown> = { title };
        if (parentId) {
          notebookData.parent_id = parentId;
        }

        const notebook = await context.client.createNotebook(notebookData);

        return textResponse(
          `Notebook created successfully!\n\n**Title:** ${notebook.title}\n**ID:** ${notebook.id}\n**Created:** ${new Date(notebook.created_time).toLocaleString()}`,
        );
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
