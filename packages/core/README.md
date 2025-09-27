# Core Workspace

The **Core** workspace contains the fundamental building blocks used by all bots and services in this monorepo.  
It includes utilities such as configuration management, logging, database connection, and developer/debugging tools.

---

## 🛠 Features

- **Configuration (`config.ts`)**  
  Centralized configuration using environment variables (`.env`).

- **Client (`index.ts`)**  
  Main part of the core installing the client.

- **Logger (`logger.ts`)**  
  Unified logging system with console output and optional Discord notifications.

- **Database (`database.ts`)**  
  Abstracted database connection for SQLite, MySQL, or PostgreSQL.

- **Versioning (`VERSION`)**  
  Tracks the core version used by any bot.

- **Developer Tools (`devTools.ts`)**  
  Helpers for debug logging, object inspection, etc.

---

## 📦 Installation / Usage

1. Ensure the workspace is added as a Git submodule if needed.
2. Import utilities into your bot:

```ts
import { config, logger, connectDB, devTools } from 'core';
```

3. Use the modules as needed:

```ts
logger.info('Bot starting...');
connectDB();
devTools.debug('Debug message');
console.log('Core version:', getVersion('core'));
```

---

## ⚡ Notes

- Always update the `VERSION` file when releasing changes to ensure bots are aware of the current core version.
- Designed for use with TypeScript and Node.js (ESM modules).
