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

export interface JoplinResource {
  id: string;
  title: string;
  mime?: string;
  filename?: string;
  file_extension?: string;
  size?: number;
  created_time?: number;
  updated_time?: number;
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
