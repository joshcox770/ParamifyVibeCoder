# Project guide for Claude

This is a **template repo** for vibe-coded full-stack apps: React Router v7
(Remix-style, SSR) + TypeScript + TailwindCSS, deployed as a Docker container
behind a Traefik reverse proxy.

## ⭐ Authenticated user — this is built in, always use it

**There is already a first-class way to get the current signed-in user. Never
build your own auth, login page, session store, or user-fetching code.** In
production the app runs behind Traefik's ForwardAuth proxy (Google OAuth), which
authenticates every request and forwards the user's email as the
`X-Forwarded-User` header. The plumbing for reading that is done.

### How identity flows

1. `app/auth.server.ts` → `getUser(request)` reads the trusted header. Locally
   (`NODE_ENV === "development"`), where Traefik isn't running, it falls back to
   `local-dev@paramify.com`. In production a missing header fails closed (401).
2. `app/root.tsx` calls `getUser` in its root `loader` and returns `{ user }`.
3. `app/hooks/use-user.ts` → `useUser()` exposes it to any component.

### How to use it (copy these patterns)

**In a component** — get the user anywhere, no props, fully typed:

```tsx
import { useUser } from "~/hooks/use-user"; // or relative path

function Greeting() {
  const user = useUser(); // { email: string }
  return <p>Hello, {user.email}</p>;
}
```

**In a loader/action** — when the server needs the user (e.g. for DB queries):

```ts
import { getUser } from "~/auth.server"; // or relative path

export async function loader({ request }: Route.LoaderArgs) {
  const user = getUser(request);
  // ...scope data to user.email
}
```

**To gate a route by authorization** (authenticated AND allowed), add and use a
`requireUser(request, predicate)` helper in `app/auth.server.ts` rather than
checking on the client. The server is the trust boundary.

### Rules

- The `User` type lives in `app/auth.server.ts`. Extend it there if you need
  more fields; don't redefine user shapes elsewhere.
- Anything that touches identity or secrets goes in a `*.server.ts` file so it's
  stripped from the client bundle.
- Trust `X-Forwarded-User` only because Traefik sets it. Don't expose a route
  path that bypasses the proxy.

## Project conventions

- **Routes** are configured in `app/routes.ts`; route modules export
  `loader` (server GET), `action` (server mutations), and a default component.
- **Server-only code** uses the `.server.ts` suffix.
- **Styling** is TailwindCSS.
- Run `npm run typecheck` before considering a change done. `npm run dev` starts
  the dev server at `http://localhost:5173`.
