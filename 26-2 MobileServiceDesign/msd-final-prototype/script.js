/* =========================================================
   걸어서 캐시 속으로 — 프로토타입 동작 스크립트 (v2)
   ---------------------------------------------------------
   HTML에 아래 속성만 달면 동작이 연결됩니다.
     data-go="화면id"    → 해당 화면으로 이동
     data-back           → 직전 화면으로 돌아가기
     data-action="이름"  → 아래 ACTIONS 안의 함수 실행
     data-toast="문구"   → 프로토타입 범위 밖 버튼: 안내 문구만 띄움
   화면 id 목록과 연결 지도는 README.md 참고
   ========================================================= */

/* ---------- 1. 시작 화면 ----------
   주소 뒤에 #화면id 를 붙이면 그 화면부터 시작 (예: index.html#home) */
const START_SCREEN = 'lock-basic';

const screens = document.querySelectorAll('.screen');
const trail = [];            // 지나온 화면 기록 (뒤로가기용)
let current = null;

/* ---------- 2. 화면 이동 ---------- */
function go(id, { push = true } = {}) {
  const next = document.getElementById(id);
  if (!next || next === current) return;

  if (current) {
    if (push) trail.push(current.id);
    current.classList.remove('active');
    leaveScreen(current.id);
  }
  next.classList.add('active');
  current = next;
  try { location.hash = id; } catch (e) { /* 일부 환경에선 주소 변경 불가 — 무시 */ }
  enterScreen(id);
  markIndex();
}

function back() {
  const prev = trail.pop();
  if (prev) go(prev, { push: false });
}

/* ---------- 3. 화면에 들어올 때 / 나갈 때 ---------- */
function enterScreen(id) {
  // 스크롤 영역은 들어올 때마다 맨 위로
  // (필터 펼침에서 돌아올 때는 보던 카드 위치 그대로 둠)
  if (!(id === 'walk-ready' && lastLeft === 'walk-dropdown')) {
    current.querySelectorAll('.scroll-y, .scroll-x').forEach((el) => { el.scrollTop = 0; el.scrollLeft = 0; });
  }

  // 진행 바: 화면이 열릴 때 0 → 목표값으로 차오르는 애니메이션
  current.querySelectorAll('.bar > i[data-width]').forEach((el) => {
    el.style.width = '0';
    requestAnimationFrame(() => setTimeout(() => (el.style.width = el.dataset.width), 60));
  });

  // 성장·기록: 연속 기록이 왼쪽부터 차오르는 슬라이딩 (들어올 때마다 다시 재생)
  if (id === 'grow-record') {
    current.classList.remove('cal-play');
    void current.offsetWidth;            // 애니메이션 다시 시작시키기
    current.classList.add('cal-play');
  }

  // 필터 펼침: 뒤에 보이는 지도 화면 복제본의 코스 카드 스크롤 위치를 원래 화면과 똑같이
  if (id === 'walk-dropdown') {
    const from = document.querySelector('#walk-ready .course-row');
    const to = current.querySelector('.course-row');
    if (from && to) { to.style.scrollSnapType = 'none'; to.scrollLeft = from.scrollLeft; }
  }

  if (id === 'walk-ing') startWalk();
}
let lastLeft = '';   // 바로 전에 떠난 화면
function leaveScreen(id) {
  lastLeft = id;
  if (id === 'walk-ing') stopWalk();
}

/* ---------- 4. 토스트 안내 ---------- */
const toastEl = document.querySelector('.toast');
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
}

/* data-bind="이름" 이 달린 모든 요소의 글자를 한 번에 바꿈 */
function bind(name, text) {
  document.querySelectorAll(`[data-bind="${name}"]`).forEach((el) => (el.textContent = text));
}

