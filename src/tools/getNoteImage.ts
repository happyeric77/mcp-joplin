import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import {
  inferImageMimeType,
  isSupportedImageResource,
} from './imageResourceUtils.js';
import { errorResponse, exceptionResponse } from './toolResponse.js';

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
          return errorResponse(
            `Error: Resource ${resourceId} is not a supported image type.`,
          );
        }

        const resourceFile = await context.client.getResourceFile(resourceId);
        const mimeType = inferImageMimeType(resource);

        if (!mimeType) {
          return errorResponse(
            `Error: Unable to determine MIME type for resource ${resourceId}.`,
          );
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
        return exceptionResponse(error);
      }
    },
  );
};
