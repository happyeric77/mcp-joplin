import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { realpathSync, statSync } from 'fs';
import path from 'path';
import { z } from 'zod';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const DEFAULT_SEPARATOR = '\n\n';
const BLOCKED_PATH_SEGMENTS = ['.env', '.ssh', 'id_rsa', 'keychain'];

const mimeTypeByExtension: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const paramsSchema = {
  noteId: z.string().describe('The ID of the note to attach the image to'),
  filePath: z
    .string()
    .describe('Absolute path to the local image file to attach'),
  altText: z.string().optional().describe('Alt text for the markdown image'),
  title: z
    .string()
    .optional()
    .describe('Title to use for the Joplin image resource (default: filename)'),
  position: z
    .enum(['end', 'start'])
    .optional()
    .describe('Where to insert the markdown image in the note (default: end)'),
  separator: z
    .string()
    .optional()
    .describe(
      'Separator between note body and inserted markdown (default: "\\n\\n")',
    ),
};

interface JoplinImageResource {
  id: string;
  title?: string;
}

interface JoplinClientWithImageResource {
  createImageResource: (
    filePath: string,
    title: string,
  ) => Promise<JoplinImageResource>;
}

const buildUpdatedBody = (
  existingBody: string,
  markdown: string,
  position: 'end' | 'start',
  separator: string,
): string => {
  if (existingBody.length === 0) {
    return markdown;
  }

  return position === 'start'
    ? `${markdown}${separator}${existingBody}`
    : `${existingBody}${separator}${markdown}`;
};

export const registerAttachImageToNote = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'attach_image_to_note',
    {
      description:
        'Attach a local image file to a Joplin note and insert a markdown image reference into the note body.',
      inputSchema: paramsSchema,
    },
    async ({ noteId, filePath, altText, title, position, separator }) => {
      try {
        let resolvedPath: string;

        try {
          resolvedPath = realpathSync.native(filePath);
        } catch (error) {
          if (
            error instanceof Error &&
            'code' in error &&
            error.code === 'ENOENT'
          ) {
            return {
              isError: true,
              content: [
                {
                  type: 'text' as const,
                  text: `Error: File does not exist: ${filePath}`,
                },
              ],
            };
          }

          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Error: Unable to access file: ${filePath}`,
              },
            ],
          };
        }

        const normalizedResolvedPathSegments = resolvedPath
          .toLowerCase()
          .split(path.sep)
          .filter(Boolean);

        if (
          BLOCKED_PATH_SEGMENTS.some((segment) =>
            normalizedResolvedPathSegments.includes(segment),
          )
        ) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Error: Access to sensitive path is not allowed: ${resolvedPath}`,
              },
            ],
          };
        }

        const fileStats = statSync(resolvedPath);

        if (fileStats.isDirectory()) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Error: Path is a directory, not a file: ${resolvedPath}`,
              },
            ],
          };
        }

        if (fileStats.size > MAX_IMAGE_SIZE_BYTES) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Error: Image file exceeds 3MB limit: ${resolvedPath}`,
              },
            ],
          };
        }

        const extension = path.extname(resolvedPath).toLowerCase();
        const mimeType = mimeTypeByExtension[extension];

        if (!mimeType) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Error: Unsupported image type. Allowed types: image/png, image/jpeg, image/gif, image/webp.`,
              },
            ],
          };
        }

        await context.client.getNote(noteId, 'id,title');

        const resourceTitle = title ?? path.basename(resolvedPath);
        const markdownAltText = altText ?? '';
        const actualPosition = position ?? 'end';
        const actualSeparator = separator ?? DEFAULT_SEPARATOR;
        const imageClient = context.client as JoplinMcpContext['client'] &
          JoplinClientWithImageResource;

        const resource = await imageClient.createImageResource(
          resolvedPath,
          resourceTitle,
        );
        const existingNote = await context.client.getNote(
          noteId,
          'id,title,body',
        );
        const markdown = `![${markdownAltText}](:/${resource.id})`;
        const newBody = buildUpdatedBody(
          existingNote.body ?? '',
          markdown,
          actualPosition,
          actualSeparator,
        );

        await context.client.updateNote(noteId, { body: newBody });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Image attached successfully!\n\n**Note ID:** ${noteId}\n**Resource ID:** ${resource.id}\n**Markdown reference:** ${markdown}`,
            },
          ],
        };
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'ENOENT'
        ) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Error: File does not exist: ${filePath}`,
              },
            ],
          };
        }

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
