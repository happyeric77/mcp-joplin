import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

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
          .map(
            (notebook) =>
              `**${notebook.title}** (ID: ${notebook.id})\nCreated: ${new Date(notebook.created_time).toLocaleString()}`,
          )
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: formattedList || 'No root notebooks found.',
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
