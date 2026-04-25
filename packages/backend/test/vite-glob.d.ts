/* Minimal ambient declaration for `import.meta.glob`, used by `convex-test`
 * (and therefore `@confect/test`) to load Convex modules into a sandboxed
 * runtime. We only need the subset that returns lazy module loaders, which is
 * what the `TestConfect.layer` setup expects.
 *
 * We avoid pulling in `vite/client` here because the backend package is not a
 * Vite app — only its tests run under Vitest, which polyfills this method.
 */
interface ImportMeta {
  glob(
    pattern: string | string[],
    options?: { eager?: false },
  ): Record<string, () => Promise<Record<string, unknown>>>;
  glob(
    pattern: string | string[],
    options: { eager: true },
  ): Record<string, Record<string, unknown>>;
}
