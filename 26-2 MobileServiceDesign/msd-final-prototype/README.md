# 걸어서 캐시 속으로 — 모바일 프로토타입 (v2)

2026-2 모바일서비스디자인 기말 프로젝트 · Figma → MCP → HTML/CSS/JS

- **화면**: iPhone 16 (393 × 852) 기준 29개 화면 (DE1 11 · DE2 10 · DE3 8)
- **만든 방법**: Figma MCP(`get_metadata`, `get_screenshot`, `get_design_context`, `get_variable_defs`)로 디자인 정보를 받아서 순수 HTML/CSS/JS로 구현

---

### 공통 내비게이션
- **하단 탭** (홈 화면들, 성장 화면들, 설정): 홈 → `home` · 성장 → `grow-record` · 활동 → `walk-main` · 혜택/쇼핑 → "범위 밖" 안내
- **활동 탭 플로팅 바**: ← → `home` · 동네산책 → `walk-main` · 모두의챌린지 → `challenge` · 커뮤니티 → `community`

### DE1 · 목표 선택형 보상
| 화면 (id) | 누르는 곳 | 이동 / 동작 |
|---|---|---|
| 01 보상 선택 (`goal-1`) | 보상 카드 (가로 스크롤) | 선택 + 필요 캐시 계산 |
| | 이전으로 / 다음 | 뒤로 / `goal-2` |
| 02 걸음 수 선택 (`goal-2`) | 5,000 · 8,000 · 10,000 · 직접설정(−/+) | 선택 → 아래 날짜 안내 자동 변경 |
| | 다음 | `goal-3` |
| 03 목표 확인 (`goal-3`) | 목표 설정하기 | `goal-final` |
| 04 홈 (`home`) | 톱니바퀴 | `settings` |
| | 캐시 주머니 | `home-popup` |
| | 보상 컵 / 비버 *(데모)* | `home-goaldone` / `home-daydone` |
| | 오늘의 걸음 카드 | `grow-graph` |
| | "기록이 하루 비었어요" | `grow-record` |
| | 기록 복구하러 가기 | `grow-recovery` |
| 05 산책 제안 팝업 (`home-popup`) | 다음 / ✕ | `walk-free` / 뒤로 |
| 07 오늘 걸음 달성 홈 (`home-daydone`) | 오늘의 걸음 카드 · 컵 · 비버 | `goal-today` |
| 06 목표 도달 홈 (`home-goaldone`) | 컵 · 비버 | `goal-exchange` |
| 08 오늘의 목표 달성 (`goal-today`) | 기록 보러가기 / ✕ | `grow-record` / `home-daydone` |
| 09 목표 설정 완료 (`goal-final`) | 홈 화면으로 | `home` |
| 10 목표 달성·쿠폰 (`goal-exchange`) | 목표 설정하기 / ✕ / 쿠폰함 보기 | `goal-next` / `home` / 안내 |
| 11 다음 목표 설정 (`goal-next`) | 보상 카드 → 다음 / 더보기 | `goal-2` / `goal-1` |

### DE2 · 맥락형 걷기 유도
| 화면 (id) | 누르는 곳 | 이동 / 동작 |
|---|---|---|
| 01 잠금화면 기본 (`lock-basic`) ← **시작 화면** | 알림 · 배경 / 손전등·카메라 | `lock-expand` / `home` |
| 02 잠금화면 확장 (`lock-expand`) | +1 캐시 받기 · 목표 확인하기 / 배경 | `home` / `lock-suggest` |
| 03 산책 제안 알림 (`lock-suggest`) | 알림 | `walk-main` |
| 04 설정 (`settings`, 세로 스크롤) | 목표 설정 / 틈새워크 설정 | `goal-1` / `walk-free` |
| 05 틈새워크 설정 (`walk-free`) | 시간·유형 카드 | 여러 개 켜고 끄기 |
| | 다음 | `walk-main` |
| 06 동네산책 (`walk-main`, 세로 스크롤) | 맞춤 제안 / 지도 / 장소 카드 | `walk-ready` |
| 07 산책 지도 (`walk-ready`) | 기분전환 ▾ · 10분 ▾ | `walk-dropdown` |
| | 추천 코스 카드 (가로 스크롤) | 선택 |
| | 산책 시작하기 | `walk-ing` |
| 08 필터 펼침 (`walk-dropdown`) | 옵션 | 필터 글자 바꾸고 지도로 |
| 09 산책 중 (`walk-ing`) | 일시정지 | 타이머 멈춤 ↔ 다시 시작 |
| | 산책 종료 | `walk-done` |
| 10 산책 완료 (`walk-done`) | 기록 보러가기 / ✕ | `grow-record` / `home` |

### DE3 · 감정 기반 습관 유지와 목적형 커뮤니티
| 화면 (id) | 누르는 곳 | 이동 / 동작 |
|---|---|---|
| 01 성장·기록 (`grow-record`, 세로 스크롤) | 발견 탭 / 그래프 아이콘 | `grow-discover` / `grow-graph` |
| 02 기록 복구 (`grow-recovery`) | 산책 선택 → 다음 | `grow-recovered` |
| 03 복구 완료 (`grow-recovered`) | 기록 보러가기 / ✕ | `grow-record` |
| 04 성장·그래프 (`grow-graph`) | 일별/주별/월별 | "이번 프로토타입 범위 밖" 안내 |
| 05 성장·발견 (`grow-discover`, 세로 스크롤) | 점심시간 산책 / 10분 챌린지 · 도전해보아요! | `walk-main` / `challenge` |
| 06 모두의 챌린지 (`challenge`) | 참여 중 카드 · 인증하기 | `challenge-board` |
| 07 커뮤니티·동네생활 (`community`) | 챌린지 탭 | `challenge-board` |
| 08 커뮤니티·챌린지 (`challenge-board`) | 동네생활 탭 | `community` |

**성장·기록 화면**: 들어올 때마다 달성한 날이 1일부터 순서대로 차오르는 슬라이딩 애니메이션 (`style.css`의 `cal-play`)

**가로 스크롤**: 폰은 손가락으로, PC는 카드 줄을 마우스로 끌거나 휠을 굴리면 옆으로 넘어가요.

**스크롤되는 곳**: 홈(아래 기록 카드), 설정, 동네산책, 성장·기록, 성장·발견, 커뮤니티 게시글(세로) / 보상 카드, 추천 코스, 커뮤니티 칩(가로)



## 파일 구성

```
msd-final-prototype/
├─ index.html             ← 29개 화면 (화면마다 <!-- [DE번호 화면 이름] --> 주석)
├─ style.css              ← 디자인 토큰 → 공통 컴포넌트 → 화면별 스타일 순서
├─ script.js              ← 화면 전환, 목표 계산, 타이머, 달력, 그래프, 화면 크기 맞춤
├─ images/                ← 일러스트·사진 (Figma 렌더에서 잘라낸 것)
├─ fonts/                 ← Pretendard·Inter 글꼴 (Figma와 같은 글꼴, 인터넷 없이 동작)
└─ README.md
```


## 참고
- **목표 기간 계산**: 기준일은 2026년 11월 25일이에요. 고른 보상 가격과 하루 걸음 수에 맞춰 예상 날짜가 바뀌어요.
- **산책 중 화면**: 시간·걸음 수는 실제 센서가 아니라 1초마다 올라가는 시뮬레이션이에요.
- **이미지 해상도**: Figma 1x 렌더에서 잘라낸 거라 레티나 화면에서 살짝 흐릴 수 있어요.