/* ---------- 5. 개별 동작 (data-action) ---------- */
const ACTIONS = {
  /* 보상 카드 선택 → 노란 테두리 + "필요 캐시" 다시 계산 + 확인 화면에 반영 */
  pickReward(el) {
    el.parentElement.querySelectorAll('.reward-card').forEach((c) => c.classList.remove('on'));
    el.classList.add('on');
    const price = Number(el.dataset.price);
    bind('need-cash', Math.max(0, price - 1600).toLocaleString());   // 현재 보유 1,600C 기준
    reward = { brand: el.querySelector('small').textContent, name: el.querySelector('b').textContent, price };
    bind('reward-brand', reward.brand);
    bind('reward-name', reward.name);
    bind('reward-price', price.toLocaleString());
    const img = document.querySelector('[data-bind-src="reward-img"]');
    if (img) img.src = el.dataset.big || el.querySelector('img').src;
    // 목표 설정 완료 화면: 이디야 아메리카노면 꽃가루 이미지, 다른 보상이면 고른 보상 사진
    const fin = document.querySelector('[data-bind-src="reward-final"]');
    if (fin) fin.src = el.dataset.final || el.dataset.big || el.querySelector('img').src;
    updateGoal();
  },

  /* 칩·카드 중 하나만 선택되게 (같은 부모 안에서) */
  pickChip(el) {
    el.parentElement.querySelectorAll(':scope > [data-action="pickChip"]').forEach((c) => c.classList.remove('on'));
    el.classList.add('on');
  },

  /* 선택 카드 중 하나만 (목표 계산과 상관없는 선택지) */
  pickOne(el) {
    el.parentElement.querySelectorAll('.option').forEach((c) => c.classList.remove('on'));
    el.classList.add('on');
  },

  /* 여러 개 동시에 선택 가능 (산책 유형, 걷는 시간 등) */
  toggle(el) { el.classList.toggle('on'); },

  /* 목표 걸음 수 옵션 (라디오) */
  pickSteps(el) {
    el.parentElement.querySelectorAll('.option').forEach((c) => c.classList.remove('on'));
    el.classList.add('on');
    goalSteps = Number(el.dataset.steps || customSteps);
    updateGoal();
  },
  /* 직접설정 − / + (1,000보 단위) */
  stepsMinus(el) { customSteps = Math.max(1000, customSteps - 1000); syncCustom(el); },
  stepsPlus(el) { customSteps = Math.min(30000, customSteps + 1000); syncCustom(el); },

  /* 드롭다운 옵션 → 진행화면 필터 글자 바꾸고 돌아가기 */
  pickOption(el) {
    el.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
    el.classList.add('on');
    bind(el.dataset.target, el.textContent);
    // 산책 완료 배지용 띄어쓴 이름 (Figma: "기분 전환 산책 완료")
    if (el.dataset.target === 'walk-purpose') {
      const LABEL = { '기분전환': '기분 전환', '자연감상': '자연 감상', '동네탐방': '동네 탐방', '제휴매장': '매장 방문' };
      bind('walk-purpose-label', LABEL[el.textContent] || el.textContent);
    }
    back();
  },

  /* 산책 중: 일시정지 ↔ 다시 시작 */
  togglePause(el) {
    walkPaused = !walkPaused;
    el.textContent = walkPaused ? '다시 시작' : '일시정지';
    bind('walk-state', walkPaused ? '잠시 멈췄어요' : '기분 전환 산책 · 목적지까지 350m');
  },

  /* 글자 탭 전환 (그래프 시간/일별 등) */
  pickTab(el) {
    el.parentElement.querySelectorAll('[data-action="pickTab"]').forEach((c) => c.classList.remove('on'));
    el.classList.add('on');
  },
};

/* ---------- 6. 목표 계산 (목표설정 2 → 3, 예상 달성일) ----------
   필요한 캐시(보상 가격)를 하루 걸음 수로 나눠 대략 며칠 걸리는지 계산
   기준: 하루 8,000보로 5,000C 보상 = 30일 (Figma 값) / 오늘 = 2026년 11월 25일 */
