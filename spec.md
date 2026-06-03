# Spec: Word Game (Wordle-style)

## Goal
Add a self-contained word-guessing game page to the app. A player tries to identify a
hidden 5-letter word within 6 attempts. After each guess, letter tiles are colored to
communicate correctness. The round ends on a correct guess or when attempts are exhausted,
and the player can immediately start a new round.

## In Scope

### Navigation
- A "🟩 Word Game" entry appears in the NavBar and navigates to `/wordgame`
- The link receives the `navbar-link--active` class and `aria-current="page"` when the
  current path is `/wordgame`

### Game Setup
- On page load (and on "Play Again"), one word is selected at random from a bundled list of
  50 five-letter target words
- The same target word is never revealed to the player anywhere in the UI before the round
  ends

### Guessing
- The player types a 5-letter string into a single text input and submits via a "Submit"
  button or the Enter key
- Submission is blocked (no attempt consumed, inline error shown) in two cases:
  1. The guess is not exactly 5 letters
  2. The guess is not a recognised English word according to the bundled dictionary
- A valid, recognised guess is always accepted regardless of whether it appears in the
  50-word target list
- Input is case-insensitive; the game normalises all input to uppercase internally

### Guess Board
- The board displays 6 rows × 5 letter tiles
- Submitted rows are filled and coloured; future rows are empty placeholders
- Each tile in a submitted row is coloured by one of three states:
  - **Correct** (🟩): letter is in the word and in the correct position
  - **Present** (🟨): letter is in the word but in the wrong position
  - **Absent** (⬜): letter is not in the word
- Duplicate-letter colouring rule: the number of 🟩/🟨 highlights for a given letter never
  exceeds the count of that letter in the target word. Exact-position matches (🟩) are
  resolved first, then remaining positions are checked for 🟨 left-to-right

### Game End
- **Win**: the guess exactly matches the target word. The board shows the correct row
  coloured all-green; a win message is displayed (e.g. "You got it! 🎉")
- **Loss**: 6 incorrect guesses have been used. A loss message is displayed that reveals
  the target word (e.g. "The word was CRANE. Better luck next time!")
- After either outcome the input and submit button are disabled
- A "Play Again" button is shown; clicking it resets the board, picks a new target word,
  and re-enables input

### No Cross-Round Persistence
- No score, streak, or history is tracked across rounds in this iteration

## Out of Scope (Deferred)
- On-screen virtual keyboard
- Streak / score tracking across rounds
- Daily fixed-word mode
- Share / copy results to clipboard
- Animations or flip transitions on tile reveal
- Hard mode (forcing the player to reuse revealed hints)
- Expanding the target word list beyond 50 words

## Prior Decisions
- The 50-word target list and the broader dictionary are both bundled with the app as static
  data files; no external API is called at runtime
- The broader dictionary used for validation is a bundled list of common 5-letter English
  words; it must be a superset of the 50-word target list

## Acceptance Criteria

### Navigation
- [ ] Navigating to `/wordgame` renders the Word Game page
- [ ] The NavBar "🟩 Word Game" link is present and navigates to `/wordgame`
- [ ] The NavBar link has `aria-current="page"` only when the current path is `/wordgame`

### Game Setup
- [ ] A fresh target word is selected each time the page first renders
- [ ] A fresh target word is selected each time "Play Again" is clicked
- [ ] The target word is not visible in the DOM before the round ends

### Guessing – validation
- [ ] Submitting a string shorter or longer than 5 letters shows an inline error and does
  not fill a row
- [ ] Submitting a 5-letter string that is not in the dictionary shows an inline error and
  does not fill a row
- [ ] Submitting a valid word clears any existing inline error and fills the next row
- [ ] Submission is triggered by both clicking "Submit" and pressing Enter

### Guessing – colouring
- [ ] A letter in the correct position is coloured Correct (🟩 / green)
- [ ] A letter in the word but wrong position is coloured Present (🟨 / yellow)
- [ ] A letter not in the word is coloured Absent (⬜ / grey)
- [ ] For a guess with a repeated letter where the target has only one of that letter, at
  most one tile for that letter is highlighted 🟩 or 🟨 (the exact-match tile takes
  priority; remaining duplicates are coloured Absent)

### Game End – win
- [ ] Guessing the target word correctly displays a win message
- [ ] The input and submit button are disabled after a win
- [ ] "Play Again" is visible after a win and starts a new round when clicked

### Game End – loss
- [ ] Exhausting all 6 attempts without a correct guess displays a loss message containing
  the target word
- [ ] The input and submit button are disabled after a loss
- [ ] "Play Again" is visible after a loss and starts a new round when clicked

### Accessibility
- [ ] The guess board region has an appropriate `aria-label`
- [ ] Each tile has an `aria-label` describing its letter and colour state once revealed
- [ ] The status/message area has `role="status"` and `aria-live="polite"`
- [ ] The text input has an associated `<label>` or `aria-label`
- [ ] Error messages are surfaced in an `aria-live` region
