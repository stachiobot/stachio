# Shared Workspace

The **Shared** workspace contains types, constants, interfaces, and utilities that are used across multiple bots and workspaces.

---

## 🛠 Features

- **Types (`types.ts`)**  
  Centralized TypeScript types for commands, events, and other shared structures.

- **Constants (`index.ts`)**  
  Shared constants such as default prefixes, embed colors, IDs, or environment variables.

- **Versioning (`VERSION`)**  
  Tracks the shared workspace version.

---

## 📦 Installation / Usage

1. Import the shared workspace into your bot or other workspaces:

```ts
import { SomeType, SOME_CONSTANT } from 'shared';
````

2. Use types and constants for type safety and consistency across bots:

```ts
const command: SomeType = {
  name: 'ping',
  description: 'Ping command',
};
console.log('Prefix is', SOME_CONSTANT.PREFIX);
```

---

## ⚡ Notes

* Keep all shared code framework-agnostic — it should not depend on any specific bot logic.
* Update `VERSION` whenever shared utilities change to keep track of workspace versions.