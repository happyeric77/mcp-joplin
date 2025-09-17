import axios, { AxiosInstance } from 'axios';

export interface JoplinNote {
  id: string;
  title: string;
  body: string;
  parent_id: string;
  created_time: number;
  updated_time: number;
  is_todo: number;
  todo_completed: number;
  source_url?: string;
  author?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  user_created_time: number;
  user_updated_time: number;
}

export interface JoplinNotebook {
  id: string;
  title: string;
  created_time: number;
  updated_time: number;
  user_created_time: number;
  user_updated_time: number;
  parent_id?: string;
  children?: JoplinNotebook[];
}

export interface JoplinTag {
  id: string;
  title: string;
  created_time: number;
  updated_time: number;
  user_created_time: number;
  user_updated_time: number;
}

export interface JoplinSearchResult {
  items: (JoplinNote | JoplinNotebook | JoplinTag)[];
  has_more: boolean;
}

export interface JoplinApiOptions {
  baseUrl?: string;
  token?: string;
  port?: number;
}

export class JoplinApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'JoplinApiError';
  }
}

export class JoplinClient {
  private client: AxiosInstance;
  private token: string;
  private baseUrl: string;

  constructor(options: JoplinApiOptions = {}) {
    const port = options.port || 41184;
    this.baseUrl = options.baseUrl || `http://localhost:${port}`;
    this.token = options.token || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to all requests
    this.client.interceptors.request.use(config => {
      if (this.token) {
        config.params = { ...config.params, token: this.token };
      }
      return config;
    });

    // Error handling interceptor
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          throw new JoplinApiError(
            error.response.data?.error || error.message,
            error.response.status,
            error.response.data
          );
        }
        throw new JoplinApiError(error.message);
      }
    );
  }

  // Auto-discover Joplin Web Clipper port and token
  async autoDiscover(): Promise<{ port: number; token?: string }> {
    for (let port = 41184; port <= 41194; port++) {
      try {
        const response = await axios.get(`http://localhost:${port}/ping`, {
          timeout: 5000,
        });
        if (response.data === 'JoplinClipperServer') {
          return { port };
        }
      } catch {
        // Continue to next port
      }
    }
    throw new JoplinApiError(
      'Joplin Web Clipper service not found. Make sure Joplin is running and Web Clipper is enabled.'
    );
  }

  setToken(token: string): void {
    this.token = token;
  }

  // Test connection
  async ping(): Promise<string> {
    const response = await this.client.get('/ping');
    return response.data;
  }

  // Notes API
  async getNotes(
    options: { fields?: string; page?: number; limit?: number } = {}
  ): Promise<JoplinSearchResult> {
    const allNotes: JoplinNote[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.client.get('/notes', {
        params: { ...options, page },
      });
      const data = response.data;
      const items = data.items || data;

      if (Array.isArray(items) && items.length > 0) {
        allNotes.push(...items);
        hasMore = data.has_more === true;
        page++;
      } else {
        hasMore = false;
      }

      // Safety check to prevent infinite loops
      if (page > 50) {
        console.warn('Reached maximum page limit (50) while fetching notes');
        break;
      }
    }

    return {
      items: allNotes,
      has_more: false,
    };
  }

  async getNote(id: string, fields?: string): Promise<JoplinNote> {
    // Default to important fields if none specified or empty
    const defaultFields =
      'id,title,body,parent_id,created_time,updated_time,is_todo,todo_completed';
    const actualFields =
      fields !== undefined && fields !== '' ? fields : defaultFields;
    const params = { fields: actualFields };
    const response = await this.client.get(`/notes/${id}`, { params });
    return response.data;
  }

  async createNote(note: Partial<JoplinNote>): Promise<JoplinNote> {
    const response = await this.client.post('/notes', note);
    return response.data;
  }

  async updateNote(id: string, note: Partial<JoplinNote>): Promise<JoplinNote> {
    const response = await this.client.put(`/notes/${id}`, note);
    return response.data;
  }

  async deleteNote(id: string, permanent: boolean = false): Promise<void> {
    const params = permanent ? { permanent: 1 } : {};
    await this.client.delete(`/notes/${id}`, { params });
  }

  // Notebooks (Folders) API
  async getNotebooks(): Promise<JoplinNotebook[]> {
    const allNotebooks: JoplinNotebook[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.client.get('/folders', { params: { page } });
      const data = response.data;
      const items = data.items || data;

      if (Array.isArray(items) && items.length > 0) {
        allNotebooks.push(...items);
        hasMore = data.has_more === true;
        page++;
      } else {
        hasMore = false;
      }

      // Safety check to prevent infinite loops
      if (page > 50) {
        console.warn(
          'Reached maximum page limit (50) while fetching notebooks'
        );
        break;
      }
    }

    return allNotebooks;
  }

  async getNotebook(id: string): Promise<JoplinNotebook> {
    const response = await this.client.get(`/folders/${id}`);
    return response.data;
  }

  async getNotesInNotebook(
    notebookId: string,
    options: { fields?: string; page?: number; limit?: number } = {}
  ): Promise<JoplinSearchResult> {
    const allNotes: JoplinNote[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.client.get(`/folders/${notebookId}/notes`, {
        params: { ...options, page },
      });
      const data = response.data;
      const items = data.items || data;

      if (Array.isArray(items) && items.length > 0) {
        allNotes.push(...items);
        hasMore = data.has_more === true;
        page++;
      } else {
        hasMore = false;
      }

      // Safety check to prevent infinite loops
      if (page > 50) {
        console.warn(
          'Reached maximum page limit (50) while fetching notes from notebook'
        );
        break;
      }
    }

    return {
      items: allNotes,
      has_more: false,
    };
  }

  async createNotebook(
    notebook: Partial<JoplinNotebook>
  ): Promise<JoplinNotebook> {
    const response = await this.client.post('/folders', notebook);
    return response.data;
  }

  async updateNotebook(
    id: string,
    notebook: Partial<JoplinNotebook>
  ): Promise<JoplinNotebook> {
    const response = await this.client.put(`/folders/${id}`, notebook);
    return response.data;
  }

  async deleteNotebook(id: string, permanent: boolean = false): Promise<void> {
    const params = permanent ? { permanent: 1 } : {};
    await this.client.delete(`/folders/${id}`, { params });
  }

  // Search API
  async search(
    query: string,
    type?: 'note' | 'folder' | 'tag',
    fields?: string
  ): Promise<JoplinSearchResult> {
    const params: any = { query };
    if (type) params.type = type;
    if (fields) params.fields = fields;

    const response = await this.client.get('/search', { params });
    return response.data;
  }

  // Tags API
  async getTags(): Promise<JoplinTag[]> {
    const response = await this.client.get('/tags');
    return response.data.items || response.data;
  }

  async getNoteTags(noteId: string): Promise<JoplinTag[]> {
    const response = await this.client.get(`/notes/${noteId}/tags`);
    return response.data.items || response.data;
  }

  async addTagToNote(tagId: string, noteId: string): Promise<void> {
    await this.client.post(`/tags/${tagId}/notes`, { id: noteId });
  }

  async removeTagFromNote(tagId: string, noteId: string): Promise<void> {
    await this.client.delete(`/tags/${tagId}/notes/${noteId}`);
  }
}
