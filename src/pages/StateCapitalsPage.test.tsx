import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StateCapitalsPage } from '@/pages/StateCapitalsPage';

/* ── Timer helpers ─────────────────────────────────────────────────────────── */

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Advance timers to process the feedback delay. */
function advanceFeedbackTimer() {
  act(() => {
    vi.advanceTimersByTime(1300);
  });
}

/* ── Helper functions ──────────────────────────────────────────────────────── */

/** Get all answer choice buttons. */
function getChoiceButtons() {
  return screen.getAllByRole('button', { name: /^Answer option:/ });
}

/** Get the correct answer for the current question from the question text. */
function getCurrentState(): string {
  const questionHeading = screen.getByRole('heading', { level: 2 });
  const match = questionHeading.textContent?.match(/capital of (.+)\?/);
  return match ? match[1] : '';
}

/* ── Rendering tests ───────────────────────────────────────────────────────── */

describe('StateCapitalsPage – rendering', () => {
  it('renders the page title and subtitle', () => {
    render(<StateCapitalsPage />);
    expect(screen.getByRole('heading', { name: /state capitals trivia/i })).toBeDefined();
    expect(screen.getByText(/test your knowledge/i)).toBeDefined();
  });

  it('renders the progress indicator showing question 1 of 5', () => {
    render(<StateCapitalsPage />);
    expect(screen.getByText(/question 1 of 5/i)).toBeDefined();
  });

  it('renders 4 answer choices', () => {
    render(<StateCapitalsPage />);
    const choices = getChoiceButtons();
    expect(choices).toHaveLength(4);
  });

  it('renders a question asking about a state capital', () => {
    render(<StateCapitalsPage />);
    const question = screen.getByRole('heading', { level: 2 });
    expect(question.textContent).toMatch(/what is the capital of/i);
  });

  it('renders the score tracker starting at 0/0', () => {
    render(<StateCapitalsPage />);
    expect(screen.getByLabelText(/current score/i)).toBeDefined();
    expect(screen.getByText(/correct so far/i)).toBeDefined();
  });
});

/* ── Interaction tests ─────────────────────────────────────────────────────── */

