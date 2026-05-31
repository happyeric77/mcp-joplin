import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { JoplinMcpContext } from '../context.js';
import { registerAppendToNote } from './appendToNote.js';
import { registerAttachImageToNote } from './attachImageToNote.js';
import { registerClearTodoDue } from './clearTodoDue.js';
import { registerCompleteTodoNote } from './completeTodoNote.js';
import { registerConvertNoteToTodo } from './convertNoteToTodo.js';
import { registerConvertTodoToNote } from './convertTodoToNote.js';
import { registerCreateNote } from './createNote.js';
import { registerCreateNotebook } from './createNotebook.js';
import { registerCreateTodoNote } from './createTodoNote.js';
import { registerDeleteNote } from './deleteNote.js';
import { registerDeleteNotebook } from './deleteNotebook.js';
import { registerGetNoteContent } from './getNoteContent.js';
import { registerGetNoteImage } from './getNoteImage.js';
import { registerListNoteImages } from './listNoteImages.js';
import { registerListNotes } from './listNotes.js';
import { registerListRootNotebooks } from './listRootNotebooks.js';
import { registerListSubNotebooks } from './listSubNotebooks.js';
import { registerListTodoNotes } from './listTodoNotes.js';
import { registerMoveNote } from './moveNote.js';
import { registerReopenTodoNote } from './reopenTodoNote.js';
import { registerSearchNotebooks } from './searchNotebooks.js';
import { registerSearchNotes } from './searchNotes.js';
import { registerSearchTodoNotes } from './searchTodoNotes.js';
import { registerSetTodoDue } from './setTodoDue.js';
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
  registerSearchTodoNotes(server, context);
  registerSearchNotebooks(server, context);
  registerListRootNotebooks(server, context);
  registerListNotes(server, context);
  registerListTodoNotes(server, context);
  registerListSubNotebooks(server, context);
  registerCreateNote(server, context);
  registerCreateTodoNote(server, context);
  registerCreateNotebook(server, context);
  registerDeleteNote(server, context);
  registerDeleteNotebook(server, context);
  registerMoveNote(server, context);
  registerUpdateNote(server, context);
  registerAppendToNote(server, context);
  registerUpdateNotebook(server, context);
  registerCompleteTodoNote(server, context);
  registerReopenTodoNote(server, context);
  registerSetTodoDue(server, context);
  registerClearTodoDue(server, context);
  registerConvertNoteToTodo(server, context);
  registerConvertTodoToNote(server, context);
  registerListNoteImages(server, context);
  registerGetNoteImage(server, context);
  registerAttachImageToNote(server, context);
};
