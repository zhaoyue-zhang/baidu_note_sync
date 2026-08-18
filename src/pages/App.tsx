import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NoteList } from '../components/NoteList';
import { TopBar } from '../components/TopBar';
import { api } from '../services/api';
import { clearSessionToken, isAuthed, setSessionToken } from '../services/session';
import { settings } from '../services/settings';
import { formatTime } from '../services/format';
import type { Note, NoteGroup, SortMode } from '../types/notes';

type View =
  | { name: 'login' }
  | { name: 'list' }
  | { name: 'editor'; mode: 'create'; group?: string }
  | { name: 'editor'; mode: 'edit'; note: Note };

type Toast = {
  type: 'ok' | 'error' | 'info';
  message: string;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function sortNotes(notes: Note[], mode: SortMode): Note[] {
  const sorted = [...notes];
  switch (mode) {
    case 'created':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh'));
    default:
      return sorted.sort((a, b) => b.modifiedAt - a.modifiedAt);
  }
}

export function App() {
  const [view, setView] = useState<View>(() => initialView());
  const [toast, setToast] = useState<Toast | null>(null);
  const [dark, setDark] = useState(() => settings.isDark());

  useEffect(() => { settings.applyStoredTheme(); }, []);

  const toggleDark = useCallback(() => {
    const next = !dark;
    setDark(next);
    settings.setDark(next);
  }, [dark]);

  useEffect(() => {
    const current = new URL(window.location.href);
    if (current.pathname === '/auth/callback') {
      const session = current.searchParams.get('session');
      const error = current.searchParams.get('error');
      if (session) {
        setSessionToken(session);
        history.replaceState(null, '', '/');
        setToast({ type: 'ok', message: '授权成功' });
        setView({ name: 'list' });
      } else {
        history.replaceState(null, '', '/login');
        setToast({ type: 'error', message: error || '授权失败' });
        setView({ name: 'login' });
      }
    }
  }, []);

  return (
    <main className="app-shell">
      {view.name === 'login' ? (
        <LoginPage />
      ) : view.name === 'list' ? (
        <ListPage
          onEdit={(note) => setView({ name: 'editor', mode: 'edit', note })}
          onCreate={(group) => setView({ name: 'editor', mode: 'create', group })}
          onLogout={() => {
            clearSessionToken();
            setView({ name: 'login' });
          }}
          showToast={setToast}
          dark={dark}
          onToggleDark={toggleDark}
        />
      ) : (
        <EditorPage
          view={view}
          onBack={() => setView({ name: 'list' })}
          showToast={setToast}
        />
      )}
      {toast ? <ToastView toast={toast} onDone={() => setToast(null)} /> : null}
    </main>
  );
}

function initialView(): View {
  const url = new URL(window.location.href);
  if (url.pathname === '/auth/callback') return { name: 'login' };
  return isAuthed() ? { name: 'list' } : { name: 'login' };
}

function LoginPage() {
  const hasApi = Boolean(import.meta.env.VITE_API_BASE_URL);
  return (
    <section className="login-page">
      <div className="brand-mark">记</div>
      <h1>网盘笔记</h1>
      <p>连接百度网盘后，笔记会存放在你的应用数据目录中。</p>
      <button className="primary-btn" disabled={!hasApi} onClick={() => window.location.assign(api.authUrl())}>
        百度授权登录
      </button>
      {!hasApi ? <p className="inline-error">请先配置 VITE_API_BASE_URL</p> : null}
    </section>
  );
}

function ListPage({
  onEdit,
  onCreate,
  onLogout,
  showToast,
  dark,
  onToggleDark,
}: {
  onEdit: (note: Note) => void;
  onCreate: (group?: string) => void;
  onLogout: () => void;
  showToast: (toast: Toast) => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const [groups, setGroups] = useState<NoteGroup[]>([]);
  const [rootNotes, setRootNotes] = useState<Note[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ __root__: true });
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>(() => settings.getSortMode() as SortMode);
  const [favs, setFavs] = useState<number[]>(() => settings.getFavorites());
  const searchRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const tree = await api.getTree();
      setGroups(tree.groups);
      setRootNotes(tree.rootNotes);
      setExpanded((old) => ({
        __root__: old.__root__ ?? true,
        ...Object.fromEntries(tree.groups.map((group) => [group.name, old[group.name] ?? false])),
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); }
      if (mod && e.key === 'n') { e.preventDefault(); onCreate(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCreate]);

  const sortedRoot = useMemo(() => sortNotes(rootNotes, sortMode), [rootNotes, sortMode]);
  const sortedGroups = useMemo(
    () => groups.map((g) => ({ ...g, notes: sortNotes(g.notes, sortMode) })),
    [groups, sortMode],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return { groups: sortedGroups, rootNotes: sortedRoot };
    return {
      rootNotes: sortedRoot.filter((n) => n.title.toLowerCase().includes(kw)),
      groups: sortedGroups
        .map((g) => ({ ...g, notes: g.notes.filter((n) => n.title.toLowerCase().includes(kw)) }))
        .filter((g) => g.notes.length > 0 || g.name.toLowerCase().includes(kw)),
    };
  }, [sortedGroups, keyword, sortedRoot]);

  const allNotes = useMemo(
    () => [...filtered.rootNotes, ...filtered.groups.flatMap((g) => g.notes)],
    [filtered],
  );

  const favoriteNotes = useMemo(
    () => allNotes.filter((n) => favs.includes(n.fsId)),
    [allNotes, favs],
  );

  const total = rootNotes.length + groups.reduce((sum, g) => sum + g.notes.length, 0);

  const createGroup = async () => {
    const name = groupName.trim();
    if (!name) return;
    try {
      await api.createGroup(name);
      setGroupName('');
      showToast({ type: 'ok', message: '分组已创建' });
      load();
    } catch (err) {
      showToast({ type: 'error', message: (err as Error).message });
    }
  };

  const deleteNote = async (note: Note) => {
    if (!confirm(`确定删除「${note.title}」？`)) return;
    try {
      await api.deleteNote(note);
      showToast({ type: 'ok', message: '已删除' });
      load();
    } catch (err) {
      showToast({ type: 'error', message: (err as Error).message });
    }
  };

  const deleteGroup = async (name: string) => {
    if (!confirm(`确定删除分组「${name}」及其所有笔记？`)) return;
    try {
      await api.deleteGroup(name);
      showToast({ type: 'ok', message: '已删除' });
      load();
    } catch (err) {
      showToast({ type: 'error', message: (err as Error).message });
    }
  };

  const toggleFav = (fsid: number) => {
    const next = favs.includes(fsid)
      ? favs.filter((id) => id !== fsid)
      : [...favs, fsid];
    setFavs(next);
    if (favs.includes(fsid)) {
      settings.removeFavorite(fsid);
    } else {
      settings.addFavorite(fsid);
    }
  };

  const changeSort = (mode: SortMode) => {
    setSortMode(mode);
    settings.setSortMode(mode);
  };

  const createDaily = () => {
    const today = todayStr();
    const diaryGroup = groups.find((g) => g.name === '日记本');
    const existing = diaryGroup?.notes.find((n) => n.title === today);
    if (existing) {
      onEdit(existing);
    } else {
      onCreate('日记本', today);
    }
  };

  return (
    <section className="list-page">
      <TopBar
        title="网盘笔记"
        subtitle={`${total} 篇笔记`}
        left={<button className="ghost-btn" onClick={load}>刷新</button>}
        right={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="theme-toggle" onClick={onToggleDark} title="切换主题">
              {dark ? '☀' : '☾'}
            </button>
            <button className="ghost-btn" onClick={onLogout}>退出</button>
          </div>
        }
      />

      <div className="toolbar">
        <input ref={searchRef} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索标题 (⌘K)" />
        <button className="primary-btn compact" onClick={() => onCreate()} title="新建笔记 (⌘N)">新建</button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="secondary-btn compact" style={{ minHeight: 32, fontSize: 13 }} onClick={createDaily}>
          今日日记
        </button>
        <div className="sort-bar">
          <span>排序</span>
          <button className={`sort-btn ${sortMode === 'modified' ? 'active' : ''}`} onClick={() => changeSort('modified')}>最近</button>
          <button className={`sort-btn ${sortMode === 'created' ? 'active' : ''}`} onClick={() => changeSort('created')}>最早</button>
          <button className={`sort-btn ${sortMode === 'title' ? 'active' : ''}`} onClick={() => changeSort('title')}>标题</button>
        </div>
      </div>

      <div className="group-create">
        <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="新分组名称" />
        <button className="secondary-btn" onClick={createGroup}>创建分组</button>
      </div>

      {loading ? <div className="state-box">加载中...</div> : null}
      {error ? <div className="state-box error">{error}</div> : null}
      {!loading && !error && total === 0 ? <div className="state-box">还没有笔记</div> : null}

      {!loading && !error && favoriteNotes.length > 0 && (
        <section className="note-group-card">
          <div className="group-header" style={{ color: '#f59e0b' }}>
            <span className="group-chevron">★</span>
            <span className="group-label">收藏</span>
            <span className="group-count">{favoriteNotes.length}</span>
          </div>
          <div className="group-notes">
            {favoriteNotes.map((note) => (
              <NoteRow
                key={note.fsId}
                note={note}
                onOpen={onEdit}
                onDelete={deleteNote}
                isFav={true}
                onToggleFav={toggleFav}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && !error ? (
        <NoteList
          rootNotes={filtered.rootNotes}
          groups={filtered.groups}
          expanded={expanded}
          onToggleGroup={(name) => setExpanded((old) => ({ ...old, [name]: !old[name] }))}
          onOpen={onEdit}
          onDeleteNote={deleteNote}
          onDeleteGroup={deleteGroup}
          favorites={favs}
          onToggleFav={toggleFav}
        />
      ) : null}
    </section>
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

function EditorPage({
  view,
  onBack,
  showToast,
}: {
  view: Extract<View, { name: 'editor' }>;
  onBack: () => void;
  showToast: (toast: Toast) => void;
}) {
  const editNote = view.mode === 'edit' ? view.note : null;
  const [title, setTitle] = useState(editNote?.title || '');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(Boolean(editNote));

  useEffect(() => {
    if (!editNote) return;
    let alive = true;
    api.getNote(editNote.fsId)
      .then((data) => {
        if (!alive) return;
        setTitle(data.note.title || editNote.title);
        setBody(data.content || '');
      })
      .catch((err) => showToast({ type: 'error', message: (err as Error).message }))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <section className="editor-page">
      <TopBar
        title={editNote ? '编辑笔记' : '新建笔记'}
        left={<button className="ghost-btn" onClick={onBack}>返回</button>}
      />
      {loading ? (
        <div className="state-box">加载中...</div>
      ) : (
        <div style={{ padding: 16 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题"
            style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8, fontSize: 16 }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="正文"
            style={{ display: 'block', width: '100%', minHeight: 300, padding: 8, fontSize: 14 }}
          />
        </div>
      )}
    </section>
  );
}

function ToastView({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2400);
    return () => window.clearTimeout(timer);
  }, [onDone]);
  return <div className={`toast ${toast.type}`}>{toast.message}</div>;
}
