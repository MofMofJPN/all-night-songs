/**
 * matching.js — マッチングロジック
 */

import { getSongs } from './data.js';
import { getLastResults } from './storage.js';
import { shuffle } from './utils.js';

/**
 * 1曲のスコア計算
 * 気分: +2点, テンポ: +1点, シーン: +1点
 * @param {object} song
 * @param {{ mood: string, tempo: string, scene: string }} answers
 * @returns {number} 0–4
 */
export function calculateScore(song, answers) {
  let score = 0;
  if (song.tags.mood.includes(answers.mood)) score += 2;
  if (song.tags.tempo === answers.tempo) score += 1;
  if (song.tags.scene.includes(answers.scene)) score += 1;
  return score;
}

/**
 * マッチング実行
 * @param {{ mood: string, tempo: string, scene: string }} answers
 * @returns {{ perfect: object[], close: object[] }}
 *   perfect: スコア4点, close: スコア3点以下（合計5曲）
 */
export function getMatches(answers) {
  const songs = getSongs();
  const excluded = new Set(getLastResults());

  // スコア計算（除外対象を除く）
  let scored = songs
    .filter(s => !excluded.has(s.id))
    .map(s => ({ song: s, score: calculateScore(s, answers) }));

  // スコア降順・同点はシャッフルで公平に
  scored = shuffle(scored).sort((a, b) => b.score - a.score);

  // 上位5曲
  let top5 = scored.slice(0, 5);

  // 全部スコア0（理論上ほぼ起きない）→ 気分軸のみで再検索
  if (top5.every(x => x.score === 0)) {
    const fallback = shuffle(
      songs
        .filter(s => !excluded.has(s.id) && s.tags.mood.includes(answers.mood))
    ).slice(0, 5);

    if (fallback.length > 0) {
      top5 = fallback.map(s => ({ song: s, score: 2 }));
    } else {
      // それでも0件ならランダム5曲
      top5 = shuffle(songs.filter(s => !excluded.has(s.id)))
        .slice(0, 5)
        .map(s => ({ song: s, score: 0 }));
    }
  }

  const perfect = top5.filter(x => x.score >= 4).map(x => x.song);
  const close = top5.filter(x => x.score < 4).map(x => x.song);

  return { perfect, close };
}
