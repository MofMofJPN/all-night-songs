/**
 * ui.js — 各画面のレンダリング
 *
 * カラスプレースホルダーについて:
 *   後日 PNG に差し替える予定。差し替え時は CROW_SVG を
 *   `<img src="assets/crow.png" alt="" class="crow-img">` に変更するか、
 *   CSS の --crow-image 変数を使う方式に切り替え可能。
 */

import { getSongs, getKanaSections, getSongById } from './data.js';
import {
  isFavorite, toggleFavorite,
  getListenRecord, recordListen,
  getFavorites, getListenHistory,
  getMemo, setMemo,
  exportData, importData, clearAllData,
} from './storage.js';

// メモ入力フォームのスタイルは style.css に記載
import { escapeHtml, showToast, copyToClipboard, shuffle } from './utils.js';

/* ---- カラス SVG（プレースホルダー） ---- */
const CROW_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 52"
     width="48" height="36" class="crow-svg" aria-hidden="true">
  <!-- 頭 -->
  <circle cx="18" cy="15" r="10" fill="currentColor"/>
  <!-- くちばし -->
  <polygon points="8,12 8,18 1,15" fill="currentColor"/>
  <!-- 胴体 -->
  <ellipse cx="42" cy="34" rx="18" ry="12" fill="currentColor"/>
  <!-- 首（頭と胴をつなぐ） -->
  <path d="M25,20 Q30,26 30,34 L35,34 Q35,26 33,20 Q27,15 25,20Z" fill="currentColor"/>
  <!-- 尾 -->
  <polygon points="58,28 70,20 70,42 58,38" fill="currentColor"/>
  <!-- 羽の線 -->
  <path d="M28,30 Q42,24 57,30" stroke="var(--color-bg)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- 目 -->
  <circle cx="14" cy="13" r="2.5" fill="var(--color-bg)"/>