const TODAY = new Date(2026, 10, 25);
let reward = { brand: '이디야', name: '아메리카노', price: 5000 };
let goalSteps = 5000;
let customSteps = 9000;

function daysFor(steps, price = reward.price) {
  return Math.round(30 * (8000 / steps) * (price / 5000));
}
function dateAfter(days) {
  const d = new Date(TODAY); d.setDate(d.getDate() + days);
  return d;
}
function syncCustom(el) {
  bind('custom-steps', customSteps.toLocaleString());
  bind('custom-days', daysFor(customSteps) + '일');
  const card = el.closest('.option');
  if (card) { card.dataset.steps = customSteps; ACTIONS.pickSteps(card); }
}
function updateGoal() {
  const days = daysFor(goalSteps);
  const d = dateAfter(days);
  bind('steps', goalSteps.toLocaleString());
  bind('days', days);
  bind('total-steps', (goalSteps * days).toLocaleString());   // 필요 걸음수 = 하루 걸음 × 기간
  bind('date', `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`);
  bind('date-short', `${d.getMonth() + 1}월 ${d.getDate()}일`);
  // 옵션 카드 오른쪽 "N일"도 보상 가격에 맞춰 갱신
  document.querySelectorAll('.option[data-steps] [data-days-for]').forEach((el) => {
    el.textContent = daysFor(Number(el.dataset.daysFor)) + '일';
  });
}

/* ---------- 7. 산책 중 시뮬레이션 ----------
   1초마다 시간·걸음 수·거리가 올라가는 척 (실제 센서 연결 아님) */
let walkTimer, walkSec = 402, walkPaused = false;
function startWalk() {
  walkSec = 402; walkPaused = false;   // Figma 화면과 같은 06:42에서 시작
  const btn = document.querySelector('[data-action="togglePause"]');
  if (btn) btn.textContent = '일시정지';
  renderWalk();
  walkTimer = setInterval(() => { if (!walkPaused) { walkSec++; renderWalk(); } }, 1000);
}
function stopWalk() { clearInterval(walkTimer); }
function renderWalk() {
  const goal = 10 * 60;
  const mm = String(Math.floor(walkSec / 60)).padStart(2, '0');
  const ss = String(walkSec % 60).padStart(2, '0');
  bind('walk-clock', `${mm}:${ss}`);
  bind('walk-steps', (742 + (walkSec - 402) * 2).toLocaleString());
  bind('walk-dist', (0.54 + (walkSec - 402) * 0.0014).toFixed(2));
  const bar = document.getElementById('walk-bar');
  if (bar) bar.style.width = Math.min(100, (walkSec / goal) * 100) + '%';
}

/* ---------- 8. 클릭 연결 (이벤트 위임) ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-go], [data-back], [data-action], [data-toast]');
  if (!el || el.closest('[data-cloned]')) return;
  if (el.hasAttribute('data-action')) ACTIONS[el.dataset.action]?.(el);
  if (el.hasAttribute('data-toast')) toast(el.dataset.toast || '프로토타입에서는 지원하지 않는 기능이에요');
  if (el.hasAttribute('data-back')) back();
  if (el.dataset.go) go(el.dataset.go);
});

/* ---------- 8-1. 가로 스크롤 위치 표시 바 ----------
   <div class="scroll-x" data-progress="바 id"> 를 스크롤하면 그 바가 따라 차오름 */
document.querySelectorAll('[data-progress]').forEach((box) => {
  const bar = document.getElementById(box.dataset.progress);
  const update = () => { bar.style.width = Math.min(100, (box.clientWidth + box.scrollLeft) / box.scrollWidth * 100) + '%'; };
  box.addEventListener('scroll', update, { passive: true });
  window.addEventListener('load', update);
});

