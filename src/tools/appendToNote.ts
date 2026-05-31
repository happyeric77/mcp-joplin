import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

const paramsSchema = {
  noteId: z.string().describe('The ID of the note to append content to'),
  content: z.string().describe('The content to append to the note'),
  separator: z
    .string()
    .optional()
    .describe(
      'Separator between existing content and appended content (default: "\\n\\n")',
    ),
};

export const registerAppendToNote = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'append_to_note',
    {
      description:
        'Append content to the end of an existing note. Useful for logs, meeting notes, supplementary info, or test results.',
      inputSchema: paramsSchema,
    },
    async ({ noteId, content, separator }) => {
      try {
        // Read existing note
        const existingNote = await context.client.getNote(
          noteId,
          'id,title,body',
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

        return textResponse(
          `Content appended successfully!\n\n**Title:** ${updatedNote.title}\n**ID:** ${updatedNote.id}\n**Appended content length:** ${content.length} characters`,
        );
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