</svg>`;

/* ---- 共通 HTML パーツ ---- */

function renderPageHeader(opts = {}) {
  const { backHref = '#/', backLabel = 'トップへ' } = opts;
  return `
    <header class="page-header">
      <div class="page-header__inner">
        <div class="site-logo">
          <a href="#/" class="logo-en" aria-label="ALL NIGHT SONGS トップへ">ALL NIGHT SONGS</a>
          <div class="logo-ja">ゑうたん歌リスト</div>
        </div>
        <div class="crow-area">${CROW_SVG}</div>
      </div>
    </header>`;
}

function renderSongCard(song, opts = {}) {
  const { showFav = true, showListen = true, showCopy = true,
          showShare = true, showStreaming = true } = opts;

  const fav = isFavorite(song.id);
  const listenRec = getListenRecord(song.id);
  const memo = getMemo(song.id);

  const tagsHtml = [
    ...song.tags.mood.map(t => `<span class="tag tag--mood">${escapeHtml(t)}</span>`),
    `<span class="tag tag--tempo">${escapeHtml(song.tags.tempo)}</span>`,
    ...song.tags.scene.map(t => `<span class="tag tag--scene">${escapeHtml(t)}</span>`),
    ...(song.keyAdjustment ? [`<span class="tag tag--key">Key: ${escapeHtml(song.keyAdjustment)}</span>`] : []),
    ...((song.status || []).map(s => `<span class="tag tag--status">${escapeHtml(s)}</span>`)),
  ].join('');

  const q = encodeURIComponent(`${song.title} ${song.artist}`);
  const spotifyUrl = `https://open.spotify.com/search/${q}`;
  const appleMusicUrl = `https://music.apple.com/jp/search?term=${q}`;
  const ytMusicUrl = `https://music.youtube.com/search?q=${q}`;

  const listenCount = listenRec ? `<span class="listen-count">🎤 ${listenRec.count}回</span>` : '';

  return `
    <div class="song-card" data-song-id="${escapeHtml(song.id)}">
      <div class="song-card__title">${escapeHtml(song.title)} ${listenCount}</div>
      <div class="song-card__artist">${escapeHtml(song.artist)}</div>
      <div class="song-card__meta">
        <div class="tags">${tagsHtml}</div>
        ${memo ? `<div class="song-card__note">📝 ${escapeHtml(memo)}</div>` : ''}
        ${song.note ? `<div class="song-card__note">${escapeHtml(song.note)}</div>` : ''}
      </div>
      <div class="song-card__actions">
        ${showFav ? `
          <button class="btn btn-secondary btn-icon fav-btn" data-id="${escapeHtml(song.id)}"
            aria-label="${fav ? 'お気に入りから削除' : 'お気に入りに追加'}"
            aria-pressed="${fav}">
            ${fav ? '❤️' : '🤍'}
          </button>` : ''}
        ${showListen ? `
          <button class="btn btn-secondary btn-icon listen-btn" data-id="${escapeHtml(song.id)}"
            aria-label="聴いた記録を追加">✅</button>` : ''}
        <button class="btn btn-secondary btn-icon memo-btn" data-id="${escapeHtml(song.id)}"
          aria-label="メモを編集" aria-expanded="false">📝</button>
        ${showCopy ? `
          <button class="btn btn-secondary btn-icon copy-btn" data-id="${escapeHtml(song.id)}"
            aria-label="リクエスト文をコピー">📋</button>` : ''}
        ${showShare ? `
          <button class="btn btn-secondary share-btn" data-id="${escapeHtml(song.id)}"
            aria-label="Xでシェア">🐦</button>` : ''}
        ${showStreaming ? `
          <a href="${spotifyUrl}" target="_blank" rel="noopener noreferrer"
            class="btn btn-secondary btn-icon" aria-label="Spotifyで検索">🎧</a>
          <a href="${appleMusicUrl}" target="_blank" rel="noopener noreferrer"
            class="btn btn-secondary btn-icon" aria-label="Apple Musicで検索">🍎</a>
          <a href="${ytMusicUrl}" target="_blank" rel="noopener noreferrer"
            class="btn btn-secondary btn-icon" aria-label="YouTube Musicで検索">▶️</a>` : ''}
      </div>
      <div class="memo-area" id="memo-area-${escapeHtml(song.id)}" hidden>
        <textarea class="memo-textarea" rows="2"
          placeholder="メモを入力（自分用のメモです）..."
          data-id="${escapeHtml(song.id)}"
          aria-label="メモ入力">${escapeHtml(memo)}</textarea>
        <div class="memo-area__actions">
          <button class="btn btn-secondary memo-save" data-id="${escapeHtml(song.id)}">保存</button>
          <button class="btn btn-secondary memo-cancel" data-id="${escapeHtml(song.id)}">キャンセル</button>
        </div>
      </div>
    </div>`;
}