/* ---------- 9. 배경 복제 ----------
   <section data-clone="home"> → 다른 화면 내용을 복사해 배경으로 깔기
   (팝업·드롭다운처럼 "같은 화면 + 위에 뜬 것"을 코드 중복 없이 만들기 위함)
   data-clone-live 가 붙으면 복제본도 눌리는 "다른 상태의 같은 화면"이 되고,
   data-patch 로 글자·이동 대상·이미지만 바꿈 (예: 홈 → 걸음 달성 상태의 홈) */
document.querySelectorAll('[data-clone]').forEach((s) => {
  const src = document.getElementById(s.dataset.clone);
  const live = s.hasAttribute('data-clone-live');
  [...src.children].reverse().forEach((child) => {
    const copy = child.cloneNode(true);
    if (!live) copy.setAttribute('data-cloned', '');
    copy.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    s.prepend(copy);
  });
  if (s.dataset.patch) {
    JSON.parse(s.dataset.patch).forEach((p) => s.querySelectorAll(p.sel).forEach((el) => {
      if ('text' in p) el.textContent = p.text;
      if ('html' in p) el.innerHTML = p.html;
      if ('go' in p) el.dataset.go = p.go;
      if ('src' in p) el.src = p.src;
      if ('width' in p) el.dataset.width = p.width;
    }));
  }
});

/* ---------- 10. 상태바·홈 인디케이터 자동 삽입 ----------
   어두운 배경 화면은 <section data-theme="dark"> 로 흰색 버전이 들어감 */
screens.forEach((s) => {
  const light = s.dataset.theme === 'dark' ? ' light' : '';
  s.insertAdjacentHTML('beforeend', `
    <div class="status-bar${light}">
      <span class="time">9:41</span><span class="island"></span>
      <span class="icons"><svg width="18" height="12"><use href="#i-signal"/></svg><svg width="17" height="12"><use href="#i-wifi"/></svg><svg width="27" height="13"><use href="#i-battery"/></svg></span>
    </div>
    <div class="home-indicator${light}"></div>`);
});

/* ---------- 11. 하단 내비게이터 자동 채우기 ----------
   <nav class="tabbar" data-on="홈"></nav> 만 적으면 5개 탭이 들어감 */
const TABBAR = [
  { name: '혜택', icon: 'i-coin' },
  { name: '쇼핑', icon: 'i-cart' },
  { name: '홈', icon: 'i-home', go: 'home' },
  { name: '성장', icon: 'i-growth', go: 'grow-record' },
  { name: '활동', icon: 'i-walk', go: 'walk-main' },
];
document.querySelectorAll('.tabbar').forEach((nav) => {
  nav.innerHTML = TABBAR.map((t) => {
    const on = nav.dataset.on === t.name;
    return `<button class="tab${on ? ' on' : ''}" ${t.go ? `data-go="${t.go}"` : 'data-toast="이번 프로토타입 범위 밖이에요"'}>
      <svg><use href="#${t.icon}${t.name === '홈' ? '-fill' : ''}"/></svg>${t.name}</button>`;
  }).join('');
});

/* 활동 탭 플로팅 내비게이터 (← · 동네산책 · 모두의챌린지 · 커뮤니티) — ← 는 홈으로 */
const ACTIVITY_NAV = [
  { name: '동네산책', icon: 'i-leaf', go: 'walk-main' },
  { name: '모두의챌린지', icon: 'i-award', go: 'challenge' },
  { name: '커뮤니티', icon: 'i-people', go: 'community' },
];
document.querySelectorAll('.activity-nav').forEach((nav) => {
  nav.innerHTML = `<button class="home-btn" data-go="home" aria-label="홈으로">
      <svg width="22" height="22" viewBox="0 0 24 24"><path d="M19 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>` + ACTIVITY_NAV.map((t) => `
    <button class="tab${nav.dataset.on === t.name ? ' on' : ''}" data-go="${t.go}">
      <svg><use href="#${t.icon}"/></svg>${t.name}
    </button>`).join('');
});

