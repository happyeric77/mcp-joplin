import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { JoplinMcpContext } from '../context.js';
import { registerAppendToNote } from './appendToNote.js';
import { registerAttachImageToNote } from './attachImageToNote.js';
import { registerCreateNote } from './createNote.js';
import { registerCreateNotebook } from './createNotebook.js';
import { registerDeleteNote } from './deleteNote.js';
import { registerDeleteNotebook } from './deleteNotebook.js';
import { registerGetNoteContent } from './getNoteContent.js';
import { registerGetNoteImage } from './getNoteImage.js';
import { registerListNoteImages } from './listNoteImages.js';
import { registerListNotebooks } from './listNotebooks.js';
import { registerListNotes } from './listNotes.js';
import { registerListSubNotebooks } from './listSubNotebooks.js';
import { registerMoveNote } from './moveNote.js';
import { registerScanUncheckedItems } from './scanUncheckedItems.js';
import { registerSearchNotebooks } from './searchNotebooks.js';
import { registerSearchNotes } from './searchNotes.js';
import { registerUpdateNote } from './updateNote.js';
import { registerUpdateNotebook } from './updateNotebook.js';

/**
 * Register all Joplin MCP tools on the given server instance.
 */
export const registerTools = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  registerGetNoteContent(server, context);
  registerSearchNotes(server, context);
  registerSearchNotebooks(server, context);
  registerListNotebooks(server, context);
  registerListNotes(server, context);
  registerListSubNotebooks(server, context);
  registerCreateNote(server, context);
  registerCreateNotebook(server, context);
  registerDeleteNote(server, context);
  registerDeleteNotebook(server, context);
  registerMoveNote(server, context);
  registerScanUncheckedItems(server, context);
  registerUpdateNote(server, context);
  registerAppendToNote(server, context);
  registerUpdateNotebook(server, context);
  registerListNoteImages(server, context);
  registerGetNoteImage(server, context);
  registerAttachImageToNote(server, context);
};
