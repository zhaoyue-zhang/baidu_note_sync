const KEYS = {
  darkMode: 'baidu-notes-dark',
  favorites: 'baidu-notes-favorites',
  sortMode: 'baidu-notes-sort',
} as const;

export const settings = {
  isDark(): boolean {
    try {
      return localStorage.getItem(KEYS.darkMode) === '1';
    } catch {
      return false;
    }
  },

  setDark(on: boolean) {
    try {
      localStorage.setItem(KEYS.darkMode, on ? '1' : '0');
    } catch {}
    applyDark(on);
  },

  getSortMode(): string {
    try {
      return localStorage.getItem(KEYS.sortMode) || 'modified';
    } catch {
      return 'modified';
    }
  },

  setSortMode(mode: string) {
    try {
      localStorage.setItem(KEYS.sortMode, mode);
    } catch {}
  },

  getFavorites(): number[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.favorites) || '[]');
    } catch {
      return [];
    }
  },

  addFavorite(fsid: number) {
    const list = this.getFavorites();
    if (!list.includes(fsid)) {
      list.push(fsid);
      localStorage.setItem(KEYS.favorites, JSON.stringify(list));
    }
  },

  removeFavorite(fsid: number) {
    const list = this.getFavorites().filter((id) => id !== fsid);
    localStorage.setItem(KEYS.favorites, JSON.stringify(list));
  },

  isFavorite(fsid: number): boolean {
    return this.getFavorites().includes(fsid);
  },

  applyStoredTheme() {
    applyDark(this.isDark());
  },
};

function applyDark(on: boolean) {
  document.documentElement.classList.toggle('dark', on);
}