/* ---------- 12. 성장/기록 달력 ----------
   2026년 11월 (1일 = 일요일). 값을 바꾸면 달력이 바뀜
     done  = 목표 달성한 날 (이어진 날은 노란 띠로 자동 연결)
     today = 오늘(주황 테두리)   future = 아직 안 온 날(회색) */
const CALENDAR = {
  firstDay: 0, lastDate: 30, today: 25,
  done: [1, 2, 3, 5, 7, 8, 10, 11, 12, 13, 14, 18, 20, 21, 22, 23, 24],
};
document.querySelectorAll('[data-calendar]').forEach((cal) => {
  const { firstDay, lastDate, done, today } = CALENDAR;
  const cells = [...Array(firstDay).fill(0), ...Array.from({ length: lastDate }, (_, i) => i + 1)];
  let html = '';
  for (let w = 0; w < cells.length; w += 7) {
    const week = cells.slice(w, w + 7);
    html += '<div class="week">' + week.map((d, i) => {
      if (!d) return '<span></span>';
      let cls = d === today ? 'today' : d > today ? 'future' : '';
      if (done.includes(d)) {
        const prev = done.includes(d - 1), next = done.includes(d + 1);
        cls += ' done';
        if (prev) cls += i === 0 ? ' cont-l' : ' join-l';   // 앞날과 이어짐
        if (next) cls += i === 6 ? ' cont-r' : ' join-r';   // 다음날과 이어짐
      }
      // --d: 슬라이딩 애니메이션 시작 시간 (1일부터 순서대로 45ms씩 늦게)
      return `<span class="${cls}" style="--d:${150 + d * 45}ms">${d}</span>`;
    }).join('') + '</div>';
  }
  cal.innerHTML = html;
});

/* ---------- 13. 성장/그래프 막대 ----------
   0시~23시 걸음 수. 숫자를 바꾸면 막대 높이가 바뀜 */
const HOURLY_STEPS = [0, 0, 0, 0, 0, 0, 90, 320, 850, 540, 340, 420, 720, 910, 680, 520, 760, 680, 460, 360, 240, 106, 0, 0];
document.querySelectorAll('[data-chart]').forEach((chart) => {
  const max = Math.max(...HOURLY_STEPS);
  chart.insertAdjacentHTML('beforeend', HOURLY_STEPS.map((s, h) => {
    const height = s ? Math.round(s * 0.1376) : 2;
    const cls = s === 0 ? 'zero' : s === max ? 'max' : '';
    return `<i class="b ${cls}" title="${h}시 · ${s}걸음" style="left:${29 + h * 11.5}px; height:${height}px; animation-delay:${h * 20}ms"></i>`;
  }).join(''));
});

/* ---------- 14. 발표용 화면 목록 (PC 왼쪽 패널) ---------- */
const SCREEN_INDEX = {
  'DE1 · 목표 선택형 보상': [
    ['goal-1', '01 보상 선택'], ['goal-2', '02 걸음 수 선택'], ['goal-3', '03 목표 확인'],
    ['home', '04 홈'], ['home-popup', '05 홈 · 산책 제안 팝업'], ['home-goaldone', '06 홈 · 목표 도달'],
    ['home-daydone', '07 홈 · 오늘 걸음 달성'], ['goal-today', '08 오늘의 목표 달성'], ['goal-final', '09 목표 설정 완료'],
    ['goal-exchange', '10 목표 달성 · 쿠폰'], ['goal-next', '11 다음 목표 설정'],
  ],
  'DE2 · 맥락형 걷기 유도': [
    ['lock-basic', '01 잠금화면 · 기본'], ['lock-expand', '02 잠금화면 · 확장'], ['lock-suggest', '03 잠금화면 · 산책 제안'],
    ['settings', '04 설정'], ['walk-free', '05 틈새워크 설정'], ['walk-main', '06 동네산책'],
    ['walk-ready', '07 산책 지도'], ['walk-dropdown', '08 지도 · 필터 펼침'], ['walk-ing', '09 산책 중'], ['walk-done', '10 산책 완료'],
  ],
  'DE3 · 감정 기반 습관 유지': [
    ['grow-record', '01 성장 · 기록'], ['grow-recovery', '02 기록 복구'], ['grow-recovered', '03 복구 완료'],
    ['grow-graph', '04 성장 · 그래프'], ['grow-discover', '05 성장 · 발견'], ['challenge', '06 모두의 챌린지'],
    ['community', '07 커뮤니티 · 동네생활'], ['challenge-board', '08 커뮤니티 · 챌린지'],
  ],
};
const indexEl = document.querySelector('.si-list');
if (indexEl) {
  indexEl.innerHTML = Object.entries(SCREEN_INDEX).map(([group, items]) =>
    `<p class="si-group">${group}</p>` + items.map(([id, name]) => `<button data-go="${id}" data-index="${id}">${name}</button>`).join('')
  ).join('');
}
function markIndex() {
  document.querySelectorAll('[data-index]').forEach((b) => b.classList.toggle('on', b.dataset.index === current?.id));
}

