# Bot Template by ProjectDiscord

A **monorepo TypeScript template** for building multiple Discord bots and utilities with shared logic, types, and tools.
This project uses **Turborepo** for workspace management and a clean modular structure.

---

## 📦 Structure

```
bot-template/
│
├─ package.json               # Root config (workspaces, scripts, dependencies)
├─ tsconfig.json              # Shared TypeScript config
├─ .gitignore
│
├─ packages/                  # Reusable shared packages
│   ├─ core/                  # Core modules (logger, DB, config loader, handlers)
│   │   └─ src/
│   │       ├─ index.ts       # Exports every core feature.
│   │       ├─ baseClient.ts
│   │       ├─ logger.ts
│   │       ├─ database.ts
│   │       ├─ config.ts
│   │       └─ handlers/
│   │           ├─ errors.ts
│   │           ├─ loadCommands.ts
│   │           └─ loadEvents.ts
│   │
│   └─ shared/                # Shared types, constants, helpers
│       └─ src/
│           ├─ index.ts
│           └─ types.ts
│
├─ bots/                      # All Discord bots
│   ├─ client/                # Main client bot
│   │   └─ src/
│   │       ├─ index.ts       # Entrypoint
│   │       ├─ commands/      # Slash & prefix commands
│   │       └─ events/        # Event handlers
│   │
│   └─ helper/                # Secondary helper bot
│       └─ src/
│           ├─ index.ts
│           ├─ events/
│           └─ commands/
│
└─ tools/                     # Utility scripts / dev tools
    └─ generate-docs/
        └─ src/index.ts
```

---

## 🚀 Features

* **Multi-bot support**
  * `bots/client` = main Discord bot
  * `bots/helper` = secondary helper bot
* **Shared logic via packages**
  * `packages/core` → client, logging, database, config, etc.
  * `packages/shared` → types, constants, utilities
* **Turborepo** for fast builds & caching
* **TypeScript** out of the box
* **Clean structure** for commands, events, and tools
* **Easily extendable** with more bots or services

---

## 🛠️ Getting Started

### 1. Clone repo

```sh
git clone https://github.com/ProjectDiscord/bot-template.git
cd bot-template
```

### 2. Install dependencies

```sh
npm install
```

### 3. Setup environment variables (.env) (ROOT)

```env
# Database
DATABASE_URL="mysql://<username>:<password>@<host>:<port>/<database>"

# Main Client Bot
CLIENT_TOKEN="your-client-bot-token"
CLIENT_ID="your-client-id"
CLIENT_SECRET="your-client-secret"
CLIENT_PREFIX="?"

# Helper Bot (optional)
HELPER_CLIENT_TOKEN="your-helper-bot-token"
HELPER_CLIENT_ID="your-helper-client-id"
HELPER_CLIENT_SECRET="your-helper-client-secret"
HELPER_CLIENT_PREFIX="?"

# Error handling
ENABLE_ERROR_HANDLER=true
ENABLE_SEND_TO_WEBHOOK=true
ERROR_WEBHOOK_URL="your-discord-webhook-url"
```

### 4. Run a bot

```sh
# Start main client bot
npm run start:bot

# Start helper bot
npm run start:helper
```

---

## 📜 Scripts

From root:

```sh
npm run start:bot                  # Run main client bot
npm run start:helper               # Run helper bot
npm run build                      # Build all packages & bots
npm run lint                       # Run linter
npm run format                     # Run Formatter
```

---

## 🔗 Workspaces

* **packages/core** → common modules like client, logger, database, config loader
* **packages/shared** → shared types/interfaces/constants
* **bots/client** → main Discord bot with commands & events
* **bots/helper** → additional bot/service
<!-- * **tools/generate-docs** → utility script to auto-generate documentation -->

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add my feature'`)
4. Push branch (`git push origin feature/my-feature`)
5. Create a Pull Request

---

## 📄 License

MIT License © ProjectDiscord