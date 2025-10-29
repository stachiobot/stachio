# Bot Template by ProjectDiscord

A **monorepo TypeScript template** for building multiple Discord bots and utilities with shared logic, types, and tools.
This project uses **Turborepo** for workspace management and a clean modular structure.

---

## 📦 Structure

```
stachio/
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
# ================================
# Database Configuration
# ================================
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME"

# ================================
# Dashboard Configuration
# ================================
DASHBOARD_PORT=80
DASHBOARD_DOMAIN="https://yourdomain.com"
DASHBOARD_REDIRECT_URI="/discord/callback"
DASHBOARD_LICENSE="YOUR-LICENSE-KEY"

# ================================
# Transcript Configuration
# ================================
TRANSCRIPT_PORT=5050
TRANSCRIPT_DOMAIN="https://logs.yourdomain.com"

# ================================
# Main Client Bot
# ================================
CLIENT_TOKEN="YOUR-MAIN-BOT-TOKEN"
CLIENT_ID="YOUR-MAIN-BOT-ID"
CLIENT_SECRET="YOUR-MAIN-BOT-SECRET"
CLIENT_PREFIX="s?"

# ================================
# Helper Bot (optional)
# ================================
HELPER_CLIENT_TOKEN="YOUR-HELPER-BOT-TOKEN"
HELPER_CLIENT_ID="YOUR-HELPER-BOT-ID"
HELPER_CLIENT_SECRET="YOUR-HELPER-BOT-SECRET"
HELPER_CLIENT_PREFIX="s?"

# ================================
# Error & Logging
# ================================
ENABLE_ERROR_HANDLER=true
ENABLE_SEND_TO_WEBHOOK=false
ERROR_WEBHOOK_URL="YOUR-ERROR-WEBHOOK-URL"

# ================================
# Role, Channels, and Guild IDs
# ================================
# REPORT
REPORT_CATEGORY_ID="YOUR-REPORT-CATEGORY-ID"
REPORT_STAFF_ROLE_ID="YOUR-REPORT-STAFF-ROLE-ID"

# APPEAL
APPEAL_CATEGORY_ID="YOUR-APPEAL-CATEGORY-ID"
APPEAL_STAFF_ROLE_ID="YOUR-APPEAL-STAFF-ROLE-ID"

# Stachio (Main Staff Role)
STACHIO_STAFF_ROLE_ID="YOUR-STACHIO-STAFF-ROLE-ID"
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