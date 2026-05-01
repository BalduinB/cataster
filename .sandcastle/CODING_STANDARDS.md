# Coding Standards

<!-- Customize this file with your project's coding standards.
     The reviewer agent loads it during code review via @.sandcastle/CODING_STANDARDS.md
     so these standards are enforced during review without costing tokens during implementation. -->

These standards are derived from the existing tooling (`tooling/eslint`,
`tooling/prettier`, `tooling/typescript`), the Confect/Effect backend in
`packages/backend`, and the TanStack Start app in `apps/tanstack-start`.

## Style

- Formatter: Prettier via `@cataster/prettier-config`. Run `pnpm format:fix`.
    - `tabWidth: 4`, no overrides — apply to TS, TSX, JS, JSON, MD.
    - Imports are sorted by `@ianvs/prettier-plugin-sort-imports`. Order:
        1. React / React Native
        2. Next / Expo
        3. Third-party modules
        4. `@cataster/*` workspace packages (types first via `<TYPES>^@cataster`)
        5. Relative / `~/` aliases (types first)
    - Tailwind classes are sorted by `prettier-plugin-tailwindcss`. `cn` and
      `cva` are recognized class-name functions — wrap conditional class strings
      in those instead of inlining ternaries.
- Naming:
    - `camelCase` for variables, functions, and file-local helpers.
    - `PascalCase` for React components, classes, Effect `Tag`s, and types.
    - `kebab-case` for file names in `apps/tanstack-start` (`location-header.tsx`),
      matching the existing convention.
    - Confect feature files are split as `<feature>.spec.ts` / `<feature>.impl.ts`.
- Exports: prefer **named** exports. Default exports are reserved for
  framework entry points (route components via `createFileRoute`, generated
  Convex modules, the Prettier config).
- Imports:
    - Use `import type` for type-only imports (enforced by ESLint
      `@typescript-eslint/consistent-type-imports` and
      `import/consistent-type-specifier-style: prefer-top-level`).
    - Never import `process.env` directly. Use the validated `~/env` module
      (`tooling/eslint/base.ts → restrictEnvAccess`).
    - In the web app, use the `~/` alias for app-internal imports; cross-package
      imports always go through `@cataster/<pkg>` entry points (no deep paths
      except the Confect generated `@cataster/backend/confect/_generated/refs`).
- TypeScript:
    - Strict mode is on, plus `noUncheckedIndexedAccess` and `checkJs`. Treat
      array/record access as possibly `undefined` and narrow before use.
    - `@typescript-eslint/no-non-null-assertion` is `error`. Don't use `!`;
      narrow with a guard, `Schema.decode*`, or an explicit error.
    - `@typescript-eslint/no-unnecessary-condition` is `error`. Don't add
      redundant `if (x)` checks against types that are already non-nullable —
      fix the type instead.
    - Unused vars/args must be prefixed with `_` to silence the lint.
- React:
    - React 19 with the new JSX runtime — never `import React from "react"`.
    - Hooks rules from `eslint-plugin-react-hooks` (`recommended-latest`).
    - UI strings in the `tanstack-start` app are German (see
      `location-header.tsx`); keep that convention for new user-visible text.

## Testing

- Test runner: Vitest, configured per package.
- Backend (`packages/backend`):
    - Use `@effect/vitest` (`describe`, `it.effect`) and assertion helpers from
      `@effect/vitest/utils` (`assertEquals`, `assertTrue`).
    - Run inside the `edge-runtime` environment via `@confect/test`. New tests
      live under `packages/backend/test/` and use `TestConfect.layer()`:
      `Effect.gen(...).pipe(Effect.provide(TestConfect.layer()))`.
    - Call functions through `refs` from `confect/_generated/refs` — never
      import an impl directly. This keeps tests using the same wire path the
      client does.
    - Every public function (each `FunctionSpec` registered in `spec.ts`)
      should have at least one smoke test covering the happy path and any
      typed wire error it can return.
- Test names describe the observable behavior, not the implementation
  (e.g. `"ping returns ok and a server timestamp"`).
- Tests must not reach the network; OSM and other external integrations
  must be mocked through their service `Tag`.

## Architecture

This is a Turborepo monorepo (`pnpm` workspaces). New code goes into the
existing layout — don't introduce a new top-level folder without updating
`pnpm-workspace.yaml` and `turbo.json`.

