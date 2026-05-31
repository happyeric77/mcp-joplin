import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import { collectNoteImages } from './imageResourceUtils.js';
import { formatTodoMetadataLines } from './todoUtils.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the note to retrieve'),
  includeImages: z
    .boolean()
    .optional()
    .describe(
      'Whether to include image metadata in the response (default: true)',
    ),
};

export const registerGetNoteContent = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'get_note_content',
    {
      description: 'Get the content of a specific note by ID',
      inputSchema: paramsSchema,
    },
    async ({ noteId, includeImages = true }) => {
      try {
        const note = await context.client.getNote(noteId);
        const metadata = formatTodoMetadataLines(note).join('\n');
        let body = `${metadata}\n\n---\n\n${note.body ?? ''}`;

        if (includeImages) {
          const images = await collectNoteImages(context, noteId);

          if (images.length > 0) {
            const imageList = images
              .map(
                (img) =>
                  `- **${img.title}**  \n  id: \`${img.id}\`  |  mime: \`${img.mime ?? 'unknown'}\`  |  size: ${img.size ?? 'unknown'} bytes  |  reference: ![${img.title}](:/${img.id})`,
              )
              .join('\n');

            body = `${body}\n\n## Images\n\n${imageList}`;
          }
        }

        return {
          content: [
            { type: 'text' as const, text: `# ${note.title}\n\n${body}` },
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
