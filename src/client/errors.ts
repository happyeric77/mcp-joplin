export class JoplinApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'JoplinApiError';
  }
}
