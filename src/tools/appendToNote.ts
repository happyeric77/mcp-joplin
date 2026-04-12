import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the note to append content to'),
  content: z.string().describe('The content to append to the note'),
  separator: z
    .string()
    .optional()
    .describe(
      'Separator between existing content and appended content (default: "\\n\\n")'
    ),
};

export const registerAppendToNote = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'append_to_note',
    'Append content to the end of an existing note. Useful for logs, meeting notes, supplementary info, or test results.',
    paramsSchema,
    async ({ noteId, content, separator }) => {
      try {
        // Read existing note
        const existingNote = await context.client.getNote(
          noteId,
          'id,title,body'
        );
        const existingBody = existingNote.body ?? '';

        // Build new body
        const actualSeparator = separator ?? '\n\n';
        const newBody =
          existingBody.length > 0
            ? `${existingBody}${actualSeparator}${content}`
            : content;

        // Write back
        const updatedNote = await context.client.updateNote(noteId, {
          body: newBody,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Content appended successfully!\n\n**Title:** ${updatedNote.title}\n**ID:** ${updatedNote.id}\n**Appended content length:** ${content.length} characters`,
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
