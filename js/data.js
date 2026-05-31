/**
 * data.js — 曲データの読み込みと参照
 */

let songsCache = null;

/**
 * songs.json を読み込んでキャッシュ
 * @returns {Promise<Array>}
 */
export async function loadSongs() {
  if (songsCache) return songsCache;
  try {
    const response = await fetch('./data/songs.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    songsCache = await response.json();
    return songsCache;
  } catch (err) {
    console.error('[data] songs.json の読み込みに失敗しました:', err);
    console.info('[data] ローカルで開く場合は HTTP サーバーが必要です（例: npx serve .）');
    songsCache = [];
    return songsCache;
  }
}

/**
 * キャッシュ済みの曲データを返す
 * loadSongs() を先に呼ぶこと
 * @returns {Array}
 */
export function getSongs() {
  return songsCache ?? [];
}

/**
 * IDで1曲を取得
 * @param {string} id
 * @returns {object|undefined}
 */
export function getSongById(id) {
  return getSongs().find(s => s.id === id);
}

/**
 * 五十音インデックスのセクション一覧（データにあるもの）
 * @returns {string[]}
 */
export function getKanaSections() {
  const all = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'];
  const present = new Set(getSongs().map(s => s.kanaSection));
  return all.filter(k => present.has(k));
}
