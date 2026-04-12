import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { JoplinMcpContext } from '../context.js';

/**
 * Register all Joplin MCP resources on the given server instance.
 */
export const registerResources = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.resource(
    'all_notebooks',
    'joplin://notebooks',
    {
      description: 'List of all notebooks in Joplin',
      mimeType: 'application/json',
    },
    async uri => {
      const notebooks = await context.client.getNotebooks();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(notebooks, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    'all_notes',
    'joplin://notes',
    {
      description: 'List of all notes in Joplin',
      mimeType: 'application/json',
    },
    async uri => {
      const notes = await context.client.getNotes();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(notes, null, 2),
          },
        ],
      };
    }
  );
};
