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
  tagV: 'all',
  unmV: false,
  rndV: false,
  searchV: '',
  mockPool: 'mastered',
  mockSize: 5,
};
const DIFF_LABELS = {
  easy: '基础',
  medium: '进阶',
  hard: '深入',
};
const VALID_DIFFS = new Set(['all', 'easy', 'medium', 'hard']);
const VALID_MODES = new Set(['card', 'list', 'mock']);
const VALID_MOCK_POOLS = new Set(['mastered', 'fuzzy', 'mixed']);
const VALID_MOCK_SIZES = new Set([5, 8, 12]);
const TAG_FILTERS = [
  { id: 'all', label: '全部标签' },
  { id: 'project', label: '简历项目' },
  { id: 'scene', label: '场景题' },
];
const VALID_TAGS = new Set(TAG_FILTERS.map((tag) => tag.id));
const SCORE_LABELS = {
  0: '未标记',
  1: '不会',
  2: '模糊',
  3: '掌握',
};
const MOCK_POOL_LABELS = {
  mastered: '掌握回顾',
  fuzzy: '冲刺提升',
  mixed: '真实混合',
  review: '薄弱回炉',
};
const MOCK_POOL_HINTS = {
  mastered: '默认从当前已掌握题里抽题，检查自己是不是真的能像面试一样讲出来。',
  fuzzy: '优先抽当前标记为模糊的题，逼自己把“知道一点”练成“能回答顺”。',
  mixed: '按 7:3 混合已掌握和模糊题，更接近真实面试时的出题节奏。',
};

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
  if (VALID_TAGS.has(rawPrefs.tagV)) {
    next.tagV = rawPrefs.tagV;
  }
  next.unmV = Boolean(rawPrefs.unmV);
  next.rndV = Boolean(rawPrefs.rndV);
  if (typeof rawPrefs.searchV === 'string') {
    next.searchV = rawPrefs.searchV.slice(0, 120);
  }
  if (VALID_MOCK_POOLS.has(rawPrefs.mockPool)) {
    next.mockPool = rawPrefs.mockPool;
  }
  if (VALID_MOCK_SIZES.has(Number(rawPrefs.mockSize))) {
    next.mockSize = Number(rawPrefs.mockSize);
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
      tagV,
      unmV,
      rndV,
      searchV,
      mockPool,
      mockSize,
    })
  );
}

function loadPrefs() {
  return sanitizePrefs(safeParse(STORAGE_KEYS.prefs, DEFAULT_PREFS));
}

let S = migrateState();
let { mode, catV, difV, tagV, unmV, rndV, searchV, mockPool, mockSize } = loadPrefs();
let idx = 0;
let cards = [];
let flipped = false;
let mockSession = null;
let mockIndex = 0;
let mockRevealed = false;
let mockTicker = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function scoreLabel(score) {
  return SCORE_LABELS[normalizeScore(score)] || SCORE_LABELS[0];
}

function scoreTone(score) {
  if (score === 3) {
    return 'p';
  }
  if (score === 2) {
    return 'z';
  }
  if (score === 1) {
    return 'f';
  }
  return 'n';
}

function scopeCards() {
  const query = searchV.trim().toLowerCase();
  return all.filter((item) => {
    if (catV !== 'all' && String(item.ci) !== String(catV)) {
      return false;
    }
    if (difV !== 'all' && item.diff !== difV) {
      return false;
    }
    if (tagV !== 'all' && !item.tags.includes(tagV)) {
      return false;
    }
    if (query && !item.searchText.includes(query)) {
      return false;
    }
    return true;
  });
}

