/**
 * main.js — エントリーポイント・ルーティング
 */

import { loadSongs } from './data.js';
import { generateStars } from './utils.js';
import { getMatches } from './matching.js';
import { setLastResults, hasSeenWelcome, markWelcomeSeen } from './storage.js';
import {
  renderHome,
  renderQuiz,
  renderResult,
  renderSongs,
  renderFavorites,
  renderHistory,
  renderAbout,
  renderShuffle,
  showWelcomeModal,
} from './ui.js';

// ---- 星を生成 ----
generateStars(document.getElementById('starsBg'), 80);

const app = document.getElementById('app');

// ---- ルーティング ----
function route() {
  const hash = window.location.hash.slice(1) || '/';

  switch (hash) {
    case '/':
      renderHome(app);
      break;
    case '/songs':
      renderSongs(app);
      break;
    case '/favorites':
      renderFavorites(app);
      break;
    case '/history':
      renderHistory(app);
      break;
    case '/about':
      renderAbout(app);
      break;
    case '/quiz':
      renderQuiz(app, {}, 0);
      break;
    case '/shuffle':
      renderShuffle(app);
      break;
    default:
      if (hash.startsWith('/result')) {
        // 結果画面は init() が呼ぶため、ここでは何もしない
      } else {
        renderHome(app);
      }
  }

  // スクロールをトップへ
  window.scrollTo(0, 0);
}

// ---- クイズ完了イベントのリスナー ----
document.addEventListener('quiz-complete', (e) => {
  const { answers } = e.detail;
  const results = getMatches(answers);

  // 直前の結果を保存（重複回避）
  const allShown = [...results.perfect, ...results.close].map(s => s.id);
  setLastResults(allShown);

  // 結果画面へ
  renderResult(app, answers, results);
  window.location.hash = '#/result';
});

// ---- 初期化 ----
async function init() {
  await loadSongs();

  window.addEventListener('hashchange', route);
  route();

  // 初回モーダル
  if (!hasSeenWelcome()) {
    showWelcomeModal(() => markWelcomeSeen());
  }
}

init();
