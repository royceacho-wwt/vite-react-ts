# Plan: Word Game (Wordle-style)

## Architecture Overview

A single new page (`WordGamePage`) owns all game state via React `useState`. No global
state, no context, no external store. Game logic (colouring, validation) is extracted into
pure functions so they can be unit-tested independently of the component.

```
src/
  data/
    wordGameTargets.ts      # 50-word target list (string[])
    wordGameDictionary.ts   # ~2 000–3 000 common 5-letter words (Set<string>)
                            # must be a superset of wordGameTargets
  pages/
    WordGamePage.tsx        # page component + sub-components
    WordGamePage.css        # scoped styles
    WordGamePage.test.tsx   # Vitest + Testing Library tests
```

No new shared components or hooks are needed for this iteration.

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Game state location | Local `useState` in `WordGamePage` | Simplest; no cross-page state needed |
| Dictionary format | `Set<string>` (uppercase) built at module load from a static array | O(1) lookup; no async required |
| Target word selection | `Math.random()` over the targets array | Simple; no daily-seed needed yet |
| Logic layer | Pure exported functions in the same file | Easy to import in tests without rendering |
| Routing | New `case '/wordgame'` in `App.tsx` switch | Matches existing pattern exactly |

## Data Shapes

```ts
type TileState = 'correct' | 'present' | 'absent' | 'empty';

interface Tile {
  letter: string;   // uppercase single char, or '' for empty
  state: TileState;
}

type Row = [Tile, Tile, Tile, Tile, Tile]; // always length 5

interface GameState {
  target: string;           // uppercase 5-letter word
  rows: Row[];              // length 6; unfilled rows contain empty tiles
  currentAttempt: number;   // 0–6
  status: 'playing' | 'won' | 'lost';
}
```

## Pure Logic Functions (exportable for testing)

- **`scoreGuess(guess: string, target: string): TileState[]`**
  Implements the two-pass colouring algorithm:
  1. Pass 1 — mark exact matches as `'correct'`; decrement per-letter counts in the target
  2. Pass 2 — for remaining positions, mark `'present'` if the letter still has remaining
     count; otherwise `'absent'`
  Returns an array of 5 `TileState` values.

- **`isInDictionary(word: string): boolean`**
  Checks the `Set<string>` built from `wordGameDictionary.ts`. Case-insensitive (normalises
  to uppercase before lookup).

- **`pickRandomTarget(targets: string[]): string`**
  Returns one entry selected via `Math.floor(Math.random() * targets.length)`.

## Component Breakdown

### `WordGamePage`
Top-level page. Holds `GameState` in `useState`. Renders:
- Page heading
- `<GuessBoard>` — the 6 × 5 grid
- `<GuessInput>` — text field + submit button + inline error
- `<StatusMessage>` — win/loss message + "Play Again" button

### `GuessBoard`
Receives `rows: Row[]` and `currentAttempt: number` as props. Renders a 6-row grid of
`<Tile>` elements. Pure display; no state.

### `Tile`
Receives `letter` and `state`. Applies a CSS class per state:
- `.tile--correct` → green background
- `.tile--present` → yellow background
- `.tile--absent` → grey background
- `.tile--empty` → neutral/outline

Each tile gets an `aria-label` of e.g. `"A, correct"` or `"empty"`.

### `GuessInput`
Controlled input (`value` / `onChange`). Calls parent's `onSubmit(guess)` on button click
or Enter keydown. Displays `errorMessage` prop beneath the field in an `aria-live="polite"`
region.

### `StatusMessage`
Receives `status`, `target`, and `onPlayAgain`. Renders nothing while `status === 'playing'`.
On win shows win copy; on loss shows loss copy with the revealed target word. Always
includes the "Play Again" button when `status !== 'playing'`.

## Iteration Sequencing

### Iteration 1 — Playable game (first working version)
1. Create `wordGameTargets.ts` (50 words) and `wordGameDictionary.ts` (~2–3k words,
   superset of targets)
2. Implement and unit-test `scoreGuess`, `isInDictionary`, `pickRandomTarget`
3. Build `WordGamePage` with all sub-components and CSS
4. Wire route in `App.tsx` (`case '/wordgame'`) and NavBar entry
5. Write `WordGamePage.test.tsx` covering all acceptance criteria

### Iteration 2 — Polish (deferred)
- Tile reveal animation (CSS flip transition)
- On-screen virtual keyboard with per-letter colour state
- Streak / score tracking (localStorage)

## Known Risks & Open Questions

- **Dictionary size vs. bundle size**: A full Scrabble-legal word list (~9k 5-letter words)
  is ~60 KB uncompressed. A curated ~2–3k common-words list is ~20 KB and sufficient for
  a casual game. [ASSUMPTION: curated ~2–3k list is acceptable; revisit if players hit
  false "not a word" rejections too often]
- **Duplicate-letter edge cases**: The two-pass algorithm is well-defined in the logic plan
  above, but it is the most likely source of bugs. The unit tests for `scoreGuess` must
  include at least three duplicate-letter cases.
- **Random word repeats**: `Math.random()` can produce the same word in consecutive rounds.
  Acceptable for now; a "no-repeat" shuffle can be added in a later iteration.
- **`App.test.tsx` fragility**: The existing App tests assert on `Count is: 0` which is
  homepage-specific. Adding a new route does not break these tests, but any NavBar
  assertion in future App tests should be route-aware.
