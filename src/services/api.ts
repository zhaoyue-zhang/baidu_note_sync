import { clearSessionToken, getSessionToken, setSessionToken } from './session';
import type { ApiError, Note, NotesTree } from '../types/notes';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

function url(path: string) {
  return `${API_BASE}${path}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.auth !== false) {
    const token = getSessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url(path), {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (err) {
    const error = new Error('网络连接失败，请检查 SCF 地址或网络') as ApiError;
    error.code = 'NETWORK_ERROR';
    throw error;
  }

  const refreshed = response.headers.get('X-Session-Token');
  if (refreshed) setSessionToken(refreshed);

  const data = await response.json().catch(() => ({}));
  if (data.sessionToken) setSessionToken(data.sessionToken);

  if (!response.ok || data.ok === false) {
    const error = new Error(data.message || `请求失败 HTTP ${response.status}`) as ApiError;
    error.status = response.status;
    error.code = data.code;
    if (response.status === 401) clearSessionToken();
    throw error;
  }

  return data as T;
}

export const api = {
  authUrl() {
    const u = new URL(url('/auth'));
    u.searchParams.set('from', window.location.origin);
    return u.toString();
  },

  async getTree() {
    const data = await request<{ groups: NotesTree['groups']; rootNotes: Note[] }>('/api/notes/tree');
    return { groups: data.groups, rootNotes: data.rootNotes };
  },

  async getNote(fsid: number) {
    return request<{ note: Note; content: string }>(`/api/notes/${fsid}`);
  },

  async createNote(input: { title: string; content: string; group?: string }) {
    return request<{ note: Note }>('/api/notes', {
      method: 'POST',
      body: input,
    });
  },

  async updateNote(input: { fsId: number; path: string; title: string; content: string; group?: string }) {
    return request<{ note: Note }>(`/api/notes/${input.fsId}`, {
      method: 'PUT',
      body: input,
    });
  },

  async deleteNote(note: Note) {
    return request(`/api/notes/${note.fsId}`, {
      method: 'DELETE',
      body: { path: note.path },
    });
  },

  async createGroup(name: string) {
    return request('/api/groups', {
      method: 'POST',
      body: { name },
    });
  },

  async deleteGroup(name: string) {
    return request(`/api/groups/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },
};
