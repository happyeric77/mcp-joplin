import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { JoplinMcpContext } from '../context.js';
import { formatNotebookSummary } from './formatters.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

export const registerListRootNotebooks = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'list_root_notebooks',
    {
      description: 'List top-level/root notebooks from the Joplin folder tree',
      inputSchema: {},
    },
    async () => {
      try {
        const notebooks = await context.client.getNotebookTree();

        const formattedList = notebooks
          .map(formatNotebookSummary)
          .join('\n\n---\n\n');

        return textResponse(formattedList || 'No root notebooks found.');
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