/* ---- ソングカードのイベント登録（共通） ---- */
export function bindSongCardEvents(container, onUpdate) {
  // 同じコンテナに重複してリスナーが積まれないよう、前回分を除去
  if (container._songCardListener) {
    container.removeEventListener('click', container._songCardListener);
  }

  const handler = async (e) => {
    const favBtn = e.target.closest('.fav-btn');
    const listenBtn = e.target.closest('.listen-btn');
    const memoBtn = e.target.closest('.memo-btn');
    const memoSave = e.target.closest('.memo-save');
    const memoCancel = e.target.closest('.memo-cancel');
    const copyBtn = e.target.closest('.copy-btn');
    const shareBtn = e.target.closest('.share-btn');

    if (memoBtn) {
      const id = memoBtn.dataset.id;
      const area = container.querySelector(`#memo-area-${id}`);
      if (!area) return;
      const open = area.hidden;
      area.hidden = !open;
      memoBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        area.querySelector('.memo-textarea')?.focus();
      }
    }

    if (memoSave) {
      const id = memoSave.dataset.id;
      const area = container.querySelector(`#memo-area-${id}`);
      const textarea = area?.querySelector('.memo-textarea');
      if (!textarea) return;
      setMemo(id, textarea.value);
      area.hidden = true;
      // メモ表示を更新
      const card = container.querySelector(`.song-card[data-song-id="${id}"]`);
      if (card) {
        const noteEl = card.querySelector('.memo-display');
        const metaEl = card.querySelector('.song-card__meta');
        const text = textarea.value.trim();
        if (noteEl) {
          noteEl.textContent = text ? `📝 ${text}` : '';
          noteEl.hidden = !text;
        } else if (text && metaEl) {
          const div = document.createElement('div');
          div.className = 'song-card__note memo-display';
          div.textContent = `📝 ${text}`;
          metaEl.appendChild(div);
        }
      }
      showToast('📝 メモを保存しました');
    }

    if (memoCancel) {
      const id = memoCancel.dataset.id;
      const area = container.querySelector(`#memo-area-${id}`);
      if (area) {
        area.hidden = true;
        // テキストを保存前の値に戻す
        const textarea = area.querySelector('.memo-textarea');
        if (textarea) textarea.value = getMemo(id);
      }
    }

    if (favBtn) {
      const id = favBtn.dataset.id;
      const added = toggleFavorite(id);
      favBtn.textContent = added ? '❤️' : '🤍';
      favBtn.setAttribute('aria-pressed', String(added));
      favBtn.setAttribute('aria-label', added ? 'お気に入りから削除' : 'お気に入りに追加');
      showToast(added ? '❤️ お気に入りに追加しました' : '🤍 お気に入りから削除しました');
      if (onUpdate) onUpdate(id);
    }

    if (listenBtn) {
      const id = listenBtn.dataset.id;
      const rec = recordListen(id);
      showToast(`✅ 記録しました（${rec.count}回目）`);
      // カード内のカウント表示を更新
      const card = listenBtn.closest('.song-card');
      if (card) {
        const titleEl = card.querySelector('.song-card__title');
        if (titleEl) {
          const song = getSongById(id);
          if (song) {
            const countEl = titleEl.querySelector('.listen-count');
            const newCount = `<span class="listen-count">🎤 ${rec.count}回</span>`;
            if (countEl) {
              countEl.outerHTML = newCount;
            } else {
              titleEl.insertAdjacentHTML('beforeend', newCount);
            }
          }
        }
      }
      if (onUpdate) onUpdate(id);
    }

    if (copyBtn) {
      const id = copyBtn.dataset.id;
      const song = getSongById(id);
      if (song) {
        const text = `${song.title} お願いします🎤`;
        const ok = await copyToClipboard(text);
        showToast(ok ? '📋 コピーしました' : 'コピーに失敗しました');
      }
    }

    if (shareBtn) {
      const id = shareBtn.dataset.id;
      const song = getSongById(id);
      if (song) {
        const text = `今夜の1曲は「${song.title}」/ ${song.artist} 🌙\nゑうたんさんに歌ってほしい！\n#ゑうえうに #ALLNIGHTSONGS\n${location.origin}${location.pathname}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  container._songCardListener = handler;
  container.addEventListener('click', handler);
}

/* ================================================================
   トップページ
   ================================================================ */
export function renderHome(container) {
  container.innerHTML = `
    <div class="page page-home">
      ${renderPageHeader()}
      <main class="home-main" id="homeMain">
        <div class="home-hero">
          <p class="home-catchphrase">1曲どうぞ</p>
          <a href="#/quiz" class="btn btn-primary" aria-label="気分診断を始める">
            [ 今夜の1曲を探す ]
          </a>
        </div>
        <nav class="home-subnav" aria-label="メニュー">
          <div class="subnav-grid">
            <a href="#/songs" class="btn btn-secondary">[ 全曲リスト ]</a>
            <a href="#/favorites" class="btn btn-secondary">[ お気に入り ]</a>
            <a href="#/history" class="btn btn-secondary">[ 聴いた記録 ]</a>
            <a href="#/shuffle" class="btn btn-secondary">[ シャッフル ]</a>
          </div>
          <a href="#/about" class="btn btn-secondary btn-about">[ About ]</a>
        </nav>
      </main>
      <footer class="page-footer">
        <p>一ファンによる非公式サイト</p>
      </footer>
    </div>`;
}

/* ================================================================
   クイズ画面
   ================================================================ */

const QUIZ_QUESTIONS = [
  {
    key: 'mood',
    question: '今の気分は？',
    options: ['切ない', 'エモい', '元気・前向き', '盛り上がる', 'クール・かっこいい', '優しい・癒し'],
  },
  {
    key: 'tempo',
    question: 'テンポは？',
    options: ['スロー', 'ミドル', 'アップ'],
  },
  {
    key: 'scene',
    question: 'どんなシーンで聴きたい？',
    options: ['しっとり聴きたい', '一緒に盛り上がりたい', '泣きたい夜', '朝・お出かけ気分'],
  },
];

export function renderQuiz(container, answers = {}, currentStep = 0) {
  const q = QUIZ_QUESTIONS[currentStep];
  const total = QUIZ_QUESTIONS.length;
  const progressPct = Math.round((currentStep / total) * 100);

  container.innerHTML = `
    <div class="page page-quiz">
      ${renderPageHeader()}
      <div class="page-content">
        <div class="quiz-progress">Q.${currentStep + 1} / ${total}</div>
        <div class="quiz-progress-bar" role="progressbar"
          aria-valuenow="${currentStep}" aria-valuemin="0" aria-valuemax="${total}">
          <div class="quiz-progress-bar__fill" style="width: ${progressPct}%"></div>
        </div>
        <p class="quiz-question">${escapeHtml(q.question)}</p>
        <div class="quiz-options" role="group" aria-label="${escapeHtml(q.question)}">
          ${q.options.map(opt => `
            <button class="quiz-option ${answers[q.key] === opt ? 'selected' : ''}"
              data-value="${escapeHtml(opt)}" data-key="${escapeHtml(q.key)}">
              ${escapeHtml(opt)}
            </button>`).join('')}
        </div>
        ${currentStep > 0 ? `
          <button class="quiz-back" id="quizBack">
            ← 前の質問に戻る
          </button>` : ''}
      </div>
    </div>`;

  // オプション選択
  container.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      const key = btn.dataset.key;
      const newAnswers = { ...answers, [key]: value };

      if (currentStep < total - 1) {
        // 次の質問へ（短いアニメーション用に一瞬待つ）
        btn.classList.add('selected');
        setTimeout(() => renderQuiz(container, newAnswers, currentStep + 1), 150);
      } else {
        // 全問回答 → 結果へ
        btn.classList.add('selected');
        setTimeout(() => {
          // navigate を main.js 経由で使うためカスタムイベントで通知
          container.dispatchEvent(new CustomEvent('quiz-complete', {
            bubbles: true,
            detail: { answers: newAnswers },
          }));
        }, 150);
      }
    });
  });

  // 戻るボタン
  const backBtn = container.querySelector('#quizBack');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      renderQuiz(container, answers, currentStep - 1);
    });
  }
}

/* ================================================================
   結果画面
   ================================================================ */
export function renderResult(container, answers, results) {
  const { perfect, close } = results;
  const allSongs = [...perfect, ...close];

  const perfectHtml = perfect.length > 0
    ? perfect.map(s => renderSongCard(s)).join('')
    : '';

  const closeHtml = close.length > 0
    ? close.map(s => renderSongCard(s)).join('')
    : '';

  const noResultsHtml = allSongs.length === 0
    ? `<div class="result-empty">
         <p>🌙 ぴったりの曲が見つかりませんでした。</p>
         <p>別の気分で試してみてください。</p>
       </div>` : '';

  // 0件時の代替テキスト
  const fallbackNotice = perfect.length === 0 && close.length > 0 && allSongs.length > 0
    ? `<p class="text-muted text-center" style="font-size:12px;margin-bottom:16px;">
         ぴったりな曲が見つからなかったので、気分が近い曲をご紹介します
       </p>` : '';

  container.innerHTML = `
    <div class="page page-result">
      ${renderPageHeader()}
      <div class="page-content">
        <h2 class="page-title">🌙 今夜の1曲</h2>
        ${fallbackNotice}
        ${noResultsHtml}

        ${perfect.length > 0 ? `
          <section class="result-section" aria-label="ピッタリの曲">
            <div class="result-section__heading result-section__heading--perfect">
              🎯 <span class="heading-label">ピッタリの曲</span>
            </div>
            <div class="result-section__songs" id="perfectSongs">
              ${perfectHtml}
            </div>
          </section>` : ''}

        ${close.length > 0 ? `
          <section class="result-section" aria-label="近い雰囲気の曲">
            <div class="result-section__heading">
              ✨ 近い雰囲気の曲
            </div>
            <div class="result-section__songs" id="closeSongs">
              ${closeHtml}
            </div>
          </section>` : ''}

        <div class="result-actions">
          <div class="result-actions-row">
            <a href="#/quiz" class="btn btn-secondary">[ もう一度診断 ]</a>
            <a href="#/" class="btn btn-secondary">[ トップへ ]</a>
          </div>
        </div>
      </div>
    </div>`;

  bindSongCardEvents(container);
}

/* ================================================================
   全曲リスト
   ================================================================ */
export function renderSongs(container) {
  const songs = getSongs();
  const kanaSections = getKanaSections();

  // 状態管理（ローカル）
  let searchQuery = '';
  let activeKana = 'すべて';
  let activeFilters = { mood: new Set(), tempo: new Set(), scene: new Set(), status: new Set() };
  let filterOpen = false;

  function getFiltered() {
    let result = songs;
    if (activeKana !== 'すべて') {
      result = result.filter(s => s.kanaSection === activeKana);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      );
    }
    if (activeFilters.mood.size) {
      result = result.filter(s => s.tags.mood.some(m => activeFilters.mood.has(m)));
    }
    if (activeFilters.tempo.size) {
      result = result.filter(s => activeFilters.tempo.has(s.tags.tempo));
    }
    if (activeFilters.scene.size) {
      result = result.filter(s => s.tags.scene.some(sc => activeFilters.scene.has(sc)));
    }
    if (activeFilters.status.size) {
      result = result.filter(s =>
        s.status && s.status.some(st => activeFilters.status.has(st))
      );
    }
    return result;
  }

  const MOODS = ['切ない', 'エモい', '元気・前向き', '盛り上がる', 'クール・かっこいい', '優しい・癒し'];
  const TEMPOS = ['スロー', 'ミドル', 'アップ'];
  const SCENES = ['しっとり聴きたい', '一緒に盛り上がりたい', '泣きたい夜', '朝・お出かけ気分'];
  const STATUSES = ['1番のみ', '練習中'];

  function renderFilterChips(values, filterKey) {
    return values.map(v => `
      <button class="filter-chip ${activeFilters[filterKey].has(v) ? 'active' : ''}"
        data-filter-key="${filterKey}" data-filter-val="${escapeHtml(v)}">
        ${escapeHtml(v)}
      </button>`).join('');
  }

  function renderList() {
    const filtered = getFiltered();
    const countEl = container.querySelector('#songsCount');
    if (countEl) countEl.textContent = `${filtered.length}曲`;

    const listEl = container.querySelector('#songsList');
    if (!listEl) return;
    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="songs-empty">😶 該当する曲が見つかりませんでした</div>`;
    } else {
      listEl.innerHTML = filtered.map(s => renderSongCard(s)).join('');
    }
  }

  function renderFilterPanel() {
    const panel = container.querySelector('#filterPanel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="filter-group">
        <div class="filter-group__label">気分</div>
        <div class="filter-group__options">${renderFilterChips(MOODS, 'mood')}</div>
      </div>
      <div class="filter-group">
        <div class="filter-group__label">テンポ</div>
        <div class="filter-group__options">${renderFilterChips(TEMPOS, 'tempo')}</div>
      </div>
      <div class="filter-group">
        <div class="filter-group__label">シーン</div>
        <div class="filter-group__options">${renderFilterChips(SCENES, 'scene')}</div>
      </div>
      <div class="filter-group">
        <div class="filter-group__label">状態</div>
        <div class="filter-group__options">${renderFilterChips(STATUSES, 'status')}</div>
      </div>`;
  }

  container.innerHTML = `
    <div class="page page-songs">
      ${renderPageHeader()}
      <div class="page-content">
        <h2 class="page-title">🎵 全曲リスト</h2>
        <div class="search-bar">
          <span class="search-bar__icon" aria-hidden="true">🔍</span>
          <input type="search" class="search-bar__input" id="searchInput"
            placeholder="曲名・アーティスト名で検索" aria-label="曲を検索"
            value="${escapeHtml(searchQuery)}">
        </div>
        <div class="kana-index" role="tablist" aria-label="五十音インデックス">
          <button class="kana-btn active" data-kana="すべて" role="tab"
            aria-selected="true">すべて</button>
          ${kanaSections.map(k => `
            <button class="kana-btn" data-kana="${k}" role="tab"
              aria-selected="false">${k}</button>`).join('')}
        </div>
        <button class="filter-toggle" id="filterToggle" aria-expanded="${filterOpen}">
          <span>🔧 絞り込み</span>
          <span id="filterArrow">${filterOpen ? '▲' : '▼'}</span>
        </button>
        <div id="filterPanel" class="filter-panel" ${filterOpen ? '' : 'hidden'}></div>
        <div class="songs-count">
          <span id="songsCount">${songs.length}曲</span>
        </div>
        <div class="songs-list" id="songsList"></div>
      </div>
    </div>`;

  renderFilterPanel();
  renderList();
  bindSongCardEvents(container);

  // 検索
  const searchInput = container.querySelector('#searchInput');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderList();
  });

  // 五十音タブ
  container.querySelectorAll('.kana-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeKana = btn.dataset.kana;
      container.querySelectorAll('.kana-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.kana === activeKana);
        b.setAttribute('aria-selected', b.dataset.kana === activeKana ? 'true' : 'false');
      });
      renderList();
    });
  });

  // フィルタートグル
  container.querySelector('#filterToggle').addEventListener('click', () => {
    filterOpen = !filterOpen;
    const panel = container.querySelector('#filterPanel');
    const arrow = container.querySelector('#filterArrow');
    panel.hidden = !filterOpen;
    arrow.textContent = filterOpen ? '▲' : '▼';
    container.querySelector('#filterToggle').setAttribute('aria-expanded', String(filterOpen));
  });

  // フィルターチップ（重複リスナー防止のため古い参照を先に除去）
  if (container._filterChipListener) {
    container.removeEventListener('click', container._filterChipListener);
  }
  const filterChipHandler = (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const key = chip.dataset.filterKey;
    const val = chip.dataset.filterVal;
    if (activeFilters[key].has(val)) {
      activeFilters[key].delete(val);
    } else {
      activeFilters[key].add(val);
    }
    renderFilterPanel();
    renderList();
  };
  container._filterChipListener = filterChipHandler;
  container.addEventListener('click', filterChipHandler);
}

/* ================================================================
   お気に入り
   ================================================================ */
export function renderFavorites(container) {
  function render() {
    const favs = getFavorites();
    const allSongs = getSongs();

    const favSongs = favs
      .map(f => {
        const song = allSongs.find(s => s.id === f.songId);
        return song ? { song, addedAt: f.addedAt } : null;
      })
      .filter(Boolean);

    const listHtml = favSongs.length > 0
      ? favSongs.map(({ song, addedAt }) => `
          <div class="fav-entry">
            ${renderSongCard(song)}
            <div class="fav-date text-muted" style="font-size:11px;text-align:right;margin-top:4px;">
              ❤️ ${new Date(addedAt).toLocaleDateString('ja-JP')}
            </div>
          </div>`).join('')
      : `<div class="empty-state">
           まだお気に入りがありません。<br>
           診断や全曲リストから ❤️ を押して追加しよう
         </div>`;

    const listEl = container.querySelector('#favList');
    const countEl = container.querySelector('.section-count');
    if (listEl) {
      listEl.innerHTML = listHtml;
      if (countEl) countEl.textContent = `お気に入り ${favSongs.length}曲`;
    } else {
      container.innerHTML = `
        <div class="page page-favorites">
          ${renderPageHeader()}
          <div class="page-content">
            <h2 class="page-title">❤️ お気に入り</h2>
            <p class="section-count">お気に入り ${favSongs.length}曲</p>
            <div id="favList">${listHtml}</div>
          </div>
        </div>`;
      bindSongCardEvents(container, () => render());
    }
  }

  render();
}

/* ================================================================
   聴いた記録
   ================================================================ */
export function renderHistory(container) {
  const songs = getSongs();
  const history = getListenHistory();

  // 最後に聴いた日の新しい順に並べる
  const entries = Object.entries(history)
    .map(([songId, rec]) => {
      const song = songs.find(s => s.id === songId);
      return song ? { song, ...rec } : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastListened) - new Date(a.lastListened));

  const totalCount = entries.reduce((sum, e) => sum + e.count, 0);

  const milestoneHtml = totalCount >= 50
    ? `<div class="milestone">🏆 累計 ${totalCount} 回達成！</div>`
    : totalCount >= 20
    ? `<div class="milestone">🌟 累計 ${totalCount} 回！</div>`
    : '';

  const listHtml = entries.length > 0
    ? entries.map(({ song, count, lastListened }) => `
        <div class="history-entry" style="margin-bottom:10px;">
          ${renderSongCard(song, { showShare: false })}
          <div style="font-size:11px;text-align:right;margin-top:4px;color:var(--color-text-muted);">
            🎤 ${count}回 / 最後: ${new Date(lastListened).toLocaleDateString('ja-JP')}
          </div>
        </div>`).join('')
    : `<div class="empty-state">
         まだ記録がありません。<br>
         ゑうたんに歌ってもらえたら、✅ を押して記録しよう
       </div>`;

  container.innerHTML = `
    <div class="page page-history">
      ${renderPageHeader()}
      <div class="page-content">
        <h2 class="page-title">🌙 歌ってもらった曲リスト</h2>
        <p class="section-count">記録 ${entries.length}曲 / 累計 ${totalCount}回</p>
        ${milestoneHtml}
        <div id="historyList">${listHtml}</div>
      </div>
    </div>`;

  bindSongCardEvents(container);
}

/* ================================================================
   About / 設定
   ================================================================ */
export function renderAbout(container) {
  container.innerHTML = `
    <div class="page page-about">
      ${renderPageHeader()}
      <div class="page-content">
        <h2 class="page-title">🌙 About</h2>

        <section class="about-section">
          <h3 class="about-section__title">このサイトについて</h3>
          <div class="about-notice">
            <p>ゑうたんが歌える曲リストから、今夜の気分にぴったりの1曲をご提案するサイトです。</p>
            <br>
            <p style="font-size:12px;color:var(--color-text-muted);">
              このサイトは MofMofJPN が一ファンとして作ったものです。<br>
              ゑうたん公式ではありません。
            </p>
          </div>
        </section>

        <section class="about-section">
          <h3 class="about-section__title">💾 データについて</h3>
          <div class="about-notice">
            <p>お気に入り・聴いた記録は、現在お使いのブラウザに保存されています。</p>
            <br>
            <p>⚠️ ご注意ください</p>
            <ul style="padding-left:1.2em;line-height:2;">
              <li>スマホとPCなど、端末をまたいで見ることはできません</li>
              <li>ブラウザの履歴・キャッシュを消すと、保存データも消えます</li>
              <li>シークレットモード／プライベートブラウジングでは保存されません</li>
              <li>容量や設定により、自動で消えることがあります</li>
            </ul>
            <br>
            <p>📥 大切なデータは、下のボタンから書き出し（エクスポート）できます。</p>
          </div>
        </section>

        <section class="about-section">
          <h3 class="about-section__title">🌱 検討中の機能</h3>
          <ul>
            <li>クラウド保存（端末をまたいで使えるように）</li>
            <li>みんなのお気に入りランキング</li>
          </ul>
        </section>

        <section class="about-section">
          <h3 class="about-section__title">データ管理</h3>
          <div class="about-actions">
            <button class="btn btn-secondary" id="exportBtn">📤 データを書き出す（JSON）</button>
            <label class="btn btn-secondary" style="cursor:pointer;">
              📥 データを読み込む（JSON）
              <input type="file" id="importFile" accept=".json" style="display:none">
            </label>
            <button class="btn btn-danger" id="clearBtn">🗑️ データを全削除</button>
          </div>
        </section>

      </div>
    </div>`;

  // エクスポート
  container.querySelector('#exportBtn').addEventListener('click', () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `all-night-songs-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 書き出しました');
  });

  // インポート
  container.querySelector('#importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        importData(json, 'overwrite');
        showToast('📥 データを読み込みました');
        renderAbout(container);
      } catch (err) {
        showToast('❌ 読み込みに失敗しました: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // 全削除
  container.querySelector('#clearBtn').addEventListener('click', () => {
    showConfirmModal(
      '🗑️ データを全削除',
      'お気に入り・聴いた記録・メモをすべて削除します。この操作は元に戻せません。',
      () => {
        clearAllData();
        showToast('🗑️ データを削除しました');
      }
    );
  });
}

/* ================================================================
   シャッフル（オーバーレイ表示）
   ================================================================ */
export function renderShuffle(container) {
  const songs = getSongs();
  if (!songs.length) {
    showToast('曲データを読み込み中...');
    return;
  }

  const showRandomSong = () => {
    const song = shuffle(songs)[0];
    const overlay = document.getElementById('shuffleOverlay');
    if (overlay) overlay.remove();

    const div = document.createElement('div');
    div.id = 'shuffleOverlay';
    div.className = 'shuffle-overlay';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-label', 'シャッフル結果');
    div.innerHTML = `
      <div class="shuffle-card">
        <div class="shuffle-card__label">🎲 シャッフル</div>
        <div class="shuffle-card__title">${escapeHtml(song.title)}</div>
        <div class="shuffle-card__artist">${escapeHtml(song.artist)}</div>
        <div class="tags" style="justify-content:center;margin-bottom:20px;">
          ${song.tags.mood.map(t => `<span class="tag tag--mood">${escapeHtml(t)}</span>`).join('')}
          <span class="tag tag--tempo">${escapeHtml(song.tags.tempo)}</span>
        </div>
        <div class="shuffle-card__actions">
          <button class="btn btn-primary" id="shuffleAgain">[ もう1曲 ]</button>
          <button class="btn btn-secondary btn-icon" id="shuffleCopy"
            aria-label="リクエスト文をコピー">📋</button>
          <button class="btn btn-secondary" id="shuffleClose">[ 閉じる ]</button>
        </div>
      </div>`;

    document.body.appendChild(div);

    div.querySelector('#shuffleAgain').addEventListener('click', showRandomSong);
    div.querySelector('#shuffleCopy').addEventListener('click', async () => {
      const text = `${song.title} お願いします🎤`;
      const ok = await copyToClipboard(text);
      showToast(ok ? '📋 コピーしました' : 'コピーに失敗しました');
    });
    div.querySelector('#shuffleClose').addEventListener('click', () => {
      div.remove();
      window.history.back();
    });
    div.addEventListener('click', (e) => {
      if (e.target === div) {
        div.remove();
        window.history.back();
      }
    });
  };

  showRandomSong();
  // ルーターがページを更新しないよう、ホームに戻しつつオーバーレイを表示
  renderHome(container);
}

/* ================================================================
   確認モーダル（汎用）
   ================================================================ */
export function showConfirmModal(title, body, onConfirm) {
  const existing = document.getElementById('confirmModal');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'confirmModal';
  div.className = 'modal-overlay';
  div.setAttribute('role', 'dialog');
  div.setAttribute('aria-modal', 'true');
  div.setAttribute('aria-labelledby', 'modalTitle');
  div.innerHTML = `
    <div class="modal">
      <div class="modal__title" id="modalTitle">${escapeHtml(title)}</div>
      <div class="modal__body">${escapeHtml(body)}</div>
      <div class="modal__actions">
        <button class="btn btn-secondary" id="modalCancel">キャンセル</button>
        <button class="btn btn-danger" id="modalConfirm">削除する</button>
      </div>
    </div>`;

  document.body.appendChild(div);

  div.querySelector('#modalCancel').addEventListener('click', () => div.remove());
  div.querySelector('#modalConfirm').addEventListener('click', () => {
    div.remove();
    onConfirm();
  });
  div.addEventListener('click', (e) => {
    if (e.target === div) div.remove();
  });
}

/* ================================================================
   初回ウェルカムモーダル
   ================================================================ */
export function showWelcomeModal(onClose) {
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.setAttribute('role', 'dialog');
  div.setAttribute('aria-modal', 'true');
  div.setAttribute('aria-labelledby', 'welcomeTitle');
  div.innerHTML = `
    <div class="modal">
      <div class="modal__title" id="welcomeTitle">🌙 ALL NIGHT SONGSへようこそ</div>
      <div class="modal__body">
        ゑうたんが歌える曲の中から、<br>
        今夜の気分にぴったりの1曲をご提案します。<br>
        <br>
        💾 お気に入りや聴いた記録は、<br>
        このブラウザ内に保存されます。<br>
        <span style="font-size:12px;color:var(--color-text-muted);">
          （詳しくは「About」をご覧ください）
        </span>
      </div>
      <div class="modal__actions">
        <button class="btn btn-primary" id="welcomeStart">[ はじめる ]</button>
      </div>
    </div>`;

  document.body.appendChild(div);

  div.querySelector('#welcomeStart').addEventListener('click', () => {
    div.remove();
    onClose();
  });
}
