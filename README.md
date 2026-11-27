# 📚 Book Store Backend

프로그래머스 북스토어 풀스택 과정에서 제작한 온라인 서점 백엔드 서버입니다.
Express.js + MySQL(MariaDB) 기반의 REST API 서버로, 프론트엔드와 연동하여 도서 이커머스 핵심 기능을 제공합니다.

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| Runtime | Node.js |
| Framework | Express.js |
| 데이터베이스 | MySQL / MariaDB (mysql2, 주문 API는 `mysql2/promise` + 트랜잭션) |
| 인증 | JWT (jsonwebtoken) |
| 비밀번호 암호화 | Node.js `crypto` (pbkdf2 + salt) |
| CORS | cors |
| 환경 변수 | dotenv |
| HTTP 상태 코드 | http-status-codes |

## 📁 프로젝트 구조

```
├── app.js              # 앱 진입점, CORS 설정 및 라우터 등록
├── auth.js             # JWT 검증 헬퍼 (ensureAuthorization)
├── mariadb.js          # DB 커넥션 (mysql2)
├── routes/             # 라우트 정의 (URI ↔ 컨트롤러 매핑)
│   ├── users.js
│   ├── books.js
│   ├── categories.js
│   ├── likes.js
│   ├── carts.js
│   └── orders.js
├── controller/         # 비즈니스 로직 및 DB 쿼리
│   ├── UserController.js
│   ├── BookController.js
│   ├── CategoryController.js
│   ├── LikeController.js
│   ├── CartController.js
│   └── OrderController.js
├── .env.example        # 환경 변수 예시
└── package.json
```

## 🔌 API 엔드포인트

🔒 표시는 로그인(JWT)이 필요한 API입니다.

### 회원 `/users`

| 메서드 | 경로 | 설명 | 요청 Body |
|--------|------|------|-----------|
| POST | `/users/join` | 회원가입 (중복 이메일 시 409) | `email`, `password` |
| POST | `/users/login` | 로그인, JWT 발급 (유효기간 1시간) | `email`, `password` |
| POST | `/users/reset` | 비밀번호 초기화 요청 (가입 이메일 확인) | `email` |
| PUT | `/users/reset` | 비밀번호 초기화 | `email`, `password` |

### 도서 `/books`

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/books` | 도서 목록 조회 (카테고리·신간 필터, 페이지네이션) |
| GET | `/books/best` | 베스트 도서 조회 (좋아요 순 상위 10권) |
| GET | `/books/:id` | 도서 상세 조회 (토큰이 있으면 본인 좋아요 여부 `liked` 포함) |

`GET /books` 쿼리 파라미터

| 이름 | 설명 | 기본값 |
|------|------|--------|
| `categoryId` (또는 `category_id`) | 카테고리 ID로 필터 | - |
| `news` | `true`이면 최근 1개월 내 출간 도서만 조회 | - |
| `limit` | 페이지당 도서 수 | `8` |
| `currentPage` | 현재 페이지 | `1` |

응답 형식: `{ books: [...], pagination: { currentPage, totalCount } }`

### 카테고리 `/categories`

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/categories` | 카테고리 전체 목록 조회 |

### 좋아요 `/likes` 🔒

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/likes/:id` | 도서 좋아요 추가 (이미 좋아요한 경우 409) |
| DELETE | `/likes/:id` | 도서 좋아요 취소 |

### 장바구니 `/carts` 🔒

| 메서드 | 경로 | 설명 | 요청 Body |
|--------|------|------|-----------|
| POST | `/carts` | 장바구니 담기 | `bookId`, `quantity` |
| GET | `/carts` | 장바구니 조회 / 주문서 조회 | `selected` (선택한 장바구니 ID 배열, 생략 시 전체 조회) |
| DELETE | `/carts/:id` | 장바구니 항목 삭제 | - |

### 주문 `/orders` 🔒

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/orders` | 주문하기 (배송 정보 저장 → 주문 생성 → 주문 도서 저장 → 장바구니 삭제를 하나의 트랜잭션으로 처리) |
| GET | `/orders` | 주문 목록 조회 (최신순) |
| GET | `/orders/:id` | 주문 상세 조회 (주문한 도서 목록) |

`POST /orders` 요청 Body 예시

```json
{
  "items": [1, 2],
  "delivery": {
    "address": "서울시 ...",
    "receiver": "홍길동",
    "contact": "010-1234-5678"
  },
  "totalQuantity": 3,
  "totalPrice": 45000,
  "firstBookTitle": "도서 제목"
}
```

> `items`는 주문할 장바구니 항목 ID 배열입니다.

## 🔐 인증

- 로그인 시 발급받은 토큰을 요청 헤더의 `Authorization`에 그대로 담아 보냅니다. (`Bearer` 접두사 없음)

  ```
  Authorization: <token>
  ```

- 토큰이 없거나 유효하지 않으면 `401` + `{ "message": "로그인이 필요합니다." }`
- 토큰이 만료되면 `401` + `{ "message": "로그인 세션이 만료되었습니다." }`

## 🚀 시작하기

### 사전 요구 사항

- Node.js 18 이상
- MySQL 8 이상 또는 MariaDB

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

> CORS는 `http://localhost:3000`(프론트엔드 개발 서버)만 허용하도록 설정되어 있습니다. 배포 시 `app.js`의 `origin`을 수정하세요.

### 환경 변수 설정

`.env.example`을 복사해 루트 디렉터리에 `.env` 파일을 만들고 값을 채웁니다.

```env
PORT=            # 서버 포트

DB_HOST=         # DB 호스트
DB_USER=         # DB 사용자
DB_PASSWORD=     # DB 비밀번호
DB_NAME=         # 데이터베이스 이름

PRIVATE_KEY=     # JWT 서명 키
```

## 🔗 관련 저장소

- 프론트엔드: [prgms-book-store-frontend](https://github.com/eunmilee89/prgms-book-store-frontend)