```
apps/
  tanstack-start/   TanStack Start + React 19 + Tailwind v4 web app
packages/
  backend/          Convex backend authored with Confect (Effect)
  abilities/        CASL ability definitions (multi-tenant RBAC)
  validators/       Effect Schemas + wire-error vocabulary shared client/server
  ui/               shadcn/ui components, consumed via @cataster/ui/components/*
tooling/
  eslint/ prettier/ typescript/   shared configs (extend, never duplicate)
```

### Backend (Confect + Effect + Convex)

- Authoring lives in `packages/backend/confect/`. The `convex/` directory is
  a codegen target; only `convex.config.ts` and `convex/tsconfig.json` are
  hand-written.
- Each feature is a pair of files:
    - `<feature>.spec.ts` — exports a `GroupSpec` built from `FunctionSpec`s.
      `args` and `returns` are **Effect Schemas**, not Convex `v.*` validators.
      Reuse schemas from `@cataster/validators` instead of redefining them.
    - `<feature>.impl.ts` — exports a `GroupImpl` composed of `FunctionImpl.make`
      handlers that yield typed services and pipe through `surfaceErrors`.
- Register features in `confect/spec.ts` and `confect/impl.ts`.
- Errors:
    - The only tagged errors that may cross the wire are those exported from
      `@cataster/validators` (`UnauthorizedError`, `ForbiddenError`,
      `NotFoundError`, `ConflictError`). Anything else must be caught and
      either recovered or mapped before the boundary.
    - Every handler ends with `.pipe(Effect.provide(ServicesLive), surfaceErrors)`.
      `surfaceErrors` requires `E extends WireError`, so TypeScript will refuse
      to compile if a feature-local error escapes.
- Services (`packages/backend/services/`):
    - One Effect `Tag` per service plus a `Live` `Layer`. Public surface is
      re-exported from `services/index.ts`; consumers import from there.
    - Domain services depend only on Confect's ambient services
      (`DatabaseReader`, `DatabaseWriter`, `MutationCtx`) so providing
      `ServicesLive` never adds unmet requirements at the handler boundary.
    - Internal Convex/Confect failures are converted with `dieOnInternal` —
      handlers should never see raw `GetByIdFailure` etc.
- Multi-tenancy:
    - Identity comes from Clerk via `requireUser` / `requireAbility`. Never
      trust client-supplied `orgId`s.
    - Every read in a domain service is scoped by `orgId` (use the
      `by_orgId_*` indexes, don't filter in JS). Every write stamps `orgId`.
    - Foreign-tenant lookups return `NotFoundError`, not `ForbiddenError`,
      so we don't leak existence across orgs.
    - Authorization uses CASL via `@cataster/abilities`. Handlers gate with
      `requireAbility(action, subject)`; data-layer scoping is the
      defense-in-depth.

### Frontend (TanStack Start)

- Backend access goes through the thin adapters in `apps/tanstack-start/src/lib/confect.ts`:
    - Queries: `confectQuery(refs.public.<group>.<fn>, args)` fed to
      `useSuspenseQuery` and route loaders' `ensureQueryData`.
    - Mutations: `useConfectMutationFn(ref)` plugged into `useMutation`.
    - Actions: `useConfectActionFn(ref)`.
    - All three encode args and decode returns via the shared Effect Schemas;
      don't bypass them by calling Convex hooks directly.
- Errors thrown by mutations/actions go through `toastConfectError(fallback, error)`
  so wire errors surface their typed `message` and unknown defects fall back
  to the generic message — never render `error.message` raw to the user.
- Routes use file-based routing (`createFileRoute`) with a `loader` that
  pre-fetches via `context.queryClient.ensureQueryData`, plus a
  `pendingComponent` for the SSR/streaming fallback.
- UI primitives come from `@cataster/ui/components/base/*`. Don't redefine
  buttons/dialogs/inputs locally; add them via `pnpm ui-add` instead.

### Adding a feature checklist

1. Add or reuse the relevant `Schema`/`TaggedError` in `@cataster/validators`.
2. Extend the schema (`confect/schema.ts`) with required indexes and the
   matching `Table.make(...)` definition. Always add a `by_orgId*` index for
   tenant-scoped tables.
3. Add a service `Tag` + `Live` layer in `packages/backend/services/...`,
   re-export from `services/index.ts`, and merge into `ServicesLive`.
4. Author `<feature>.spec.ts` and `<feature>.impl.ts`. Wrap every handler
   with `requireAbility(...)`, `Effect.provide(ServicesLive)`, and
   `surfaceErrors`.
5. Register in `confect/spec.ts` + `confect/impl.ts`.
6. Add an `it.effect` test under `packages/backend/test/`.
7. Wire the UI through `confectQuery` / `useConfectMutationFn` and surface
   errors with `toastConfectError`.
