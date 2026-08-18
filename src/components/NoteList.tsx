import type { Note, NoteGroup } from '../types/notes';
import { formatTime } from '../services/format';

type NoteListProps = {
  rootNotes: Note[];
  groups: NoteGroup[];
  expanded: Record<string, boolean>;
  favorites: number[];
  onToggleGroup: (name: string) => void;
  onOpen: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onDeleteGroup: (name: string) => void;
  onToggleFav: (fsid: number) => void;
};

export function NoteList({
  rootNotes,
  groups,
  expanded,
  favorites,
  onToggleGroup,
  onOpen,
  onDeleteNote,
  onDeleteGroup,
  onToggleFav,
}: NoteListProps) {
  return (
    <div className="note-list">
      {rootNotes.length > 0 && (
        <section className="note-group-card">
          <button className="group-header" onClick={() => onToggleGroup('__root__')}>
            <span className="group-chevron">▾</span>
            <span className="group-label">未分组</span>
            <span className="group-count">{rootNotes.length}</span>
          </button>
          <div className="group-notes">
            {rootNotes.map((note) => (
              <NoteRow
                key={note.fsId}
                note={note}
                onOpen={onOpen}
                onDelete={onDeleteNote}
                isFav={favorites.includes(note.fsId)}
                onToggleFav={onToggleFav}
              />
            ))}
          </div>
        </section>
      )}

      {groups.map((group) => (
        <section className="note-group-card" key={group.name}>
          <div className="group-header-row">
            <button className="group-header" onClick={() => onToggleGroup(group.name)}>
              <span className={`group-chevron ${expanded[group.name] ? 'open' : ''}`}>▸</span>
              <span className="group-label">{group.name}</span>
              <span className="group-count">{group.notes.length}</span>
            </button>
            <button className="group-delete" onClick={() => onDeleteGroup(group.name)} title="删除分组">×</button>
          </div>
          {expanded[group.name] && (
            <div className="group-notes">
              {group.notes.length === 0 ? (
                <div className="empty-fav">此分组暂无笔记</div>
              ) : (
                group.notes.map((note) => (
                  <NoteRow
                    key={note.fsId}
                    note={note}
                    onOpen={onOpen}
                    onDelete={onDeleteNote}
                    isFav={favorites.includes(note.fsId)}
                    onToggleFav={onToggleFav}
                  />
                ))
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function NoteRow({
  note,
  onOpen,
  onDelete,
  isFav,
  onToggleFav,
}: {
  note: Note;
  onOpen: (note: Note) => void;
  onDelete: (note: Note) => void;
  isFav: boolean;
  onToggleFav: (fsid: number) => void;
}) {
  return (
    <article className="note-row">
      <button className="note-row-main" onClick={() => onOpen(note)}>
        <span className="note-title">{note.title}</span>
        <span className="note-meta">{formatTime(note.modifiedAt)}</span>
      </button>
      <button className={`note-fav ${isFav ? 'on' : 'off'}`} onClick={() => onToggleFav(note.fsId)} title={isFav ? '取消收藏' : '收藏'}>
        {isFav ? '★' : '☆'}
      </button>
      <button className="note-delete" onClick={() => onDelete(note)} title="删除笔记">×</button>
    </article>
  );
}
