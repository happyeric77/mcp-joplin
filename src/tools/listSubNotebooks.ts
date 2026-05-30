import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { JoplinApiError, type JoplinNotebook } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

const findNotebookById = (
  notebooks: JoplinNotebook[],
  notebookId: string,
): JoplinNotebook | undefined => {
  for (const notebook of notebooks) {
    if (notebook.id === notebookId) {
      return notebook;
    }

    const childMatch = findNotebookById(notebook.children ?? [], notebookId);
    if (childMatch) {
      return childMatch;
    }
  }

  return undefined;
};

const paramsSchema = {
  parentNotebookId: z
    .string()
    .describe('The ID of the parent notebook to list sub-notebooks from'),
};

export const registerListSubNotebooks = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'list_sub_notebooks',
    {
      description: 'List direct child notebooks in a specific parent notebook',
      inputSchema: paramsSchema,
    },
    async ({ parentNotebookId }) => {
      try {
        const notebookTree = await context.client.getNotebookTree();
        const parentNotebook = findNotebookById(notebookTree, parentNotebookId);

        if (!parentNotebook) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Notebook with ID ${parentNotebookId} not found.`,
              },
            ],
          };
        }

        const subNotebooks = parentNotebook.children ?? [];

        const formattedList = subNotebooks
          .map(
            (notebook) =>
              `**${notebook.title}** (ID: ${notebook.id})\nCreated: ${new Date(notebook.created_time).toLocaleString()}`,
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
    },
  );
};
