# 📚 Book Store Backend

프로그래머스 북스토어 풀스택 과정에서 제작한 온라인 서점 백엔드 서버입니다.
Express.js + MySQL 기반의 REST API 서버로, 프론트엔드와 연동하여 도서 이커머스 핵심 기능을 제공합니다.

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| Runtime | Node.js |
| Framework | Express.js |
| 데이터베이스 | MySQL (mysql2) |
| 인증 | JWT (jsonwebtoken) |
| 유효성 검사 | express-validator |
| 환경 변수 | dotenv |
| HTTP 상태 코드 | http-status-codes |

## 📁 프로젝트 구조

```
├── app.js              # 앱 진입점, 미들웨어 및 라우터 등록
├── routes/             # 라우트 정의 (URI ↔ 컨트롤러 매핑)
│   ├── books.js
│   ├── users.js
│   ├── carts.js
│   ├── orders.js
│   └── likes.js
├── controller/         # 비즈니스 로직 및 DB 쿼리
│   ├── BookController.js
│   ├── UserController.js
│   ├── CartController.js
│   ├── OrderController.js
│   └── LikeController.js
└── package.json
```

## 🔌 API 엔드포인트

| 도메인 | 메서드 | 경로 | 설명 |
|--------|--------|------|------|
| 도서 | GET | `/books` | 도서 목록 조회 (카테고리/검색 필터) |
| 도서 | GET | `/books/:id` | 도서 상세 조회 |
| 회원 | POST | `/join` | 회원가입 |
| 회원 | POST | `/login` | 로그인 (JWT 발급) |
| 회원 | PUT | `/reset` | 비밀번호 초기화 요청 |
| 회원 | PUT | `/reset-password` | 비밀번호 변경 |
| 장바구니 | GET | `/carts` | 장바구니 목록 조회 |
| 장바구니 | POST | `/carts` | 장바구니 담기 |
| 장바구니 | DELETE | `/carts/:id` | 장바구니 항목 삭제 |
| 주문 | POST | `/orders` | 주문하기 |
| 주문 | GET | `/orders` | 주문 목록 조회 |
| 주문 | GET | `/orders/:id` | 주문 상세 조회 |
| 좋아요 | POST | `/likes/:bookId` | 좋아요 추가 |
| 좋아요 | DELETE | `/likes/:bookId` | 좋아요 취소 |

> 실제 라우트 경로는 코드에 따라 다를 수 있습니다.

## 🚀 시작하기

### 사전 요구 사항

- Node.js 18 이상
- MySQL 8 이상

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/eunmilee89/prgms-book-store-backend.git
cd prgms-book-store-backend

# 의존성 설치
npm install

# 서버 실행 
node app.js
```

### 환경 변수 설정

루트 디렉터리에 `.env` 파일을 생성하고 다음 값을 설정합니다.

```env
PORT=

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
JWT_EXPIRES_IN=
```

## 🔗 관련 저장소

- 프론트엔드: [prgms-book-store-frontend](https://github.com/eunmilee89/prgms-book-store-frontend)
