import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { formatImageMetadataList } from './formatters.js';
import { collectNoteImages } from './imageResourceUtils.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

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
        const images = formatImageMetadataList(resources);

        return textResponse(JSON.stringify({ images }, null, 2));
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
