/**
 * storage.js — LocalStorage 操作
 * プレフィックス: "ans:"
 */

const PREFIX = 'ans:';

function key(name) {
  return PREFIX + name;
}

function safeGet(name, fallback) {
  try {
    const raw = localStorage.getItem(key(name));
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(name, value) {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ---- お気に入り ---- */

export function getFavorites() {
  return safeGet('favorites', []);
}

export function addFavorite(songId) {
  const favs = getFavorites().filter(f => f.songId !== songId);
  favs.unshift({ songId, addedAt: new Date().toISOString() });
  safeSet('favorites', favs);
}

export function removeFavorite(songId) {
  const favs = getFavorites().filter(f => f.songId !== songId);
  safeSet('favorites', favs);
}

export function isFavorite(songId) {
  return getFavorites().some(f => f.songId === songId);
}

export function toggleFavorite(songId) {
  if (isFavorite(songId)) {
    removeFavorite(songId);
    return false;
  } else {
    addFavorite(songId);
    return true;
  }
}

/* ---- 聴いた記録 ---- */

export function getListenHistory() {
  return safeGet('listenHistory', {});
}

export function recordListen(songId) {
  const history = getListenHistory();
  const now = new Date().toISOString();
  if (history[songId]) {
    history[songId].count += 1;
    history[songId].lastListened = now;
  } else {
    history[songId] = {
      count: 1,
      firstListened: now,
      lastListened: now,
    };
  }
  safeSet('listenHistory', history);
  return history[songId];
}

export function removeListen(songId) {
  const history = getListenHistory();
  delete history[songId];
  safeSet('listenHistory', history);
}

export function getListenRecord(songId) {
  return getListenHistory()[songId] ?? null;
}

/* ---- メモ ---- */

export function getMemos() {
  return safeGet('memos', {});
}

export function getMemo(songId) {
  return getMemos()[songId] ?? '';
}

export function setMemo(songId, text) {
  const memos = getMemos();
  if (text.trim()) {
    memos[songId] = text;
  } else {
    delete memos[songId];
  }
  safeSet('memos', memos);
}

/* ---- 直前の診断結果（重複回避用） ---- */

export function getLastResults() {
  return safeGet('lastResults', []);
}

export function setLastResults(songIds) {
  safeSet('lastResults', songIds);
}

/* ---- 初回モーダル ---- */

export function hasSeenWelcome() {
  return safeGet('hasSeenWelcome', false);
}

export function markWelcomeSeen() {
  safeSet('hasSeenWelcome', true);
}

/* ---- エクスポート / インポート ---- */

export function exportData() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      favorites: getFavorites(),
      listenHistory: getListenHistory(),
      memos: getMemos(),
    },
  };
}

export function importData(json, mode = 'overwrite') {
  if (!json || json.version !== '1.0' || !json.data) {
    throw new Error('無効なデータ形式です');
  }
  const { favorites, listenHistory, memos } = json.data;
  if (mode === 'overwrite') {
    if (favorites) safeSet('favorites', favorites);
    if (listenHistory) safeSet('listenHistory', listenHistory);
    if (memos) safeSet('memos', memos);
  } else {
    // merge: 既存データに追記
    if (favorites) {
      const existing = getFavorites();
      const existingIds = new Set(existing.map(f => f.songId));
      const merged = [...existing, ...favorites.filter(f => !existingIds.has(f.songId))];
      safeSet('favorites', merged);
    }
    if (listenHistory) {
      const existing = getListenHistory();
      for (const [id, rec] of Object.entries(listenHistory)) {
        if (existing[id]) {
          existing[id].count += rec.count;
          if (rec.lastListened > existing[id].lastListened) {
            existing[id].lastListened = rec.lastListened;
          }
        } else {
          existing[id] = rec;
        }
      }
      safeSet('listenHistory', existing);
    }
    if (memos) {
      const existing = getMemos();
      safeSet('memos', { ...existing, ...memos });
    }
  }
}

export function clearAllData() {
  ['favorites', 'listenHistory', 'memos', 'lastResults', 'hasSeenWelcome'].forEach(name => {
    try {
      localStorage.removeItem(key(name));
    } catch { /* ignore */ }
  });
}
