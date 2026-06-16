# Database Setup

This guide covers the minimum database configuration required to run the project after cloning the repository.

## Prerequisites

* Node.js 18 or later
* A PostgreSQL database
* An existing PostgreSQL database

## Create the Database Schema

1. Open the **pgAdmin SQL Editor**.
2. Copy the contents of [`schema.sql`](database/schema.sql)
3. Execute the script once.
4. Verify that the following tables have been created:

* `chat_sessions`
* `chat_messages`
* `command_executions`

## Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
DB_SSL=true

ESP32_BASE_URL=http://127.0.0.1:8080

AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Using Gemini

If you want to use Gemini instead of OpenRouter:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
```

If the database connection is successful, you should see a message similar to:

```text
[DB] PostgreSQL connected ...
```

## Verify the Setup

After the server starts:

1. Open the web application.
2. Send a test command or chat message.
3. Confirm that records are created in:

   * `chat_sessions`
   * `chat_messages`
   * `command_executions`

The application is now ready to communicate with the database and ESP32 devices.
