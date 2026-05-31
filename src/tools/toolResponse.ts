import { JoplinApiError } from '../client/index.js';
import { InvalidPaginationError } from './pagination.js';

export const textResponse = (text: string) => ({
  content: [{ type: 'text' as const, text }],
});

export const errorResponse = (text: string) => ({
  isError: true,
  content: [{ type: 'text' as const, text }],
});

export const formatToolException = (error: unknown): string => {
  if (error instanceof JoplinApiError) {
    return `Joplin API Error: ${error.message}`;
  }

  if (error instanceof InvalidPaginationError) {
    return `Pagination Error: ${error.message}`;
  }

  return `Error: ${error instanceof Error ? error.message : String(error)}`;
};

export const exceptionResponse = (error: unknown) =>
  errorResponse(formatToolException(error));
