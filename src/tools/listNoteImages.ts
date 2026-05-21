import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import { collectNoteImages } from './imageResourceUtils.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the note whose images to list'),
};

export const registerListNoteImages = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'list_note_images',
    {
      description: 'List image resources attached to a specific note',
      inputSchema: paramsSchema,
    },
    async ({ noteId }) => {
      try {
        const resources = await collectNoteImages(context, noteId);
        const images = resources.map((resource) => ({
          id: resource.id,
          title: resource.title,
          mime: resource.mime ?? 'unknown',
          size: resource.size ?? 'unknown',
          markdownReference: `![](:/${resource.id})`,
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ images }, null, 2),
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
