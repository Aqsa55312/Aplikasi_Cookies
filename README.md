# Cloudflare Workers Full-Stack Template

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Aqsa55312/Aplikasi_Cookies)

A production-ready full-stack application template built on Cloudflare Workers, featuring a React frontend with shadcn/ui and a powerful backend using Durable Objects for stateful entities like Users and Chats. This template demonstrates real-time data persistence, indexed listing, and CRUD operations in a type-safe TypeScript environment.

## Key Features

- **Cloudflare Durable Objects**: Multi-tenant storage for entities (Users, ChatBoards) with automatic indexing and pagination.
- **React 18 + Vite**: Fast, modern frontend with TanStack Query for data fetching.
- **shadcn/ui + Tailwind CSS**: Beautiful, customizable UI components with dark mode support.
- **Hono**: Lightweight, ultrafast web framework for API routing.
- **End-to-End TypeScript**: Shared types between frontend and worker for type safety.
- **Bun Support**: Optimized for Bun package manager and runtime.
- **Production-Ready**: CORS, error handling, logging, and Cloudflare deployment configured.
- **Responsive Design**: Mobile-first layout with sidebar and theme toggle.

## Technology Stack

- **Backend**: Cloudflare Workers, Durable Objects, Hono
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide React, TanStack Query, React Router
- **State & Data**: Immer, Zustand (ready for use)
- **UI Utils**: clsx, Tailwind Merge, Framer Motion
- **Dev Tools**: Bun, ESLint, TypeScript, wrangler
- **Other**: Sonner (toasts), React Hook Form, Zod (form validation ready)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Cloudflare CLI (wrangler)](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- Cloudflare account and API token with Workers permissions

### Installation

1. Clone or download the repository.
2. Install dependencies:

   ```bash
   bun install
   ```

3. Generate Worker types:

   ```bash
   bun run cf-typegen
   ```

### Development

- Start the development server (frontend + Workers preview):

  ```bash
  bun run dev
  ```

  Opens at `http://localhost:3000` (or `$PORT`).

- Build for production:

  ```bash
  bun run build
  ```

- Lint:

  ```bash
  bun run lint
  ```

- Preview production build:

  ```bash
  bun run preview
  ```

## Usage

### Frontend

Replace `src/pages/HomePage.tsx` with your app UI. Use `AppLayout` from `src/components/layout/AppLayout.tsx` for sidebar layout. API calls via `src/lib/api-client.ts`:

```typescript
import { api } from '@/lib/api-client';

// Example: Fetch users
const users = await api<User[]>('/api/users');

// Example: Create chat
const chat = await api<Chat>('/api/chats', {
  method: 'POST',
  body: JSON.stringify({ title: 'New Chat' })
});
```

### Backend

- Add custom routes in `worker/user-routes.ts`.
- Extend entities in `worker/entities.ts` using `IndexedEntity`.
- Core utilities in `worker/core-utils.ts` (do not modify).

#### API Endpoints

| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| GET    | `/api/users`              | List users (paginated)       |
| POST   | `/api/users`              | Create user                  |
| DELETE | `/api/users/:id`          | Delete user                  |
| POST   | `/api/users/deleteMany`   | Delete multiple users        |
| GET    | `/api/chats`              | List chats (paginated)       |
| POST   | `/api/chats`              | Create chat                  |
| GET    | `/api/chats/:chatId/messages` | List chat messages       |
| POST   | `/api/chats/:chatId/messages` | Send message to chat     |
| DELETE | `/api/chats/:id`          | Delete chat                  |
| POST   | `/api/chats/deleteMany`   | Delete multiple chats        |

All responses follow `{ success: boolean; data?: T; error?: string }`.

## Deployment

1. Configure `wrangler.jsonc` with your Cloudflare account ID if needed.
2. Deploy to Cloudflare Workers:

   ```bash
   bun run deploy
   ```

3. Your app will be live at `https://<worker>.<subdomain>.workers.dev`.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Aqsa55312/Aplikasi_Cookies)

## Project Structure

```
├── src/              # React frontend
├── worker/           # Cloudflare Worker backend
├── shared/           # Shared types & mocks
├── tailwind.config.js # Tailwind + shadcn/ui config
└── wrangler.jsonc    # Workers config
```

## Customization

- **UI Components**: Add shadcn/ui components via `npx shadcn@latest add <component>`.
- **Entities**: Extend `IndexedEntity` in `worker/entities.ts`.
- **Routes**: Add to `worker/user-routes.ts`.
- **Theme**: Customize in `tailwind.config.js` and `src/index.css`.

## Troubleshooting

- **Types out of sync**: Run `bun run cf-typegen`.
- **Deploy fails**: Ensure `wrangler login` and valid API token.
- **CORS issues**: Pre-configured for `*` in dev.

## Contributing

1. Fork the repo.
2. Create a feature branch.
3. Submit a PR with detailed changes.

## License

MIT License. See [LICENSE](LICENSE) for details.