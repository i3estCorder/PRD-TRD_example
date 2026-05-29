# Emotion Analyzer Web App - TRD

## 1. 기술 스택

| 영역 | 기술 / 라이브러리 | 상세 내용 |
|---|---|---|
| **Frontend** | HTML5 | 시맨틱 마크업을 활용한 SPA 구조 |
| **Styling** | Vanilla CSS3 | CSS Custom Properties, Flexbox/Grid, Glassmorphism 테마 |
| **Logic** | Vanilla JavaScript (ES6+) | 모듈화 지양, 단일 스크립트 기반 빠른 데이터 바인딩 |
| **Sentiment Analysis** | Sentiment.js (v5.0.2) | `jsdelivr` CDN을 통해 로드되는 형태소 기반 감정 분석 엔진 |
| **Storage** | LocalStorage | 최근 3건의 분석 결과 영구 저장 (새로고침 대응) |
| **Deployment** | Vercel | GitHub 연동 무설정 정적 웹 호스팅 |

---

## 2. 시스템 구조

```text
       ┌────────────────────────┐
       │   사용자 웹 브라우저   │
       └───────────┬────────────┘
                   │ HTML/CSS/JS 로드
                   ▼
       ┌────────────────────────┐
       │    Sentiment.js CDN    │
       └───────────┬────────────┘
                   │ Sentiment 객체 전역 노출
                   ▼
┌──────────────────────────────────────┐
│          로컬 애플리케이션           │
│  - 유효성 검사 (2자 ~ 500자)         │
│  - sentiment.analyze() 호출          │
│  - LocalStorage 데이터 업데이트      │
│  - CSS 변수를 통한 실시간 테마 변경  │
└──────────────────────────────────────┘
```

---

## 3. 디렉터리 및 파일 구조

프로젝트 루트 디렉터리에 애플리케이션 코드를 배치합니다.
```text
PRD-TRD_example/
├── index.html        # 메인 웹 페이지 마크업 및 외부 CDN 로드
├── style.css         # 글로벌 스타일 변수, 반응형 레이아웃 및 애니메이션
├── script.js        # 애플리케이션 로직, 상태 관리, 이벤트 바인딩
└── README.md
```

---

## 4. 기능 상세

### 4.1 입력 및 검증 기능
- **입력 양식**: HTML `textarea` 요소 활용.
- **실시간 피드백**: `input` 이벤트 감지를 통해 실시간 입력 글자 수 계산 및 화면 표시 (최대 500자).
- **유효성 검사**:
  - `trim()` 후 빈 값이거나 공백만 있는 경우 작동 차단.
  - 글자 수가 2자 미만인 경우 분석 요청을 차단하고 사용자 경고 노출.

### 4.2 감정 분석 및 테마 렌더링
- **감정 분석 클래스 인스턴스화**: `const sentiment = new Sentiment();`
- **감정 스펙트럼 처리**:
  - **Positive**: `score > 0` 
  - **Neutral**: `score === 0`
  - **Negative**: `score < 0`
- **실시간 테마 바인딩**:
  - 분석 결과에 따라 `document.documentElement.style.setProperty()`를 사용하여 CSS 변수(--theme-color, --theme-bg, --theme-shadow)를 동적으로 업데이트.

### 4.3 추천 답변 알고리즘
- 각 감정 상태에 매핑되는 3가지 공감 텍스트 배열을 정의하고, 수학적 난수 생성을 통해 답변을 무작위로 선택하여 렌더링.
  ```javascript
  const randomIndex = Math.floor(Math.random() * responsePool[label].length);
  const recommendation = responsePool[label][randomIndex];
  ```

### 4.4 로컬 히스토리 관리
- 분석 완료 시, `appState.history` 배열 맨 앞에 새로운 기록 객체를 추가.
- 배열의 크기가 3을 초과하는 경우 `pop()` 처리하여 최대 3개 유지.
- `localStorage.setItem('emotion_history', JSON.stringify(appState.history))`를 수행하여 브라우저에 저장하고, 페이지 최초 로딩 시 `localStorage.getItem`을 통해 복원하여 리스트 렌더링.

---

## 5. UI/UX 디자인 시스템

### 5.1 색상 및 테마 변수 (Dynamic Variables)
- **공통 변수**:
  - `--glass-bg`: `rgba(255, 255, 255, 0.05)` (글래스모피즘 효과용)
  - `--glass-border`: `rgba(255, 255, 255, 0.1)`
  - `--text-primary`: `#ffffff`
  - `--text-secondary`: `#94a3b8`
- **감정 매핑 색상**:
  - **Positive**: Emerald (Color: `#10b981`, Shadow: `rgba(16, 185, 129, 0.2)`)
  - **Neutral**: Slate (Color: `#64748b`, Shadow: `rgba(100, 116, 139, 0.2)`)
  - **Negative**: Rose (Color: `#f43f5e`, Shadow: `rgba(244, 63, 94, 0.2)`)

### 5.2 컴포넌트 목록
1. **Header Component**: 로고, 영문 가이드라인 서브텍스트.
2. **Text Input Form**: `textarea`, 글자 수 카운터, 분석 버튼.
3. **Sentiment Dashboard**:
   - 감정 라벨 및 이모지.
   - 상세 점수 게이지 바.
4. **Recommendation Card**: 공감 답변 카드.
5. **Timeline History**: 하단 3개 분석 내역 타임라인.

---

## 6. 예외 처리 규격

### 6.1 Sentiment.js 로드 실패 시
- `Sentiment` 클래스가 정의되지 않은 경우(`typeof Sentiment === 'undefined'`), 사용자 화면에 "감정 분석 엔진을 불러오는 중입니다..."라는 에러 메시지를 표시하고 분석 실행 버튼을 비활성화 처리하여 런타임 오류 방지.

### 6.2 입력 범위 미달/초과
- 유효성 검사 실패 시, 애니메이션 효과(인풋 영역 흔들림 - shake effect)와 함께 경고 텍스트를 노출하여 시각적 직관성 확보.

---

## 7. 비기능적 요건 및 성능 기준
- **로딩 및 응답 시간**: 브라우저 로컬 연산으로 처리되므로 분석 요청 시 100ms 이내에 즉시 렌더링 완료.
- **반응형 뷰포트**: 
  - 모바일(최대 480px): 단일 열 세로 배치
  - 태블릿 및 데스크톱: 중앙 집중형 레이아웃 설계
