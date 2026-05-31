import type { JoplinNote, JoplinNotebook } from '../client/index.js';
import type { JoplinResource } from '../client/types.js';
import {
  formatTimestamp,
  formatTodoIcon,
  formatTodoMetadataLines,
  formatTodoStatus,
  isTodoNote,
} from './todoUtils.js';

export const formatNotebookSummary = (notebook: JoplinNotebook): string =>
  `**${notebook.title}** (ID: ${notebook.id})\nCreated: ${new Date(notebook.created_time).toLocaleString()}`;

export const formatNoteSearchResult = (note: JoplinNote): string => {
  const metadata = formatTodoMetadataLines(note).join('\n');
  const preview = note.body ? note.body.substring(0, 100) : '';
  return `**${note.title}** (ID: ${note.id})\n${metadata}\nUpdated: ${new Date(note.updated_time).toLocaleString()}\nPreview: ${preview}...`;
};

export const formatNoteListItem = (note: JoplinNote): string => {
  const title = isTodoNote(note)
    ? `${formatTodoIcon(note)} ${note.title}`
    : note.title;
  const lines = [`**${title}** (ID: ${note.id})`];

  if (isTodoNote(note)) {
    lines.push(`Status: ${formatTodoStatus(note)}`);
    if (note.todo_completed > 0) {
      lines.push(`Completed: ${formatTimestamp(note.todo_completed)}`);
    }
    if (note.todo_due > 0) {
      lines.push(`Due: ${formatTimestamp(note.todo_due)}`);
    }
  }

  lines.push(`Updated: ${new Date(note.updated_time).toLocaleString()}`);
  return lines.join('\n');
};

export const formatTodoSearchResult = (note: JoplinNote): string => {
  const preview = note.body ? note.body.substring(0, 100) : '';
  return [
    `**${formatTodoIcon(note)} ${note.title}** (ID: ${note.id})`,
    `Status: ${formatTodoStatus(note)}`,
    `Due: ${formatTimestamp(note.todo_due)}`,
    `Completed: ${formatTimestamp(note.todo_completed)}`,
    `Updated: ${new Date(note.updated_time).toLocaleString()}`,
    `Preview: ${preview}...`,
  ].join('\n');
};

export const formatTodoListItem = (note: JoplinNote): string =>
  [
    `**${formatTodoIcon(note)} ${note.title}** (ID: ${note.id})`,
    `Status: ${formatTodoStatus(note)}`,
    `Due: ${formatTimestamp(note.todo_due)}`,
    `Completed: ${formatTimestamp(note.todo_completed)}`,
    `Updated: ${new Date(note.updated_time).toLocaleString()}`,
  ].join('\n');

export const formatImageMetadataList = (images: JoplinResource[]) =>
  images.map((resource) => ({
    id: resource.id,
    title: resource.title,
    mime: resource.mime ?? 'unknown',
    size: resource.size ?? 'unknown',
    markdownReference: `![](:/${resource.id})`,
  }));
