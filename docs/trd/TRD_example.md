# Emotion Analyzer Web App - TRD

## 1. 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | HTML |
| Styling | CSS |
| Logic | JavaScript |
| Sentiment Analysis | Sentiment.js |
| Deployment | Vercel |
| Version Control | GitHub |

---

## 2. 시스템 구조

```text
Browser
↓
HTML/CSS UI
↓
JavaScript Logic
↓
Sentiment.js 분석
↓
결과 출력
```

---

## 3. 파일 구조

```text
/project
- index.html
- style.css
- script.js
```

---

## 4. 기능 상세

### 4.1 입력 기능
#### 설명
사용자가 문장을 입력

#### 구현 방식
- `textarea` 사용
- 입력값 `trim()` 처리

---

### 4.2 감정 분석 기능

#### 설명
입력 문장의 감정을 분석

#### 구현 방식
- Sentiment.js 라이브러리 사용
- `sentiment.analyze()` 호출

#### 출력 데이터
- score
- comparative
- positive/negative 판별

---

### 4.3 추천 답변 기능

#### 설명
감정 결과에 따라 추천 문장 출력

#### 로직
- `if score > 0` → Positive 메시지 ("좋은 하루였나 보네요!")
- `if score < 0` → Negative 메시지 ("많이 힘들었겠어요.")
- `if score === 0` → Neutral 메시지 ("조금 더 이야기해줄래요?")

---

## 5. UI 구조

### Components
- Header
- Textarea
- Analyze Button
- Result Card
- Recommendation Card

---

## 6. 상태 관리

간단한 변수 기반 처리

예시:
- `inputText`
- `sentimentScore`
- `recommendationMessage`

Framework 사용 안 함

---

## 7. 예외 처리

### 빈 입력값
- alert 출력
- 분석 실행 차단

---

## 8. 성능 요구사항

- 페이지 로딩 2초 이하
- 분석 응답 즉시 처리
- 외부 API 호출 없음

---

## 9. 보안 요구사항

- 사용자 데이터 저장 안 함
- 서버 없음
- Local only processing

---

## 10. 배포 방식

### GitHub
소스 업로드

### Vercel
GitHub 연동 후 자동 배포

---

## 11. 향후 확장 가능성

- OpenAI API 연동
- 감정 차트 시각화
- 사용자 기록 저장
- 다국어 감정 분석
- AI 챗봇 연결
