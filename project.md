# Project: MyApp

## Purpose
A personal test-and-playground React application used to explore UI patterns, small games,
and utility features. It is not production-grade and does not serve external users; the
priority is clean, consistent code that is easy to extend with new experiments.

## Hard Constraints

### Stack
- **React 18** with **TypeScript** (strict mode via `tsconfig.json`)
- **Vite** as the build tool; `pnpm` as the package manager
- **Vitest** + **@testing-library/react** + **happy-dom** for all tests
- No external UI component libraries; all UI is hand-rolled with plain CSS modules
  co-located next to their component (`ComponentName.css`)
- No React Router or any third-party routing library; routing is handled exclusively
  through the custom `useRouter` hook and a `switch`/`case` block in `App.tsx`

### File & Module Conventions
- Path alias `@/` maps to `src/`; all internal imports must use it (never relative `../`)
- Pages live in `src/pages/` and are named `<FeatureName>Page.tsx` with a matching
  `<FeatureName>Page.css` and `<FeatureName>Page.test.tsx`
- Shared components live in `src/components/`; hooks in `src/hooks/`; static data in
  `src/data/`
- Named exports only — no default exports except `App` in `App.tsx`
- Imports must be sorted per `eslint-plugin-simple-import-sort` rules (enforced by lint)

### Routing
- New pages are registered in exactly two places: the `switch`/`case` in `App.tsx` and
  the `<ul>` in `NavBar.tsx`
- Route paths are lowercase kebab-case (e.g. `/word-game`); the canonical word-game route
  is `/wordgame`

### Linting & Formatting
- ESLint config in `.eslintrc.js` must pass with zero errors before any commit
- Prettier is enforced via `eslint-plugin-prettier`; config lives in `.prettierrc.js`
- Commits must conform to Conventional Commits (`commitlint.config.js`); enforced by Husky
- `lint-staged` runs ESLint fix + Prettier on staged files before every commit

### Testing
- Every page component must have a co-located `*.test.tsx` file covering at minimum:
  rendering, core interactions, and accessibility attributes
- `aria-label`, `role`, and `aria-live` attributes are required on all interactive and
  status-bearing elements
- Tests use `@testing-library/react` query patterns (prefer `getByRole`, then
  `getByLabelText`, then `getByText`); avoid `getByTestId`

### CI
- GitHub Actions workflow (`.github/workflows/ci.yml`) runs `pnpm test:ci` and
  `pnpm build:ci` on every push; both must pass

## Non-Goals
- No backend, API server, or database — all data is static or client-side state
- No authentication or user accounts
- No production deployment pipeline beyond the existing GitHub Actions build check
- No third-party analytics, error tracking, or monitoring
- No internationalisation (i18n) or localisation
- No mobile-native or PWA features (responsive CSS is fine; service workers are out of scope)
