import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'node:fs';
import path from 'node:path';

import { JoplinApiError } from './errors.js';
import {
  JoplinApiOptions,
  JoplinCollectionPage,
  JoplinNote,
  JoplinNotebook,
  JoplinPageOptions,
  JoplinResource,
  JoplinSearchResult,
  JoplinSearchType,
  JoplinTag,
} from './types.js';

type JoplinCollectionResponse<T> = JoplinCollectionPage<T> | T[];

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

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.params = { ...config.params, token: this.token };
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new JoplinApiError(
            error.response.data?.error || error.message,
            error.response.status,
            error.response.data,
          );
        }
        throw new JoplinApiError(error.message);
      },
    );
  }

  // ── Connection ──────────────────────────────────────────────────────

  /** Auto-discover Joplin Web Clipper port by scanning localhost ports. */
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
      'Joplin Web Clipper service not found. Make sure Joplin is running and Web Clipper is enabled.',
    );
  }

  setToken(token: string): void {
    this.token = token;
  }

  private buildPageParams(
    options: JoplinPageOptions = {},
  ): Record<string, string | number> {
    const params: Record<string, string | number> = {};

    if (options.fields !== undefined && options.fields !== '') {
      params.fields = options.fields;
    }
    if (options.page !== undefined) {
      params.page = options.page;
    }
    if (options.limit !== undefined) {
      params.limit = options.limit;
    }

    return params;
  }

  private async getPage<T>(
    url: string,
    options: JoplinPageOptions = {},
  ): Promise<JoplinCollectionPage<T>> {
    const response = await this.client.get<JoplinCollectionPage<T>>(url, {
      params: this.buildPageParams(options),
    });

    return {
      items: response.data.items,
      has_more: response.data.has_more === true,
    };
  }

  private getCollectionItems<T>(data: JoplinCollectionResponse<T>): T[] {
    return Array.isArray(data) ? data : data.items;
  }

  /** Test the connection to the Joplin API. */
  async ping(): Promise<string> {
    const response = await this.client.get('/ping');
    return response.data;
  }

  // ── Notes ───────────────────────────────────────────────────────────

  async getNotes(
    options: JoplinPageOptions = {},
  ): Promise<JoplinCollectionPage<JoplinNote>> {
    return this.getPage<JoplinNote>('/notes', options);
  }

  async getNote(id: string, fields?: string): Promise<JoplinNote> {
    const defaultFields =
      'id,title,body,parent_id,created_time,updated_time,is_todo,todo_completed';
    const actualFields =
      fields !== undefined && fields !== '' ? fields : defaultFields;
    const response = await this.client.get(`/notes/${id}`, {
      params: { fields: actualFields },
    });
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

  async getNoteResources(noteId: string): Promise<JoplinResource[]> {
    const response = await this.client.get(`/notes/${noteId}/resources`);
    return response.data.items || response.data;
  }

  async getResource(resourceId: string): Promise<JoplinResource> {
    const response = await this.client.get(`/resources/${resourceId}`);
    return response.data;
  }

  async getResourceFile(
    resourceId: string,
  ): Promise<{ data: Buffer; mimeType: string }> {
    try {
      const response = await this.client.get(`/resources/${resourceId}/file`, {
        responseType: 'arraybuffer',
      });

      return {
        data: Buffer.from(response.data),
        mimeType:
          response.headers['content-type'] || 'application/octet-stream',
      };
    } catch (error) {
      if (error instanceof JoplinApiError) {
        throw error;
      }

      throw new JoplinApiError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch resource file.',
      );
    }
  }

  async createImageResource(
    filePath: string,
    title?: string,
  ): Promise<JoplinResource> {
    try {
      const form = new FormData();

      form.append(
        'data',
        fs.createReadStream(filePath),
        path.basename(filePath),
      );

      if (title) {
        form.append('props', JSON.stringify({ title }));
      }

      const response = await this.client.post('/resources', form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      });

      return response.data;
    } catch (error) {
      if (error instanceof JoplinApiError) {
        throw error;
      }

      throw new JoplinApiError(
        error instanceof Error
          ? error.message
          : 'Failed to create image resource.',
      );
    }
  }

  // ── Notebooks (Folders) ─────────────────────────────────────────────

  async getNotebookTree(): Promise<JoplinNotebook[]> {
    const response =
      await this.client.get<JoplinCollectionResponse<JoplinNotebook>>(
        '/folders',
      );
    return this.getCollectionItems(response.data);
  }

  async getNotebook(id: string): Promise<JoplinNotebook> {
    const response = await this.client.get(`/folders/${id}`);
    return response.data;
  }

  async getNotesInNotebook(
    notebookId: string,
    options: JoplinPageOptions = {},
  ): Promise<JoplinCollectionPage<JoplinNote>> {
    return this.getPage<JoplinNote>(`/folders/${notebookId}/notes`, options);
  }

  async createNotebook(
    notebook: Partial<JoplinNotebook>,
  ): Promise<JoplinNotebook> {
    const response = await this.client.post('/folders', notebook);
    return response.data;
  }

  async updateNotebook(
    id: string,
    notebook: Partial<JoplinNotebook>,
  ): Promise<JoplinNotebook> {
    const response = await this.client.put(`/folders/${id}`, notebook);
    return response.data;
  }

  async deleteNotebook(id: string, permanent: boolean = false): Promise<void> {
    const params = permanent ? { permanent: 1 } : {};
    await this.client.delete(`/folders/${id}`, { params });
  }

  // ── Search ──────────────────────────────────────────────────────────

  async search(
    query: string,
    type: 'note',
    fields?: string,
    options?: JoplinPageOptions,
  ): Promise<JoplinCollectionPage<JoplinNote>>;

  async search(
    query: string,
    type: 'folder',
    fields?: string,
    options?: JoplinPageOptions,
  ): Promise<JoplinCollectionPage<JoplinNotebook>>;

  async search(
    query: string,
    type: 'tag',
    fields?: string,
    options?: JoplinPageOptions,
  ): Promise<JoplinCollectionPage<JoplinTag>>;

  async search(
    query: string,
    type?: JoplinSearchType,
    fields?: string,
    options: JoplinPageOptions = {},
  ): Promise<JoplinSearchResult> {
    const params: Record<string, string | number> = {
      ...this.buildPageParams(options),
      query,
    };
    if (type) params.type = type;
    if (fields) params.fields = fields;

    const response = await this.client.get<JoplinSearchResult>('/search', {
      params,
    });
    return {
      items: response.data.items,
      has_more: response.data.has_more === true,
    };
  }

  // ── Tags ────────────────────────────────────────────────────────────

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
