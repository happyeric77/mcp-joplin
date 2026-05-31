import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinNotebook } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import { formatNotebookSummary } from './formatters.js';
import {
  errorResponse,
  exceptionResponse,
  textResponse,
} from './toolResponse.js';

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
          return errorResponse(
            `Notebook with ID ${parentNotebookId} not found.`,
          );
        }

        const subNotebooks = parentNotebook.children ?? [];

        const formattedList = subNotebooks
          .map(formatNotebookSummary)
          .join('\n\n---\n\n');

        return textResponse(
          formattedList || 'No sub-notebooks found in this notebook.',
        );
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