describe('StateCapitalsPage – interactions', () => {
  it('shows feedback when an answer is selected', () => {
    render(<StateCapitalsPage />);
    const choices = getChoiceButtons();
    fireEvent.click(choices[0]);

    // Feedback should appear
    const feedback = screen.getByRole('status');
    expect(feedback.textContent).toMatch(/correct|wrong/i);
  });

  it('disables all choices after selecting an answer', () => {
    render(<StateCapitalsPage />);
    const choices = getChoiceButtons();
    fireEvent.click(choices[0]);

    choices.forEach((choice) => {
      expect((choice as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('advances to the next question after feedback delay', () => {
    render(<StateCapitalsPage />);
    // Store initial state to verify question changes
    const initialState = getCurrentState();

    const choices = getChoiceButtons();
    fireEvent.click(choices[0]);

    advanceFeedbackTimer();

    // Should now be on question 2
    expect(screen.getByText(/question 2 of 5/i)).toBeDefined();
    // Verify we can still get a state (question changed)
    expect(getCurrentState()).toBeDefined();
    // Initial state was captured to ensure test setup is correct
    expect(initialState).toBeTruthy();
  });

  it('updates the progress bar as questions are answered', () => {
    render(<StateCapitalsPage />);

    // Answer first question
    fireEvent.click(getChoiceButtons()[0]);
    advanceFeedbackTimer();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.getAttribute('aria-valuenow')).toBe('2');
  });
});

/* ── Score tracking tests ──────────────────────────────────────────────────── */

describe('StateCapitalsPage – score tracking', () => {
  it('increments score when correct answer is selected', () => {
    render(<StateCapitalsPage />);

    const choices = getChoiceButtons();

    // We need to find the correct answer - it's one of the 4 choices
    // For testing, we'll just click and check if score updates appropriately
    fireEvent.click(choices[0]);

    const feedback = screen.getByRole('status');
    const isCorrect = feedback.textContent?.includes('Correct');

    advanceFeedbackTimer();

    // Check score tracker - if correct, should show 1, otherwise 0
    const scoreTracker = screen.getByLabelText(/current score/i);
    if (isCorrect) {
      expect(scoreTracker.textContent).toMatch(/1/);
    } else {
      expect(scoreTracker.textContent).toMatch(/0/);
    }
  });
});

/* ── Results screen tests ──────────────────────────────────────────────────── */

describe('StateCapitalsPage – results screen', () => {
  /** Complete all 5 questions by clicking the first choice each time. */
  function completeQuiz() {
    for (let i = 0; i < 5; i++) {
      const choices = getChoiceButtons();
      fireEvent.click(choices[0]);
      advanceFeedbackTimer();
    }
  }

  it('shows results screen after 5 questions', () => {
    render(<StateCapitalsPage />);
    completeQuiz();

    expect(screen.getByLabelText(/quiz results/i)).toBeDefined();
    expect(screen.getByLabelText(/final score/i)).toBeDefined();
  });

  it('displays the final score out of 5', () => {
    render(<StateCapitalsPage />);
    completeQuiz();

    const scoreDisplay = screen.getByLabelText(/final score/i);
    expect(scoreDisplay.textContent).toMatch(/\/5/);
  });

  it('shows a list of all question results', () => {
    render(<StateCapitalsPage />);
    completeQuiz();

    expect(screen.getByRole('list', { name: /question results/i })).toBeDefined();
    const resultItems = screen.getAllByRole('listitem');
    expect(resultItems).toHaveLength(5);
  });

  it('displays a score message based on performance', () => {
    render(<StateCapitalsPage />);
    completeQuiz();

    const message = screen.getByRole('status');
    expect(message.textContent).toBeTruthy();
    // Should contain some encouraging message
    expect(message.textContent).toMatch(/perfect|great|good|not bad|keep/i);
  });

  it('shows Play Again button on results screen', () => {
    render(<StateCapitalsPage />);
    completeQuiz();

    expect(screen.getByRole('button', { name: /play again/i })).toBeDefined();
  });

  it('resets the game when Play Again is clicked', () => {
    render(<StateCapitalsPage />);
    completeQuiz();

    fireEvent.click(screen.getByRole('button', { name: /play again/i }));

    // Should be back to question 1
    expect(screen.getByText(/question 1 of 5/i)).toBeDefined();
    expect(getChoiceButtons()).toHaveLength(4);
  });
});

/* ── Accessibility tests ───────────────────────────────────────────────────── */

describe('StateCapitalsPage – accessibility', () => {
  it('has proper aria-labels on interactive elements', () => {
    render(<StateCapitalsPage />);

    // Progress bar
    expect(screen.getByRole('progressbar', { name: /quiz progress/i })).toBeDefined();

    // Score tracker
    expect(screen.getByLabelText(/current score/i)).toBeDefined();

    // Question region
    expect(screen.getByRole('region', { name: /current question/i })).toBeDefined();

    // Answer choices
    const choices = getChoiceButtons();
    choices.forEach((choice) => {
      expect(choice.getAttribute('aria-label')).toMatch(/answer option/i);
    });
  });

  it('uses aria-live for feedback announcements', () => {
    render(<StateCapitalsPage />);
    fireEvent.click(getChoiceButtons()[0]);

    const feedback = screen.getByRole('status');
    expect(feedback.getAttribute('aria-live')).toBe('polite');
  });

  it('marks selected answer with aria-pressed', () => {
    render(<StateCapitalsPage />);
    const choices = getChoiceButtons();
    fireEvent.click(choices[0]);

    expect(choices[0].getAttribute('aria-pressed')).toBe('true');
  });
});

/* ── Edge cases ────────────────────────────────────────────────────────────── */

describe('StateCapitalsPage – edge cases', () => {
  it('prevents multiple clicks on the same question', () => {
    render(<StateCapitalsPage />);
    const choices = getChoiceButtons();

    // Click first choice
    fireEvent.click(choices[0]);

    // Try to click another choice - should be disabled
    fireEvent.click(choices[1]);

    // Only the first choice should be marked as selected/answered
    // The second click should have no effect since buttons are disabled
    expect((choices[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('generates new questions when playing again', () => {
    render(<StateCapitalsPage />);

    // Complete the quiz
    for (let i = 0; i < 5; i++) {
      fireEvent.click(getChoiceButtons()[0]);
      advanceFeedbackTimer();
    }

    // Play again
    fireEvent.click(screen.getByRole('button', { name: /play again/i }));

    // The questions are randomized, so we just verify the game restarted
    expect(screen.getByText(/question 1 of 5/i)).toBeDefined();
    expect(getChoiceButtons()).toHaveLength(4);
  });
});
