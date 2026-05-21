import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import {
  inferImageMimeType,
  isSupportedImageResource,
} from './imageResourceUtils.js';

const paramsSchema = {
  resourceId: z.string().describe('The ID of the image resource to retrieve'),
};

export const registerGetNoteImage = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'get_note_image',
    {
      description: 'Retrieve an image resource from Joplin by resource ID',
      inputSchema: paramsSchema,
    },
    async ({ resourceId }) => {
      try {
        const resource = await context.client.getResource(resourceId);

        if (!isSupportedImageResource(resource)) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Error: Resource ${resourceId} is not a supported image type.`,
              },
            ],
          };
        }

        const resourceFile = await context.client.getResourceFile(resourceId);
        const mimeType = inferImageMimeType(resource);

        if (!mimeType) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Error: Unable to determine MIME type for resource ${resourceId}.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'image' as const,
              data: Buffer.from(resourceFile.data).toString('base64'),
              mimeType,
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
