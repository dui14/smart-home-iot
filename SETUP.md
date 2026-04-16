# SETUP Database (Supabase)

Tai lieu nay tap trung phan database de sau khi clone project, ban co the chay `npm start` ngay.

## 1. Yeu cau

- Node.js 18 tro len
- Tai khoan Supabase va 1 project database da tao

## 2. Tao schema database

1. Mo Supabase SQL Editor.
2. Copy toan bo noi dung trong `database/schema.sql` va chay 1 lan.
3. Xac nhan da co 3 bang:
   - `chat_sessions`
   - `chat_messages`
   - `command_executions`

## 3. Cau hinh bien moi truong

Tao file `.env` tai thu muc goc voi gia tri toi thieu:

```env
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
DB_SSL=true
ESP32_BASE_URL=http://127.0.0.1:8080
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key
```

Neu ban dung Gemini:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
```

## 4. Chay ung dung

```bash
npm install
npm start
```

Neu ket noi thanh cong, terminal se hien log co noi dung: `[DB] PostgreSQL connected ...`.
