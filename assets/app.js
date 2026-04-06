const DATA = Array.isArray(window.INTERVIEW_DATA) ? window.INTERVIEW_DATA : [];
const STORAGE_KEYS = {
  prefs: 'interviewPrepPrefs-v1',
  states: 'cardStates',
  legacyStates: 'mastered',
};
const DEFAULT_PREFS = {
  mode: 'card',
  catV: 'all',
  difV: 'all',
  unmV: false,
  rndV: false,
  searchV: '',
};
const DIFF_LABELS = {
  easy: '基础',
  medium: '进阶',
  hard: '深入',
};
const VALID_DIFFS = new Set(['all', 'easy', 'medium', 'hard']);
const VALID_MODES = new Set(['card', 'list']);

const $ = (id) => document.getElementById(id);

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function normalizeScore(value) {
  const score = Number(value);
  return score === 1 || score === 2 || score === 3 ? score : 0;
}

function hashText(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function makeStableId(category, question) {
  return `q-${hashText(`${category}::${question}`)}`;
}

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const all = DATA.flatMap((category, catIndex) =>
  category.items.map((item, itemIndex) => ({
    id: item.id || makeStableId(category.cat, item.q),
    legacyId: `${catIndex}-${itemIndex}`,
    cat: category.cat,
    ci: catIndex,
    icon: category.icon,
    color: category.color,
    q: item.q,
    a: item.a,
    diff: item.diff,
    tags: Array.isArray(item.tags) ? item.tags : [],
    searchText: `${item.q} ${item.a}`.toLowerCase(),
  }))
);

const validQuestionIds = new Set(all.map((item) => item.id));
const legacyIdMap = new Map(all.map((item) => [item.legacyId, item.id]));

function migrateState() {
  const rawStates = safeParse(STORAGE_KEYS.states, {});
  const legacyStates = safeParse(STORAGE_KEYS.legacyStates, {});
  const migrated = {};
  let changed = false;

  Object.entries(legacyStates || {}).forEach(([legacyKey, value]) => {
    if (value && !rawStates[legacyKey]) {
      rawStates[legacyKey] = 3;
      changed = true;
    }
  });

  if (Object.keys(legacyStates || {}).length) {
    safeRemove(STORAGE_KEYS.legacyStates);
    changed = true;
  }

  Object.entries(rawStates || {}).forEach(([key, value]) => {
    const normalized = normalizeScore(value);
    if (!normalized) {
      changed = true;
      return;
    }
    const nextKey = validQuestionIds.has(key) ? key : legacyIdMap.get(key);
    if (!nextKey) {
      changed = true;
      return;
    }
    if (!migrated[nextKey] || normalized > migrated[nextKey]) {
      migrated[nextKey] = normalized;
    }
    if (nextKey !== key) {
      changed = true;
    }
  });

  if (changed) {
    safeSet(STORAGE_KEYS.states, JSON.stringify(migrated));
  }

  return migrated;
}

function sanitizePrefs(rawPrefs) {
  const next = { ...DEFAULT_PREFS };
  if (!rawPrefs || typeof rawPrefs !== 'object') {
    return next;
  }

  if (VALID_MODES.has(rawPrefs.mode)) {
    next.mode = rawPrefs.mode;
  }
  if (rawPrefs.catV === 'all' || DATA[Number(rawPrefs.catV)]) {
    next.catV = String(rawPrefs.catV);
  }
  if (VALID_DIFFS.has(rawPrefs.difV)) {
    next.difV = rawPrefs.difV;
  }
  next.unmV = Boolean(rawPrefs.unmV);
  next.rndV = Boolean(rawPrefs.rndV);
  if (typeof rawPrefs.searchV === 'string') {
    next.searchV = rawPrefs.searchV.slice(0, 120);
  }
  return next;
}

function savePrefs() {
  safeSet(
    STORAGE_KEYS.prefs,
    JSON.stringify({
      mode,
      catV,
      difV,
      unmV,
      rndV,
      searchV,
    })
  );
}

function loadPrefs() {
  return sanitizePrefs(safeParse(STORAGE_KEYS.prefs, DEFAULT_PREFS));
}

let S = migrateState();
let { mode, catV, difV, unmV, rndV, searchV } = loadPrefs();
let idx = 0;
let cards = [];
let flipped = false;

function filteredCards() {
  const query = searchV.trim().toLowerCase();
  let next = all.filter((item) => {
    if (catV !== 'all' && String(item.ci) !== String(catV)) {
      return false;
    }
    if (difV !== 'all' && item.diff !== difV) {
      return false;
    }
    if (unmV && (S[item.id] || 0) >= 3) {
      return false;
    }
    if (query && !item.searchText.includes(query)) {
      return false;
    }
    return true;
  });

  if (rndV) {
    next = shuffle(next);
  }

  return next;
}

function summaryText() {
  const parts = [];
  if (catV !== 'all') {
    parts.push(DATA[Number(catV)]?.cat || '当前分类');
  }
  if (difV !== 'all') {
    parts.push(DIFF_LABELS[difV]);
  }
  if (unmV) {
    parts.push('未掌握');
  }
  if (searchV.trim()) {
    parts.push(`搜索 "${searchV.trim()}"`);
  }
  if (rndV) {
    parts.push('随机顺序');
  }
  return parts.length ? parts.join(' · ') : '全部题目';
}

function syncModeButtons() {
  document.querySelectorAll('[data-m]').forEach((button) => {
    button.classList.toggle('on', button.dataset.m === mode);
  });
  $('app').className = mode === 'list' ? 'app mode-ls' : 'app';
}

function syncDifficultyButtons() {
  document.querySelectorAll('[data-d]').forEach((button) => {
    button.classList.toggle('on', button.dataset.d === difV);
  });
}

function syncCategoryTabs() {
  document.querySelectorAll('.cat-tab').forEach((button) => {
    button.classList.toggle('on', button.dataset.c === String(catV));
  });
}

function syncSearchUi() {
  $('sI').value = searchV;
  $('clrSearchB').disabled = !searchV.trim();
  const searchTag = $('searchTagB');
  if (searchV.trim()) {
    searchTag.classList.remove('hidden');
    searchTag.classList.add('on');
    searchTag.textContent = `搜索: ${searchV.trim()} ×`;
  } else {
    searchTag.classList.add('hidden');
    searchTag.classList.remove('on');
    searchTag.textContent = '';
  }
}

function syncToggleButtons() {
  $('unmB').classList.toggle('on', unmV);
  $('rndB').classList.toggle('on', rndV);
}

function renderFC() {
  if (!cards.length) {
    $('bgs').innerHTML = '';
    $('qt').textContent = '没有匹配的题目';
    document.querySelector('.qh').textContent = '调整筛选条件';
    $('ans').innerHTML = '';
    $('nC').textContent = '0 / 0';
    $('chT').textContent = '';
    $('chT2').textContent = '';
    $('pB').disabled = true;
    $('nB').disabled = true;
    unflip();
    return;
  }

  const current = cards[idx];
  const score = S[current.id] || 0;
  let badges = '';

  current.tags.forEach((tag) => {
    if (tag === 'project') {
      badges += '<span class="bg bg-p">简历项目</span>';
    }
    if (tag === 'scene') {
      badges += '<span class="bg bg-s">场景题</span>';
    }
  });

  if (score === 3) {
    badges += '<span class="bg" style="background:var(--green-bg);color:var(--green);border-color:rgba(92,184,122,.12)">已掌握</span>';
  } else if (score === 2) {
    badges += '<span class="bg" style="background:var(--orange-bg);color:var(--orange);border-color:rgba(212,148,60,.12)">模糊</span>';
  } else if (score === 1) {
    badges += '<span class="bg" style="background:var(--red-bg);color:var(--red);border-color:rgba(199,95,95,.12)">不会</span>';
  }

  $('chT').textContent = `${current.icon} ${current.cat} · ${DIFF_LABELS[current.diff]}`;
  $('chT2').textContent = `${current.icon} ${current.cat} · 答案`;
  $('bgs').innerHTML = badges;
  $('qt').textContent = current.q;
  $('ans').innerHTML = current.a;
  $('nC').textContent = `${idx + 1} / ${cards.length}`;
  document.querySelector('.qh').textContent = 'click to flip';
  $('pB').disabled = idx === 0;
  $('nB').disabled = idx >= cards.length - 1;
  unflip();
}

function renderLS() {
  const container = $('lsC');
  const meta = $('lsMeta');
  container.innerHTML = '';

  meta.textContent = `当前筛选 ${cards.length} 题 · ${summaryText()}`;

  if (!cards.length) {
    container.innerHTML = '<div class="empty-state">没有匹配的题目，试试清空搜索或切换筛选条件。</div>';
    return;
  }

  const grouped = new Map();
  cards.forEach((item) => {
    if (!grouped.has(item.ci)) {
      grouped.set(item.ci, {
        ci: item.ci,
        cat: item.cat,
        icon: item.icon,
        color: item.color,
        items: [],
      });
    }
    grouped.get(item.ci).items.push(item);
  });

  let questionNumber = 0;
  grouped.forEach((group) => {
    const section = document.createElement('div');
    section.className = 'csec';
    section.innerHTML = `<div class="chdr" onclick="togC(${group.ci})"><div class="cico" style="background:${group.color}12;color:${group.color}">${group.icon}</div><div class="cnam" style="color:${group.color}">${group.cat}</div><div class="ccnt">${group.items.length}</div><div class="carr" id="ar-${group.ci}">▼</div></div><div class="ql" id="ql-${group.ci}"></div>`;
    container.appendChild(section);
    const list = section.querySelector('.ql');

    group.items.forEach((item) => {
      questionNumber += 1;
      const score = S[item.id] || 0;
      const tags = item.tags
        .map((tag) => {
          if (tag === 'project') {
            return '<span class="qtg tp">项目</span>';
          }
          if (tag === 'scene') {
            return '<span class="qtg ts">场景</span>';
          }
          return '';
        })
        .join('');
      const card = document.createElement('div');
      card.className = `qc${score === 3 ? ' done' : ''}`;
      card.id = `qc-${item.id}`;
      card.innerHTML = `<div class="qr" onclick="togA('${item.id}')"><span class="qn">${questionNumber}</span><span class="qtx">${item.q}</span><div class="qts">${tags}<span class="qtg t${item.diff[0]}">${DIFF_LABELS[item.diff]}</span></div><div class="qck ${score === 3 ? 'ck' : ''}" onclick="event.stopPropagation();togS('${item.id}')">${score === 3 ? '✓' : ''}</div></div><div class="qa" id="qa-${item.id}">${item.a}</div>`;
      list.appendChild(card);
    });
  });
}

function stats() {
  const total = cards.length;
  let mastered = 0;
  let fuzzy = 0;
  let unknown = 0;

  cards.forEach((item) => {
    const score = S[item.id] || 0;
    if (score === 3) {
      mastered += 1;
    } else if (score === 2) {
      fuzzy += 1;
    } else if (score === 1) {
      unknown += 1;
    }
  });

  $('s-t').textContent = `${total} 题`;
  $('s-p').textContent = `${mastered} 掌握`;
  $('s-z').textContent = `${fuzzy} 模糊`;
  $('s-f').textContent = `${unknown} 不会`;
  $('pL').textContent = `已掌握 ${mastered} / ${total}`;
  const percent = total ? Math.round((mastered / total) * 100) : 0;
  $('pP').textContent = `${percent}%`;
  $('pF').style.width = `${percent}%`;
}

function apply() {
  cards = filteredCards();
  idx = Math.min(idx, Math.max(cards.length - 1, 0));
  syncModeButtons();
  syncCategoryTabs();
  syncDifficultyButtons();
  syncToggleButtons();
  syncSearchUi();
  if (mode === 'card') {
    renderFC();
  } else {
    renderLS();
  }
  stats();
  savePrefs();
}

function saveState() {
  safeSet(STORAGE_KEYS.states, JSON.stringify(S));
}

function flip() {
  if (!cards.length) {
    return;
  }
  $('fc').classList.toggle('flip');
  flipped = !flipped;
}

function unflip() {
  $('fc').classList.remove('flip');
  flipped = false;
}

function prev() {
  if (idx > 0) {
    idx -= 1;
    renderFC();
  }
}

function next() {
  if (idx < cards.length - 1) {
    idx += 1;
    renderFC();
  }
}

function rate(level) {
  if (!cards.length) {
    return;
  }
  S[cards[idx].id] = level;
  saveState();
  if (unmV && level === 3) {
    apply();
    return;
  }
  stats();
  if (mode === 'list') {
    renderLS();
    return;
  }
  if (idx < cards.length - 1) {
    idx += 1;
  }
  renderFC();
}

function togA(id) {
  $(`qa-${id}`)?.classList.toggle('open');
}

function togC(ci) {
  $(`ql-${ci}`)?.classList.toggle('hidden');
  $(`ar-${ci}`)?.classList.toggle('shut');
}

function expAll() {
  document.querySelectorAll('.qa').forEach((answer) => answer.classList.add('open'));
  document.querySelectorAll('.ql').forEach((list) => list.classList.remove('hidden'));
  document.querySelectorAll('.carr').forEach((arrow) => arrow.classList.remove('shut'));
}

function colAll() {
  document.querySelectorAll('.qa').forEach((answer) => answer.classList.remove('open'));
}

function togS(id) {
  S[id] = (S[id] || 0) === 3 ? 0 : 3;
  if (!S[id]) {
    delete S[id];
  }
  saveState();
  if (unmV && S[id] === 3) {
    apply();
    return;
  }
  renderLS();
  stats();
}

function rstP() {
  if (!confirm('确定重置当前浏览器中的学习进度？')) {
    return;
  }
  S = {};
  safeRemove(STORAGE_KEYS.states);
  apply();
}

function buildCategoryTabs() {
  const tabs = $('catF');
  let html = '<button type="button" class="cat-tab" data-c="all">全部</button>';
  DATA.forEach((category, index) => {
    html += `<button type="button" class="cat-tab" data-c="${index}">${category.icon} ${category.cat}</button>`;
  });
  tabs.innerHTML = html;

  tabs.querySelectorAll('.cat-tab').forEach((button) => {
    button.addEventListener('click', () => {
      catV = button.dataset.c;
      idx = 0;
      apply();
    });
  });
}

function clearSearch() {
  if (!searchV.trim()) {
    return;
  }
  searchV = '';
  idx = 0;
  apply();
}

document.querySelectorAll('[data-d]').forEach((button) => {
  button.addEventListener('click', () => {
    difV = button.dataset.d;
    idx = 0;
    apply();
  });
});

document.querySelectorAll('[data-m]').forEach((button) => {
  button.addEventListener('click', () => {
    mode = button.dataset.m;
    idx = 0;
    apply();
  });
});

$('unmB').addEventListener('click', () => {
  unmV = !unmV;
  idx = 0;
  apply();
});

$('rndB').addEventListener('click', () => {
  rndV = !rndV;
  idx = 0;
  apply();
});

$('searchTagB').addEventListener('click', clearSearch);
$('clrSearchB').addEventListener('click', clearSearch);
$('sI').addEventListener('input', (event) => {
  searchV = event.target.value;
  idx = 0;
  apply();
});

$('fcF').addEventListener('click', () => {
  if (!flipped) {
    flip();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.activeElement === $('sI')) {
    clearSearch();
    return;
  }
  if (mode !== 'card' || event.target.tagName === 'INPUT') {
    return;
  }
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    flip();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    prev();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    next();
  } else if (event.key === '1') {
    rate(1);
  } else if (event.key === '2') {
    rate(2);
  } else if (event.key === '3') {
    rate(3);
  }
});

let touchStartX = 0;
let touchStartY = 0;
const flashcard = $('fc');

flashcard.addEventListener(
  'touchstart',
  (event) => {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  },
  { passive: true }
);

flashcard.addEventListener('touchend', (event) => {
  const deltaX = event.changedTouches[0].screenX - touchStartX;
  const deltaY = event.changedTouches[0].screenY - touchStartY;
  if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
    if (deltaX > 0) {
      prev();
    } else {
      next();
    }
  }
});

Object.assign(window, {
  flip,
  prev,
  next,
  rate,
  togA,
  togC,
  expAll,
  colAll,
  togS,
  rstP,
});

buildCategoryTabs();
apply();
