import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the note to update'),
  title: z
    .string()
    .optional()
    .describe('The new title for the note (optional)'),
  body: z
    .string()
    .optional()
    .describe(
      'The new body content for the note in Markdown format (optional, full replacement)'
    ),
};

export const registerUpdateNote = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'update_note',
    'Update an existing note title and/or body content. At least one of title or body must be provided. Body is a full replacement, not a patch.',
    paramsSchema,
    async ({ noteId, title, body }) => {
      try {
        if (title === undefined && body === undefined) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: 'Error: At least one of title or body must be provided.',
              },
            ],
          };
        }

        const updateData: Record<string, unknown> = {};
        const updatedFields: string[] = [];

        if (title !== undefined) {
          updateData.title = title;
          updatedFields.push('title');
        }
        if (body !== undefined) {
          updateData.body = body;
          updatedFields.push('body');
        }

        const note = await context.client.updateNote(noteId, updateData);

        return {
          content: [
            {
              type: 'text' as const,
              text: `Note updated successfully!\n\n**Title:** ${note.title}\n**ID:** ${note.id}\n**Updated:** ${new Date(note.updated_time).toLocaleString()}\n**Fields updated:** ${updatedFields.join(', ')}`,
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
