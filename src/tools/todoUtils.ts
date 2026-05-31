import type { JoplinNote } from '../client/index.js';

export const TODO_STATUS_VALUES = ['open', 'completed', 'all'] as const;

export type TodoStatus = (typeof TODO_STATUS_VALUES)[number];

type TodoMetadata = Pick<JoplinNote, 'is_todo' | 'todo_due' | 'todo_completed'>;
type TodoIdentity = Pick<JoplinNote, 'id' | 'title' | 'is_todo'>;

const TODO_METADATA_FIELD_LIST = [
  'id',
  'title',
  'is_todo',
  'todo_due',
  'todo_completed',
] as const;

export const TODO_NOTE_FIELDS =
  [...TODO_METADATA_FIELD_LIST, 'body', 'parent_id', 'created_time', 'updated_time'].join(',');

export const TODO_LIST_FIELDS = [...TODO_METADATA_FIELD_LIST, 'updated_time'].join(',');

export const TODO_METADATA_FIELDS = TODO_METADATA_FIELD_LIST.join(',');

export const parseDateToMs = (value: string): number => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error('Date value must not be empty.');
  }

  const numericValue = Number(trimmed);
  const timestamp = /^\d+$/.test(trimmed)
    ? numericValue
    : new Date(trimmed).getTime();

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    throw new Error(
      `Invalid date: ${value}. Use an ISO date/time string or a positive millisecond timestamp.`
    );
  }

  return Math.trunc(timestamp);
};

export const formatTimestamp = (value: number | undefined): string => {
  if (value === undefined || value <= 0) {
    return '-';
  }

  return new Date(value).toLocaleString();
};

export const isTodoNote = (note: Pick<JoplinNote, 'is_todo'>): boolean =>
  note.is_todo === 1;

export const isTodoOpen = (
  note: Pick<JoplinNote, 'is_todo' | 'todo_completed'>
): boolean => isTodoNote(note) && note.todo_completed === 0;

export const formatTodoStatus = (
  note: Pick<JoplinNote, 'is_todo' | 'todo_completed'>
): string => {
  if (!isTodoNote(note)) {
    return 'Regular note';
  }

  return isTodoOpen(note) ? 'Open' : 'Completed';
};

export const formatTodoIcon = (
  note: Pick<JoplinNote, 'is_todo' | 'todo_completed'>
): string => {
  if (!isTodoNote(note)) {
    return '';
  }

  return isTodoOpen(note) ? '☐' : '✅';
};

export const assertTodoNote = (note: TodoIdentity): void => {
  if (!isTodoNote(note)) {
    throw new Error(
      `Note "${note.title}" (${note.id}) is not a native Joplin todo note.`
    );
  }
};

export const assertRegularNote = (note: TodoIdentity): void => {
  if (isTodoNote(note)) {
    throw new Error(
      `Note "${note.title}" (${note.id}) is already a native Joplin todo note.`
    );
  }
};

export const matchesTodoStatus = (
  note: TodoMetadata,
  status: TodoStatus
): boolean => {
  if (!isTodoNote(note)) {
    return false;
  }

  if (status === 'all') {
    return true;
  }

  return status === 'open' ? isTodoOpen(note) : !isTodoOpen(note);
};

export const formatTodoMetadataLines = (note: TodoMetadata): string[] => {
  if (!isTodoNote(note)) {
    return ['Type: Regular note'];
  }

  return [
    'Type: Todo note',
    `Status: ${formatTodoStatus(note)}`,
    `Due: ${formatTimestamp(note.todo_due)}`,
    `Completed: ${formatTimestamp(note.todo_completed)}`,
  ];
};