/* ---------- 15. 어떤 화면 크기에서도 폰 전체가 보이게 축소 ----------
   393×852 폰을 창 크기에 맞춰 비율 그대로 줄임 (확대는 하지 않음) */
const phone = document.querySelector('.phone');
function fit() {
  const isWide = window.innerWidth >= 900;                 // PC: 왼쪽 목록 자리를 빼고 계산
  const availW = window.innerWidth - (isWide ? 320 : 0);
  // 폰 브라우저는 주소창 때문에 innerHeight가 실제 보이는 높이보다 클 수 있어 가장 작은 값을 씀
  const viewH = Math.min(window.innerHeight, document.documentElement.clientHeight, window.visualViewport?.height || Infinity);
  const availH = viewH - (window.innerWidth > 500 ? 40 : 0);
  const scale = Math.min(1, availW / 393, availH / 852);
  phone.style.transform = `scale(${scale})`;
  window.__phoneScale = scale;   // 마우스로 끌기 계산에 사용
  phone.style.marginBottom = `${(scale - 1) * 852}px`;     // 줄어든 만큼 아래 빈 공간 제거
  phone.style.marginRight = `${(scale - 1) * 393}px`;
}
window.addEventListener('resize', fit);
window.visualViewport?.addEventListener('resize', fit);
fit();

/* ---------- 16. 시작 ---------- */
updateGoal();
let startId = START_SCREEN;
try { if (location.hash.slice(1) && document.getElementById(location.hash.slice(1))) startId = location.hash.slice(1); } catch (e) {}
go(startId, { push: false });


/* ---------- 가로 스크롤: 마우스로 끌어서 넘기기 ----------
   폰에서는 손가락으로 밀면 되지만, PC 마우스는 가로 스크롤이 안 돼서
   (1) 카드 줄을 잡고 끌거나 (2) 마우스 휠을 굴리면 옆으로 넘어가게 함 */
document.querySelectorAll('.scroll-x').forEach((row) => {
  let down = false, startX = 0, startLeft = 0, moved = false;
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;          // 터치는 브라우저 기본 스크롤 사용
    down = true; moved = false; startX = e.clientX; startLeft = row.scrollLeft;
    row.style.scrollSnapType = 'none';              // 끄는 동안은 자석 정렬 끄기
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = (e.clientX - startX) / (window.__phoneScale || 1);
    if (Math.abs(dx) > 4) moved = true;
    row.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false; row.style.scrollSnapType = '';
  });
  // 끌었을 때는 카드 클릭(선택)이 같이 눌리지 않게
  row.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  // 세로 휠 → 가로로
  row.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && row.scrollWidth > row.clientWidth) {
      row.scrollLeft += e.deltaY; e.preventDefault();
    }
  }, { passive: false });
});
