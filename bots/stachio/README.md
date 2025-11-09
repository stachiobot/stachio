# Client Bot

The **Client Bot** is the **main Discord bot** in the ProjectDiscord ecosystem.  
It handles core server functionality, commands, events, and user interaction.

---

## 🚀 Features
- Slash commands (`/`) for server members
- Event handling (joins, leaves, message logging, etc.)
- Integration with **Core** and **Shared** modules
- Configurable command modules
- Designed for scalability with [Discord.js](https://discord.js.org)

---

## 📦 Requirements
- Node.js **v20+**
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- Access to the **Core** and **Shared** workspaces

---

## 🛠️ Development

* Uses the **Core** for base framework
* Uses the **Shared** package for utilities
* Supports hot-reload via `ts-node` in development mode

---

## 📌 Notes

* This is the **main bot** of the project.
* All production features are integrated here.
* Keep **Helper Bot** (see `/bots/helper`) in sync for supportive tasks.