function filteredCards() {
  let next = scopeCards();

  if (unmV) {
    next = next.filter((item) => (S[item.id] || 0) < 3);
  }
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
  if (tagV !== 'all') {
    parts.push(TAG_FILTERS.find((tag) => tag.id === tagV)?.label || '标签筛选');
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
  $('app').className =
    mode === 'list'
      ? 'app mode-ls'
      : mode === 'mock'
        ? 'app mode-mk'
        : 'app';
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

function syncTagButtons() {
  document.querySelectorAll('.tag-chip').forEach((button) => {
    button.classList.toggle('on', button.dataset.tag === tagV);
  });
}

function syncSearchUi() {
  $('sI').value = searchV;
  const clearButton = $('clrSearchB');
  const hasSearch = Boolean(searchV.trim());
  clearButton.disabled = !hasSearch;
  clearButton.title = hasSearch ? '清空当前搜索关键词' : '当前没有可清空的搜索关键词';
  $('lsHint').textContent = hasSearch
    ? `当前搜索关键词为“${searchV.trim()}”，可以点击“清空搜索”恢复完整结果。`
    : '输入关键词后可以快速筛题；当前没有可清空的搜索条件。';
  const searchTag = $('searchTagB');
  if (hasSearch) {
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
  const ignoreStudyToggles = mode === 'mock';
  const unmButton = $('unmB');
  const rndButton = $('rndB');
  const navHint = $('navHint');

  unmButton.classList.toggle('on', !ignoreStudyToggles && unmV);
  rndButton.classList.toggle('on', !ignoreStudyToggles && rndV);
  unmButton.disabled = ignoreStudyToggles;
  rndButton.disabled = ignoreStudyToggles;
  unmButton.title = ignoreStudyToggles ? '模拟面试模式会忽略“未掌握”开关' : '';
  rndButton.title = ignoreStudyToggles ? '模拟面试模式会忽略“随机”开关' : '';
  navHint.textContent = ignoreStudyToggles
    ? '模拟面试模式中，“未掌握”和“随机”开关会暂时禁用，只继承分类、难度和搜索范围。'
    : '';
}

function getMockAvailability() {
  const scoped = scopeCards();
  const mastered = scoped.filter((item) => (S[item.id] || 0) === 3);
  const fuzzy = scoped.filter((item) => (S[item.id] || 0) === 2);

  return {
    scoped,
    mastered,
    fuzzy,
  };
}

function buildMockDeck() {
  const { mastered, fuzzy } = getMockAvailability();

  if (mockPool === 'mastered') {
    return shuffle(mastered).slice(0, mockSize);
  }

  if (mockPool === 'fuzzy') {
    return shuffle(fuzzy).slice(0, mockSize);
  }

  const selected = [];
  const masteredTarget = Math.min(mastered.length, Math.max(1, Math.round(mockSize * 0.7)));
  const fuzzyTarget = Math.min(fuzzy.length, mockSize - masteredTarget);

  selected.push(...shuffle(mastered).slice(0, masteredTarget));
  selected.push(...shuffle(fuzzy).slice(0, fuzzyTarget));

  if (selected.length < mockSize) {
    const fallback = shuffle([...mastered, ...fuzzy].filter((item) => !selected.includes(item)));
    selected.push(...fallback.slice(0, mockSize - selected.length));
  }

  return shuffle(selected);
}

function createMockSession(deck, pool = mockPool) {
  if (!deck.length) {
    mockSession = null;
    mockIndex = 0;
    mockRevealed = false;
    renderMock();
    return;
  }

  const now = Date.now();
  mockSession = {
    pool,
    requestedSize: deck.length,
    startedAt: now,
    completedAt: null,
    items: deck.map((item, index) => ({
      item,
      initialScore: S[item.id] || 0,
      resultScore: null,
      startedAt: index === 0 ? now : null,
      durationMs: 0,
    })),
  };
  mockIndex = 0;
  mockRevealed = false;
  startMockTicker();
  renderMock();
}

function getCurrentMockEntry() {
  return mockSession?.items?.[mockIndex] || null;
}

function updateMockTimers() {
  if (
    mode !== 'mock' ||
    !mockSession ||
    mockSession.completedAt
  ) {
    return;
  }

  const entry = getCurrentMockEntry();
  $('mkTotalTimer').textContent = `总时长 ${formatDuration(Date.now() - mockSession.startedAt)}`;
  $('mkQuestionTimer').textContent = `本题 ${formatDuration(entry?.startedAt ? Date.now() - entry.startedAt : 0)}`;
}

function startMockTicker() {
  if (mockTicker || mode !== 'mock' || !mockSession || mockSession.completedAt) {
    return;
  }
  mockTicker = window.setInterval(updateMockTimers, 1000);
  updateMockTimers();
}

function stopMockTicker() {
  if (mockTicker) {
    window.clearInterval(mockTicker);
    mockTicker = null;
  }
}

function startMockSession() {
  const deck = buildMockDeck();
  createMockSession(deck, mockPool);
}

function restartMockSession() {
  startMockSession();
}

function restartWeakMockSession() {
  if (!mockSession?.completedAt) {
    return;
  }
  const weakDeck = shuffle(
    mockSession.items
      .filter((entry) => entry.resultScore === null || entry.resultScore < 3)
      .map((entry) => entry.item)
  );
  createMockSession(weakDeck, 'review');
}

function finishMockSession() {
  if (!mockSession || mockSession.completedAt) {
    return;
  }
  mockSession.completedAt = Date.now();
  mockRevealed = false;
  stopMockTicker();
  renderMock();
}

function revealMockAnswer() {
  if (!getCurrentMockEntry() || mockSession?.completedAt) {
    return;
  }
  mockRevealed = true;
  renderMock();
}

function rateMock(level) {
  const entry = getCurrentMockEntry();
  if (!entry || mockSession?.completedAt || entry.resultScore !== null) {
    return;
  }

  const now = Date.now();
  entry.resultScore = level;
  entry.durationMs = Math.max(0, now - (entry.startedAt || now));
  S[entry.item.id] = level;
  saveState();
  stats();

  if (mockIndex >= mockSession.items.length - 1) {
    mockSession.completedAt = now;
    mockRevealed = false;
    stopMockTicker();
    renderMock();
    return;
  }

  mockIndex += 1;
  mockRevealed = false;
  const nextEntry = getCurrentMockEntry();
  if (nextEntry && !nextEntry.startedAt) {
    nextEntry.startedAt = now;
  }
  renderMock();
}

function renderMockSummary() {
  const answered = mockSession.items.filter((entry) => entry.resultScore !== null);
  const smooth = answered.filter((entry) => entry.resultScore === 3).length;
  const shaky = answered.filter((entry) => entry.resultScore === 2).length;
  const weak = answered.filter((entry) => entry.resultScore === 1).length;
  const downgraded = answered.filter((entry) => entry.resultScore < entry.initialScore).length;
  const unfinished = mockSession.items.length - answered.length;
  const duration = (mockSession.completedAt || Date.now()) - mockSession.startedAt;
  const reviewItems = mockSession.items.filter((entry) => entry.resultScore === null || entry.resultScore < 3);
  const weakCategories = [...reviewItems.reduce((map, entry) => {
    const next = map;
    const current = next.get(entry.item.cat) || { cat: entry.item.cat, count: 0 };
    current.count += 1;
    next.set(entry.item.cat, current);
    return next;
  }, new Map()).values()].sort((a, b) => b.count - a.count);
  const topWeakCategory = weakCategories[0];

  $('mkSummaryDuration').textContent = `总时长 ${formatDuration(duration)}`;
  $('mkRetryWeakB').classList.toggle('hidden', reviewItems.length === 0);
  $('mkSummaryGrid').innerHTML = [
    ['完成题数', `${answered.length}/${mockSession.items.length}`],
    ['答得顺畅', `${smooth} 题`],
    ['仍然模糊', `${shaky} 题`],
    ['需要重学', `${weak} 题`],
    ['被打回', `${downgraded} 题`],
    ['未完成', `${unfinished} 题`],
  ]
    .map(
      ([label, value]) =>
        `<div class="mk-stat"><span class="mk-stat-label">${label}</span><strong class="mk-stat-value">${value}</strong></div>`
    )
    .join('');

  $('mkReviewList').innerHTML = reviewItems.length
    ? reviewItems
        .map((entry) => {
          const resultText = entry.resultScore === null ? '未作答' : scoreLabel(entry.resultScore);
          return `<li><span>${escapeHtml(entry.item.q)}</span><strong>${resultText}</strong></li>`;
        })
        .join('')
    : '<li><span>这一轮没有需要优先回看的题，可以切到“真实混合”继续练。</span><strong>状态稳定</strong></li>';

  $('mkWeakCategoryList').innerHTML = weakCategories.length
    ? weakCategories
        .map(
          ({ cat, count }) =>
            `<li><span>${escapeHtml(cat)}</span><strong>${count} 题</strong></li>`
        )
        .join('')
    : '<li><span>本轮没有明显的薄弱分类分布。</span><strong>结构均衡</strong></li>';

  let nextStep = '下一轮建议切到“真实混合”，把已经答顺和刚补强的题放在一起，再看自己能不能稳定输出。';
  if (reviewItems.length === 0) {
    nextStep = '这一轮表现很稳，可以提高题量，或者切到“真实混合”模拟更接近正式面试的出题节奏。';
  } else if (weak > 0) {
    nextStep = topWeakCategory
      ? `本轮有完全没答好的题，优先点击“薄弱题再练一轮”。其中最该先补的是「${topWeakCategory.cat}」，先把这一类讲顺再回到混合训练。`
      : '本轮有完全没答好的题，优先点击“薄弱题再练一轮”，先把不会的题重新讲一遍。';
  } else if (downgraded > 0 || unfinished > 0) {
    nextStep = topWeakCategory
      ? `你有题被打回或没答完，说明“会看”和“会讲”还没完全重合。建议先回炉「${topWeakCategory.cat}」，再开始下一轮。`
      : '你有题被打回或没答完，建议先用“薄弱题再练一轮”把断点补上，再开启下一轮完整模拟。';
  } else if (shaky > 0) {
    nextStep = topWeakCategory
      ? `本轮主要问题集中在「${topWeakCategory.cat}」，下一轮建议切到“冲刺提升”，把这类模糊题练到能连续表达。`
      : '本轮还有几题偏模糊，建议下一轮切到“冲刺提升”，把模糊题练到能连续表达。';
  }
  $('mkNextStep').textContent = nextStep;
}

function renderMock() {
  const { scoped, mastered, fuzzy } = getMockAvailability();
  const availableCount =
    mockPool === 'mastered'
      ? mastered.length
      : mockPool === 'fuzzy'
        ? fuzzy.length
        : mastered.length + fuzzy.length;

  document.querySelectorAll('[data-mock-pool]').forEach((button) => {
    button.classList.toggle('on', button.dataset.mockPool === mockPool);
  });
  document.querySelectorAll('[data-mock-size]').forEach((button) => {
    button.classList.toggle('on', Number(button.dataset.mockSize) === mockSize);
  });

  $('mkMeta').textContent = `当前范围 ${scoped.length} 题 · 已掌握 ${mastered.length} · 模糊 ${fuzzy.length}`;

  const hasActiveSession = Boolean(mockSession && !mockSession.completedAt);
  $('mkStartB').classList.toggle('hidden', hasActiveSession);
  $('mkRestartB').classList.toggle('hidden', !hasActiveSession);
  $('mkFinishB').classList.toggle('hidden', !hasActiveSession);
  $('mkStartB').textContent = mockSession?.completedAt ? '再来一轮' : '开始模拟';
  $('mkStartB').disabled = availableCount === 0;
  $('mkStartB').title = availableCount === 0 ? `当前范围内没有可用于“${MOCK_POOL_LABELS[mockPool]}”的题目` : '';

  $('mkHint').textContent = hasActiveSession
    ? `当前会话已锁定 ${mockSession.items.length} 题；切换题源、题量或顶部筛选只会影响下一轮。`
    : `${MOCK_POOL_HINTS[mockPool]} 模拟模式会忽略“未掌握”和“随机”开关，只继承分类、难度和搜索范围。`;

  $('mkEmpty').classList.add('hidden');
  $('mkCard').classList.add('hidden');
  $('mkSummary').classList.add('hidden');

  if (!mockSession) {
    $('mkEmpty').classList.remove('hidden');
    $('mkEmptyText').textContent = availableCount
      ? `${MOCK_POOL_LABELS[mockPool]} 当前可抽 ${availableCount} 题。先开口回答，再对照答案复盘。`
      : `当前筛选范围里没有可用于“${MOCK_POOL_LABELS[mockPool]}”的题。先在卡片模式里把题标成“掌握/模糊”，或者缩小筛选范围。`;
    stopMockTicker();
    return;
  }

  if (mockSession.completedAt) {
    $('mkSummary').classList.remove('hidden');
    renderMockSummary();
    stopMockTicker();
    return;
  }

  const entry = getCurrentMockEntry();
  $('mkCard').classList.remove('hidden');
  $('mkRound').textContent = `第 ${mockIndex + 1} / ${mockSession.items.length} 题`;
  $('mkSourceChip').textContent = MOCK_POOL_LABELS[mockSession.pool];
  $('mkCat').textContent = `${entry.item.icon} ${entry.item.cat} · ${DIFF_LABELS[entry.item.diff]}`;
  $('mkQuestion').textContent = entry.item.q;
  $('mkInitialScore').textContent = `当前状态：${scoreLabel(entry.initialScore)}`;
  $('mkInitialScore').className = `mk-score mk-score-${scoreTone(entry.initialScore)}`;
  $('mkAnswer').innerHTML = entry.item.a;
  $('mkAnswerWrap').classList.toggle('hidden', !mockRevealed);
  $('mkRevealB').classList.toggle('hidden', mockRevealed);
  $('mkRateGroup').classList.toggle('hidden', !mockRevealed);
  startMockTicker();
  updateMockTimers();
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
    $('pB').title = '当前没有上一题可切换';
    $('nB').title = '当前没有下一题可切换';
    $('fcHint').textContent = '当前筛选结果为空，请调整分类、难度或搜索关键词。';
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
  $('pB').title = idx === 0 ? '已经是当前范围的第一题' : '上一题';
  $('nB').title = idx >= cards.length - 1 ? '已经是当前范围的最后一题' : '下一题';
  $('fcHint').textContent =
    idx === 0 && cards.length > 1
      ? '已经到第一题，可以继续翻面或向后切换。'
      : idx >= cards.length - 1 && cards.length > 1
        ? '已经到最后一题，可以评分后调整筛选继续复习。'
        : '点击卡片或按空格翻面，使用左右方向键切题，按 1 / 2 / 3 快速评分。';
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
  cards = mode === 'mock' ? scopeCards() : filteredCards();
  idx = Math.min(idx, Math.max(cards.length - 1, 0));
  syncModeButtons();
  syncCategoryTabs();
  syncTagButtons();
  syncDifficultyButtons();
  syncToggleButtons();
  syncSearchUi();
  if (mode === 'card') {
    renderFC();
    stopMockTicker();
  } else if (mode === 'list') {
    renderLS();
    stopMockTicker();
  } else {
    renderMock();
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

function buildTagFilters() {
  const container = $('tagF');
  container.innerHTML = TAG_FILTERS.map(
    (tag) => `<button type="button" class="tag-chip${tag.id === tagV ? ' on' : ''}" data-tag="${tag.id}">${tag.label}</button>`
  ).join('');

  container.querySelectorAll('.tag-chip').forEach((button) => {
    button.addEventListener('click', () => {
      tagV = button.dataset.tag;
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

document.querySelectorAll('[data-mock-pool]').forEach((button) => {
  button.addEventListener('click', () => {
    mockPool = button.dataset.mockPool;
    apply();
  });
});

document.querySelectorAll('[data-mock-size]').forEach((button) => {
  button.addEventListener('click', () => {
    mockSize = Number(button.dataset.mockSize);
    apply();
  });
});

$('mkStartB').addEventListener('click', startMockSession);
$('mkRestartB').addEventListener('click', restartMockSession);
$('mkFinishB').addEventListener('click', finishMockSession);
$('mkRetryWeakB').addEventListener('click', restartWeakMockSession);
$('mkRevealB').addEventListener('click', revealMockAnswer);
$('mkRate1').addEventListener('click', () => rateMock(1));
$('mkRate2').addEventListener('click', () => rateMock(2));
$('mkRate3').addEventListener('click', () => rateMock(3));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.activeElement === $('sI')) {
    clearSearch();
    return;
  }
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }
  if (mode === 'card') {
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
  } else if (mode === 'mock' && mockSession && !mockSession.completedAt) {
    if ((event.key === ' ' || event.key === 'Enter') && !mockRevealed) {
      event.preventDefault();
      revealMockAnswer();
    } else if (mockRevealed && event.key === '1') {
      rateMock(1);
    } else if (mockRevealed && event.key === '2') {
      rateMock(2);
    } else if (mockRevealed && event.key === '3') {
      rateMock(3);
    }
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
buildTagFilters();
apply();
