/**
 * utils.js — ユーティリティ関数
 */

/**
 * 星をランダムに生成してコンテナに追加
 * @param {HTMLElement} container
 * @param {number} count
 */
export function generateStars(container, count = 80) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    const size = Math.random() * 2 + 0.5;
    const delay = Math.random() * 6;
    const duration = 3 + Math.random() * 4;
    star.className = 'star';
    star.style.cssText =
      `left:${(Math.random() * 100).toFixed(2)}%;` +
      `top:${(Math.random() * 100).toFixed(2)}%;` +
      `width:${size.toFixed(2)}px;` +
      `height:${size.toFixed(2)}px;` +
      `--delay:${delay.toFixed(2)}s;` +
      `--duration:${duration.toFixed(2)}s;`;
    fragment.appendChild(star);
  }
  container.appendChild(fragment);
}

/**
 * HTMLエスケープ
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * ISO日時を "YYYY/MM/DD" 形式に
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

/**
 * ISO日時を "MM/DD HH:mm" 形式に
 * @param {string} isoString
 * @returns {string}
 */
export function formatDateTime(isoString) {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${h}:${min}`;
}

/**
 * トースト表示
 * @param {string} message
 * @param {number} duration ms
 */
export function showToast(message, duration = 2200) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/**
 * 配列をシャッフル（Fisher–Yates）
 * @param {Array} arr
 * @returns {Array} 新しい配列
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * テキストをクリップボードにコピー
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallthrough to legacy
    }
  }
  // Fallback for older browsers/non-HTTPS
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}
