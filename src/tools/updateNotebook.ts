import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

const paramsSchema = {
  notebookId: z.string().describe('The ID of the notebook to update'),
  title: z.string().describe('The new title for the notebook'),
  parentId: z
    .string()
    .optional()
    .describe('The ID of the new parent notebook (optional)'),
};

export const registerUpdateNotebook = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'update_notebook',
    {
      description:
        'Update the title and optionally parent of an existing notebook',
      inputSchema: paramsSchema,
    },
    async ({ notebookId, title, parentId }) => {
      try {
        const notebook = await context.client.updateNotebook(notebookId, {
          title,
          ...(parentId !== undefined ? { parent_id: parentId } : {}),
        });

        return textResponse(
          `Notebook updated successfully!\n\n**Title:** ${notebook.title}\n**ID:** ${notebook.id}`,
        );
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
