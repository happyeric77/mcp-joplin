import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { JoplinMcpContext } from '../context.js';
import { JoplinApiError } from '../joplin-client.js';

export const registerListNotebooks = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'list_notebooks',
    'List all notebooks in Joplin',
    {},
    async () => {
      try {
        const notebooks = await context.client.getNotebooks();

        const formattedList = notebooks
          .map(
            notebook =>
              `**${notebook.title}** (ID: ${notebook.id})\nCreated: ${new Date(notebook.created_time).toLocaleString()}`
          )
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: formattedList || 'No notebooks found.',
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
