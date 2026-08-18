export type Note = {
  fsId: number;
  title: string;
  filename: string;
  path: string;
  size: number;
  modifiedAt: number;
  createdAt: number;
  group?: string;
};

export type NoteGroup = {
  name: string;
  notes: Note[];
};

export type NotesTree = {
  groups: NoteGroup[];
  rootNotes: Note[];
};

export type ApiError = Error & {
  status?: number;
  code?: string;
};

export type SortMode = 'modified' | 'created' | 'title';
