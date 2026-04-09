/**
 * app.js — Hotel English Trainer main application logic.
 * Depends on: scenarios.js (SCENARIOS array)
 */

(function () {
  'use strict';

  // ── Storage keys ──
  const STORAGE_KEY = 'hotel_english_trainer';

  // ── State ──
  let state = {
    currentIdx: 0,
    mode: 'mcq',          // 'mcq' | 'free'
    topicFilter: 'all',
    answers: {},           // { questionText: true/false }
    attempts: {},          // { questionText: number }
    streak: 0,
    selectedMcq: null,     // index of selected option
    graded: false,
    filteredScenarios: [...SCENARIOS],
    mcqOptions: []
  };

  // ── DOM Refs ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    // Views
    viewTrain: $('#view-train'),
    viewDash: $('#view-dashboard'),
    viewExpr: $('#view-expressions'),
    navTrain: $('#nav-train'),
    navDash: $('#nav-dashboard'),
    navExpr: $('#nav-expressions'),
    btnReset: $('#btn-reset'),

    // Progress
    progressText: $('#progress-text'),
    accuracyText: $('#accuracy-text'),
    progressFill: $('#progress-fill'),

    // Controls
    topicFilter: $('#topic-filter'),
    modeMcq: $('#mode-mcq'),
    modeFree: $('#mode-free'),

    // Scenario card
    scenarioTopic: $('#scenario-topic'),
    scenarioCounter: $('#scenario-counter'),
    guestQuestion: $('#guest-question'),
    btnTts: $('#btn-tts'),

    // MCQ
    mcqArea: $('#mcq-area'),
    mcqOptions: $('#mcq-options'),
    btnGrade: $('#btn-grade'),

    // Free
    freeArea: $('#free-area'),
    freeInput: $('#free-input'),
    btnFeedback: $('#btn-feedback'),

    // Feedback
    feedbackBox: $('#feedback-box'),

    // Nav
    btnPrev: $('#btn-prev'),
    btnNext: $('#btn-next'),

    // Dashboard
    dashCompleted: $('#dash-completed'),
    dashAccuracy: $('#dash-accuracy'),
    dashRemaining: $('#dash-remaining'),
    dashStreak: $('#dash-streak'),
    topicBars: $('#topic-bars'),
    weakList: $('#weak-list'),

    // Expressions
    exprList: $('#expr-list'),
    exprTopicFilter: $('#expr-topic-filter'),
    exprCount: $('#expr-count'),

    // Toast
    toastContainer: $('#toast-container'),

    // Modal
    modalOverlay: $('#modal-overlay'),
    modalCancel: $('#modal-cancel'),
    modalConfirm: $('#modal-confirm')
  };

  // ══════════════════════════════════════════════
  //  PERSISTENCE
  // ══════════════════════════════════════════════

  function saveState() {
    const data = {
      answers: state.answers,
      attempts: state.attempts,
      streak: state.streak,
      currentIdx: state.currentIdx,
      mode: state.mode,
      topicFilter: state.topicFilter
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) { /* quota exceeded — silently ignore */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      state.answers = data.answers || {};
      state.attempts = data.attempts || {};
      state.streak = data.streak || 0;
      state.currentIdx = data.currentIdx || 0;
      state.mode = data.mode || 'mcq';
      state.topicFilter = data.topicFilter || 'all';
    } catch (_) { /* corrupt data — start fresh */ }
  }

  function resetState() {
    state.answers = {};
    state.attempts = {};
    state.streak = 0;
    state.currentIdx = 0;
    state.graded = false;
    state.selectedMcq = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  // ══════════════════════════════════════════════
  //  FILTERING
  // ══════════════════════════════════════════════

  function getTopics() {
    const topics = new Set();
    SCENARIOS.forEach(s => topics.add(s.topic));
    return [...topics].sort();
  }

  function applyFilter() {
    if (state.topicFilter === 'all') {
      state.filteredScenarios = [...SCENARIOS];
    } else {
      state.filteredScenarios = SCENARIOS.filter(s => s.topic === state.topicFilter);
    }
    if (state.currentIdx >= state.filteredScenarios.length) {
      state.currentIdx = 0;
    }
  }

  function populateTopicFilter() {
    const topics = getTopics();
    const frag = document.createDocumentFragment();
    // "all" option is already in HTML
    topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      frag.appendChild(opt);
    });
    dom.topicFilter.appendChild(frag);
    dom.topicFilter.value = state.topicFilter;
  }

  // ══════════════════════════════════════════════
  //  MCQ HELPERS
  // ══════════════════════════════════════════════

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildMcqOptions(scenario) {
    // Pool: model + alternatives + bad = 5
    const pool = [scenario.modelAnswer, ...scenario.alternatives, scenario.badOption];
    let shuffled = shuffle(pool);
    // Ensure we take exactly 4, always including the model answer
    let chosen = shuffled.slice(0, 4);
    if (!chosen.includes(scenario.modelAnswer)) {
      chosen[3] = scenario.modelAnswer;
      chosen = shuffle(chosen);
    }
    return chosen;
  }

  function isCorrectAnswer(text, scenario) {
    return text === scenario.modelAnswer || scenario.alternatives.includes(text);
  }

  // ══════════════════════════════════════════════
  //  FREE TEXT EVALUATION
  // ══════════════════════════════════════════════

  function evaluateFreeText(userText, modelAnswer) {
    const trimmed = userText.trim();
    if (!trimmed) {
      return { ok: false, feedback: '응답이 비어 있어요. 핵심 표현을 1문장 이상 작성해보세요.', level: 'error' };
    }

    const keyTokens = [...new Set(
      modelAnswer.split(/\s+/)
        .map(t => t.toLowerCase().replace(/[.,!?'"]/g, ''))
        .filter(t => t.length >= 4)
    )];

    const userLower = trimmed.toLowerCase();
    const matched = keyTokens.filter(t => userLower.includes(t)).length;
    const ratio = matched / Math.max(1, keyTokens.length);

    if (ratio >= 0.35) {
      return { ok: true, feedback: '좋아요! 핵심 표현이 충분히 포함되어 있어 자연스러운 응대입니다. 🎉', level: 'success' };
    }
    if (ratio >= 0.2) {
      return { ok: false, feedback: '부분적으로 좋아요. 정중 표현과 구체적 안내(시간/행동)를 더 넣어보세요.', level: 'warning' };
    }
    return { ok: false, feedback: '핵심 표현 반영이 부족해요. 모범 답안을 참고해 다시 말해보세요.', level: 'error' };
  }

  // ══════════════════════════════════════════════
  //  RENDERING
  // ══════════════════════════════════════════════

  function renderProgress() {
    const total = SCENARIOS.length;
    const solved = Object.keys(state.answers).length;
    const correct = Object.values(state.answers).filter(Boolean).length;
    const pct = total > 0 ? (solved / total) * 100 : 0;
    const acc = solved > 0 ? ((correct / solved) * 100).toFixed(1) : '—';

    dom.progressText.textContent = `${solved} / ${total} 완료`;
    dom.accuracyText.textContent = `정확도 ${acc}${acc !== '—' ? '%' : ''}`;
    dom.progressFill.style.width = `${pct}%`;
  }

  function renderScenario() {
    const scenarios = state.filteredScenarios;
    if (scenarios.length === 0) return;

    const idx = state.currentIdx;
    const sc = scenarios[idx];

    dom.scenarioTopic.textContent = sc.topic;
    dom.scenarioCounter.textContent = `${idx + 1} / ${scenarios.length}`;
    dom.guestQuestion.textContent = `"${sc.guestQuestion}"`;

    // Nav buttons
    dom.btnPrev.disabled = idx === 0;
    dom.btnNext.disabled = idx >= scenarios.length - 1;

    // Reset answer state
    state.graded = false;
    state.selectedMcq = null;
    dom.feedbackBox.classList.add('hidden');
    dom.feedbackBox.innerHTML = '';

    // Mode
    if (state.mode === 'mcq') {
      dom.mcqArea.classList.remove('hidden');
      dom.freeArea.classList.add('hidden');
      renderMcqOptions(sc);
    } else {
      dom.mcqArea.classList.add('hidden');
      dom.freeArea.classList.remove('hidden');
      dom.freeInput.value = '';
    }

    dom.btnGrade.disabled = true;
  }

  function renderMcqOptions(scenario) {
    state.mcqOptions = buildMcqOptions(scenario);
    const markers = ['A', 'B', 'C', 'D'];
    dom.mcqOptions.innerHTML = '';

    state.mcqOptions.forEach((text, i) => {
      const btn = document.createElement('button');
      btn.className = 'mcq-option';
      btn.setAttribute('data-index', i);
      btn.innerHTML = `
        <span class="opt-marker">${markers[i]}</span>
        <span class="opt-text">${text}</span>
      `;
      btn.addEventListener('click', () => onSelectMcq(i));
      dom.mcqOptions.appendChild(btn);
    });
  }

  function renderDashboard() {
    const total = SCENARIOS.length;
    const solved = Object.keys(state.answers).length;
    const correct = Object.values(state.answers).filter(Boolean).length;
    const acc = solved > 0 ? ((correct / solved) * 100).toFixed(1) + '%' : '—';

    dom.dashCompleted.textContent = `${solved} / ${total}`;
    dom.dashAccuracy.textContent = acc;
    dom.dashRemaining.textContent = total - solved;
    dom.dashStreak.textContent = state.streak;

    renderTopicBars();
    renderWeakItems();
  }

  function renderTopicBars() {
    const topics = getTopics();
    dom.topicBars.innerHTML = '';

    topics.forEach(topic => {
      const topicScenarios = SCENARIOS.filter(s => s.topic === topic);
      const answered = topicScenarios.filter(s => state.answers[s.guestQuestion] !== undefined);
      const correct = answered.filter(s => state.answers[s.guestQuestion] === true);
      const pct = topicScenarios.length > 0 ? (correct.length / topicScenarios.length) * 100 : 0;
      const isPerfect = correct.length === topicScenarios.length && topicScenarios.length > 0;

      const row = document.createElement('div');
      row.className = 'topic-bar-row';
      row.innerHTML = `
        <span class="topic-bar-label">${topic}</span>
        <div class="topic-bar-track">
          <div class="topic-bar-fill${isPerfect ? ' perfect' : ''}" style="width:${pct}%"></div>
        </div>
        <span class="topic-bar-stat">${correct.length}/${topicScenarios.length}</span>
      `;
      dom.topicBars.appendChild(row);
    });
  }

  function renderWeakItems() {
    const weak = Object.entries(state.answers)
      .filter(([, ok]) => !ok)
      .map(([q]) => q);

    dom.weakList.innerHTML = '';

    if (weak.length === 0) {
      dom.weakList.innerHTML = '<p class="empty-state">아직 취약 문항이 없어요. 잘하고 있습니다! 🎉</p>';
      return;
    }

    weak.forEach(q => {
      const tries = state.attempts[q] || 1;
      const item = document.createElement('div');
      item.className = 'weak-item';
      item.innerHTML = `
        <span class="weak-icon">⚠️</span>
        <span class="weak-q">${q}</span>
        <span class="weak-tries">시도 ${tries}회</span>
      `;
      dom.weakList.appendChild(item);
    });
  }

  // ══════════════════════════════════════════════
  //  FEEDBACK
  // ══════════════════════════════════════════════

  function showFeedback(scenario, isCorrect, feedbackText, level) {
    dom.feedbackBox.classList.remove('hidden', 'success', 'error', 'warning');
    dom.feedbackBox.classList.add(level);

    let html = `<div>${feedbackText}</div>`;
    html += `<div class="model-answer"><strong>모범 답안:</strong> ${scenario.modelAnswer}</div>`;

    if (scenario.alternatives.length > 0) {
      html += '<div class="alt-answers"><strong>대체 표현:</strong><br>';
      scenario.alternatives.forEach(alt => {
        html += `• ${alt}<br>`;
      });
      html += '</div>';
    }

    dom.feedbackBox.innerHTML = html;

    // Record
    state.answers[scenario.guestQuestion] = isCorrect;
    state.attempts[scenario.guestQuestion] = (state.attempts[scenario.guestQuestion] || 0) + 1;
    state.streak = isCorrect ? state.streak + 1 : 0;

    saveState();
    renderProgress();
  }

  // ══════════════════════════════════════════════
  //  TOAST
  // ══════════════════════════════════════════════

  function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ══════════════════════════════════════════════
  //  TTS
  // ══════════════════════════════════════════════

  function speakText(text) {
    if (!('speechSynthesis' in window)) {
      showToast('이 브라우저는 음성 합성을 지원하지 않습니다.', 'error');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function speakQuestion() {
    const sc = state.filteredScenarios[state.currentIdx];
    if (!sc) return;
    speakText(sc.guestQuestion);
  }

  // ══════════════════════════════════════════════
  //  SPEECH RECOGNITION & PRONUNCIATION SCORING
  // ══════════════════════════════════════════════

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function normalizeText(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  function scorePronunciation(recognized, target) {
    const recNorm = normalizeText(recognized);
    const tgtNorm = normalizeText(target);

    if (!recNorm) return { score: 0, level: 'poor', label: '인식 실패' };

    const recWords = recNorm.split(' ');
    const tgtWords = tgtNorm.split(' ');

    // Word-level matching with fuzzy tolerance
    let matchedWords = 0;
    const usedIndices = new Set();

    for (const tw of tgtWords) {
      let bestDist = Infinity;
      let bestIdx = -1;
      for (let i = 0; i < recWords.length; i++) {
        if (usedIndices.has(i)) continue;
        const dist = levenshtein(tw, recWords[i]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      // Allow fuzzy match: distance <= 25% of word length
      const threshold = Math.max(1, Math.floor(tw.length * 0.3));
      if (bestIdx >= 0 && bestDist <= threshold) {
        matchedWords++;
        usedIndices.add(bestIdx);
      }
    }

    const wordScore = tgtWords.length > 0 ? (matchedWords / tgtWords.length) * 100 : 0;

    // Character-level similarity bonus
    const maxLen = Math.max(recNorm.length, tgtNorm.length);
    const charDist = levenshtein(recNorm, tgtNorm);
    const charScore = maxLen > 0 ? ((maxLen - charDist) / maxLen) * 100 : 0;

    // Combined score (word matching weighted more)
    const score = Math.round(wordScore * 0.7 + charScore * 0.3);
    const clamped = Math.min(100, Math.max(0, score));

    let level, label;
    if (clamped >= 85) { level = 'excellent'; label = '훌륭해요! 🎉'; }
    else if (clamped >= 65) { level = 'good'; label = '좋아요! 👍'; }
    else if (clamped >= 40) { level = 'fair'; label = '조금 더 연습! 💪'; }
    else { level = 'poor'; label = '다시 도전! 🔄'; }

    return { score: clamped, level, label };
  }

  function startSpeechRecognition(targetText, scoreEl, recognizedEl, speakBtn) {
    if (!SpeechRecognition) {
      showToast('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.', 'error');
      return;
    }

    // If already recording, stop
    if (speakBtn.classList.contains('recording')) {
      speakBtn._recognition?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    speakBtn._recognition = recognition;
    speakBtn.classList.add('recording');
    speakBtn.querySelector('.speak-label').textContent = '녹음 중...';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const result = scorePronunciation(transcript, targetText);

      // Show score
      scoreEl.className = `expr-score visible ${result.level}`;
      scoreEl.innerHTML = `
        <span>${result.label} ${result.score}점</span>
        <div class="score-bar">
          <div class="score-bar-fill ${result.level}" style="width:${result.score}%"></div>
        </div>
      `;

      // Show recognized text
      recognizedEl.textContent = `인식된 문장: "${transcript}"`;
      recognizedEl.style.display = 'block';
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        showToast('음성이 감지되지 않았어요. 다시 시도해주세요.', 'error');
      } else if (event.error === 'not-allowed') {
        showToast('마이크 접근이 차단되었습니다. 브라우저 설정을 확인하세요.', 'error');
      } else {
        showToast(`음성 인식 오류: ${event.error}`, 'error');
      }
    };

    recognition.onend = () => {
      speakBtn.classList.remove('recording');
      speakBtn.querySelector('.speak-label').textContent = '말해보기';
    };

    recognition.start();
  }

  // ══════════════════════════════════════════════
  //  EXPRESSIONS LIST
  // ══════════════════════════════════════════════

  function populateExprTopicFilter() {
    const topics = getTopics();
    const frag = document.createDocumentFragment();
    topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      frag.appendChild(opt);
    });
    dom.exprTopicFilter.appendChild(frag);
  }

  function renderExpressions() {
    const filter = dom.exprTopicFilter.value;
    const scenarios = filter === 'all' ? SCENARIOS : SCENARIOS.filter(s => s.topic === filter);

    dom.exprList.innerHTML = '';
    let totalExpr = 0;
    let globalIdx = 0;

    scenarios.forEach(sc => {
      // Topic + question header
      const header = document.createElement('div');
      header.className = 'expr-topic-header';
      header.innerHTML = `
        <span class="topic-badge">${sc.topic}</span>
        <span class="expr-topic-question">"${sc.guestQuestion}"</span>
      `;
      dom.exprList.appendChild(header);

      // All expressions for this scenario: model + alternatives
      const expressions = [
        { text: sc.modelAnswer, type: 'model', label: '모범 답안' },
        ...sc.alternatives.map(alt => ({ text: alt, type: 'alt', label: '대체 표현' }))
      ];

      expressions.forEach(expr => {
        globalIdx++;
        totalExpr++;
        const card = document.createElement('div');
        card.className = `expr-card ${expr.type === 'model' ? 'is-model' : ''}`;

        const scoreId = `score-${globalIdx}`;
        const recId = `rec-${globalIdx}`;

        card.innerHTML = `
          <span class="expr-number">${globalIdx}</span>
          <div class="expr-body">
            <span class="expr-label ${expr.type}">${expr.label}</span>
            <p class="expr-text">${expr.text}</p>
            <div id="${scoreId}" class="expr-score"></div>
            <div id="${recId}" class="expr-recognized" style="display:none"></div>
          </div>
          <div class="expr-actions">
            <button class="expr-btn listen-btn" data-text="${expr.text.replace(/"/g, '&quot;')}" title="발음 듣기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              발음 듣기
            </button>
            <button class="expr-btn speak-btn" data-text="${expr.text.replace(/"/g, '&quot;')}" data-score-id="${scoreId}" data-rec-id="${recId}" title="말해보기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              <span class="speak-label">말해보기</span>
            </button>
          </div>
        `;

        dom.exprList.appendChild(card);
      });
    });

    dom.exprCount.textContent = `총 ${totalExpr}개 표현`;

    // Attach event listeners
    dom.exprList.querySelectorAll('.listen-btn').forEach(btn => {
      btn.addEventListener('click', () => speakText(btn.dataset.text));
    });

    dom.exprList.querySelectorAll('.speak-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const scoreEl = document.getElementById(btn.dataset.scoreId);
        const recEl = document.getElementById(btn.dataset.recId);
        startSpeechRecognition(btn.dataset.text, scoreEl, recEl, btn);
      });
    });
  }

  // ══════════════════════════════════════════════
  //  EVENT HANDLERS
  // ══════════════════════════════════════════════

  function onSelectMcq(index) {
    if (state.graded) return;

    state.selectedMcq = index;
    dom.btnGrade.disabled = false;

    $$('.mcq-option').forEach((el, i) => {
      el.classList.toggle('selected', i === index);
    });
  }

  function onGrade() {
    if (state.selectedMcq === null || state.graded) return;
    state.graded = true;

    const sc = state.filteredScenarios[state.currentIdx];
    const chosenText = state.mcqOptions[state.selectedMcq];
    const correct = isCorrectAnswer(chosenText, sc);

    // Highlight options
    $$('.mcq-option').forEach((el, i) => {
      const txt = state.mcqOptions[i];
      if (isCorrectAnswer(txt, sc)) {
        el.classList.add('correct');
      }
      if (i === state.selectedMcq && !correct) {
        el.classList.add('incorrect');
      }
      el.style.pointerEvents = 'none';
    });

    const feedbackText = correct
      ? '정답입니다! 정중한 표현과 행동 제시가 훌륭합니다. 👏'
      : '아쉬워요. 고객 응대에서는 공감 + 즉시 조치 표현이 중요합니다.';
    const level = correct ? 'success' : 'error';

    showFeedback(sc, correct, feedbackText, level);
    dom.btnGrade.disabled = true;
  }

  function onFeedback() {
    const sc = state.filteredScenarios[state.currentIdx];
    const text = dom.freeInput.value;
    const result = evaluateFreeText(text, sc.modelAnswer);

    showFeedback(sc, result.ok, result.feedback, result.level);
  }

  function onPrev() {
    if (state.currentIdx > 0) {
      state.currentIdx--;
      saveState();
      renderScenario();
    }
  }

  function onNext() {
    if (state.currentIdx < state.filteredScenarios.length - 1) {
      state.currentIdx++;
      saveState();
      renderScenario();
    }
  }

  function switchView(view) {
    const views = { train: dom.viewTrain, dashboard: dom.viewDash, expressions: dom.viewExpr };
    const navs = { train: dom.navTrain, dashboard: dom.navDash, expressions: dom.navExpr };

    Object.keys(views).forEach(key => {
      views[key].classList.toggle('active', key === view);
      navs[key].classList.toggle('active', key === view);
    });

    if (view === 'dashboard') renderDashboard();
    if (view === 'expressions') renderExpressions();
  }

  function switchMode(mode) {
    state.mode = mode;
    dom.modeMcq.classList.toggle('active', mode === 'mcq');
    dom.modeFree.classList.toggle('active', mode === 'free');
    dom.modeMcq.setAttribute('aria-checked', mode === 'mcq');
    dom.modeFree.setAttribute('aria-checked', mode === 'free');
    saveState();
    renderScenario();
  }

  function onTopicChange() {
    state.topicFilter = dom.topicFilter.value;
    applyFilter();
    state.currentIdx = 0;
    saveState();
    renderScenario();
  }

  // ══════════════════════════════════════════════
  //  KEYBOARD NAV
  // ══════════════════════════════════════════════

  function onKeyDown(e) {
    // Only when training view is active
    if (!dom.viewTrain.classList.contains('active')) return;

    if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }

    if (state.mode === 'mcq' && !state.graded) {
      const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
      if (e.key.toLowerCase() in keyMap) {
        e.preventDefault();
        onSelectMcq(keyMap[e.key.toLowerCase()]);
      }
      if (e.key === 'Enter' && state.selectedMcq !== null) {
        e.preventDefault();
        onGrade();
      }
    }

    if (state.mode === 'free' && e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      onFeedback();
    }
  }

  // ══════════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════════

  function init() {
    loadState();
    populateTopicFilter();
    populateExprTopicFilter();
    applyFilter();

    // Restore mode toggle
    switchMode(state.mode);

    renderProgress();
    renderScenario();

    // Event listeners — navigation
    dom.navTrain.addEventListener('click', () => switchView('train'));
    dom.navDash.addEventListener('click', () => switchView('dashboard'));
    dom.navExpr.addEventListener('click', () => switchView('expressions'));

    dom.btnReset.addEventListener('click', () => dom.modalOverlay.classList.remove('hidden'));
    dom.modalCancel.addEventListener('click', () => dom.modalOverlay.classList.add('hidden'));
    dom.modalConfirm.addEventListener('click', () => {
      resetState();
      dom.modalOverlay.classList.add('hidden');
      applyFilter();
      renderProgress();
      renderScenario();
      showToast('학습 기록이 초기화되었습니다.', 'info');
    });

    dom.topicFilter.addEventListener('change', onTopicChange);
    dom.exprTopicFilter.addEventListener('change', renderExpressions);
    dom.modeMcq.addEventListener('click', () => switchMode('mcq'));
    dom.modeFree.addEventListener('click', () => switchMode('free'));

    dom.btnGrade.addEventListener('click', onGrade);
    dom.btnFeedback.addEventListener('click', onFeedback);
    dom.btnPrev.addEventListener('click', onPrev);
    dom.btnNext.addEventListener('click', onNext);
    dom.btnTts.addEventListener('click', speakQuestion);

    document.addEventListener('keydown', onKeyDown);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
