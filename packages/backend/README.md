# `@cataster/backend`

Convex backend for cataster, written with [Confect](https://confect.dev) so
every function is an Effect program with Effect Schemas for inputs, outputs,
and errors.

## Layout

```
packages/backend/
├── confect/                 # ← write code here
│   ├── _generated/          # ← codegen output (gitignored)
│   ├── auth/
│   │   └── requireUser.ts   # require a signed-in Clerk user
│   ├── auth.ts              # Clerk JWT issuer config
│   ├── health.spec.ts       # GroupSpec: shape of `health.*` functions
│   ├── health.impl.ts       # GroupImpl: handlers for `health.*`
│   ├── impl.ts              # top-level Impl, finalized for Convex
│   ├── schema.ts            # DatabaseSchema (no tables yet)
│   ├── spec.ts              # top-level Spec
│   ├── tsconfig.json
│   └── wire.ts              # `surfaceErrors` (Effect → ConvexError)
├── convex/                  # ← gitignored except for the two files below
│   ├── convex.config.ts     # Convex app definition (hand-written)
│   └── tsconfig.json        # Convex's TS config (hand-written)
└── test/
    ├── TestConfect.ts       # @confect/test layer scoped to our schema
    └── health.test.ts       # smoke test for health.ping
```

`confect/` is the source of truth. `convex/` is a codegen target — Confect
writes `convex/<group>.ts` files there that re-export your registered
functions, and also writes `convex/auth.config.ts` and `convex/schema.ts`
from your Confect equivalents. Don't edit anything under `convex/` other
than `convex.config.ts` and `tsconfig.json`.

## Setup (one-time, fresh clone)

`@cataster/validators` must be built once so its `dist/` types are visible to
the rest of the workspace, and Convex must seed its `_generated/` directory:

```bash
pnpm install
pnpm --filter @cataster/validators build
pnpm --filter @cataster/backend setup
```

`setup` runs `confect codegen && convex dev --until-success`. After that:

- `pnpm dev` (from this package) runs `confect dev` and `convex dev` in
  parallel via `concurrently`.
- `pnpm typecheck` runs `confect codegen` first, then `tsc -p confect`.
- `pnpm build` runs `confect codegen` first.
- `pnpm test` runs the `@confect/test` smoke tests under Vitest's
  `edge-runtime` environment (Convex's mock runtime).

## Adding a feature

1. Define the wire shape: a new `<feature>.spec.ts` exporting a `GroupSpec`
   with one or more `FunctionSpec`s. Use Effect Schemas for `args` and
   `returns`.
2. Implement it: `<feature>.impl.ts` with `FunctionImpl.make(api, ...)`
   handlers and a `GroupImpl.make(api, ...)` that provides them.
3. Register it: add the spec to `spec.ts` and the impl to `impl.ts`.
4. Errors that should reach the client must be one of the tagged errors in
   `@cataster/validators` (`UnauthorizedError`, `NotFoundError`, …). Pipe
   handlers through `surfaceErrors` from `wire.ts` at their boundary.
   Function-local errors must be caught and either recovered from or mapped
   to a wire error before reaching that boundary — TypeScript will refuse to
   compile otherwise.
