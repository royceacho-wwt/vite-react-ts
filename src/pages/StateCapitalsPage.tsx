import './StateCapitalsPage.css';

import { useCallback, useMemo, useState } from 'react';

import { generateWrongAnswers, shuffleArray, STATE_CAPITALS, StateCapital } from '@/data/stateCapitals';

/* ── Constants ─────────────────────────────────────────────────────────────── */

const TOTAL_QUESTIONS = 5;

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface QuestionResult {
  state: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
}

type GamePhase = 'playing' | 'results';

/* ── Helper functions ──────────────────────────────────────────────────────── */

/**
 * Generates a set of questions for the trivia game.
 * Each question has 4 answer choices (1 correct, 3 wrong).
 */
function generateQuestions(count: number): Array<{
  stateCapital: StateCapital;
  choices: string[];
}> {
  const shuffledStates = shuffleArray(STATE_CAPITALS).slice(0, count);
  return shuffledStates.map((sc) => {
    const wrongAnswers = generateWrongAnswers(sc.capital, 3);
    const choices = shuffleArray([sc.capital, ...wrongAnswers]);
    return { stateCapital: sc, choices };
  });
}

/* ── Page component ────────────────────────────────────────────────────────── */

export function StateCapitalsPage() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('playing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Generate questions once when the game starts
  const [questions, setQuestions] = useState(() => generateQuestions(TOTAL_QUESTIONS));

  const currentQuestion = questions[currentQuestionIndex];
  const correctCount = results.filter((r) => r.isCorrect).length;

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (showFeedback) return;

      setSelectedAnswer(answer);
      setShowFeedback(true);

      const isCorrect = answer === currentQuestion.stateCapital.capital;
      const result: QuestionResult = {
        state: currentQuestion.stateCapital.state,
        correctAnswer: currentQuestion.stateCapital.capital,
        userAnswer: answer,
        isCorrect,
      };

      // After a brief delay, move to next question or show results
      setTimeout(() => {
        const newResults = [...results, result];
        setResults(newResults);

        if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setShowFeedback(false);
        } else {
          setGamePhase('results');
        }
      }, 1200);
    },
    [currentQuestion, currentQuestionIndex, results, showFeedback]
  );

  const handlePlayAgain = useCallback(() => {
    setQuestions(generateQuestions(TOTAL_QUESTIONS));
    setCurrentQuestionIndex(0);
    setResults([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setGamePhase('playing');
  }, []);

  const scoreMessage = useMemo(() => {
    const score = results.filter((r) => r.isCorrect).length;
    if (score === TOTAL_QUESTIONS) return "Perfect! You're a geography expert! 🏆";
    if (score >= TOTAL_QUESTIONS * 0.8) return 'Great job! Almost perfect! 🌟';
    if (score >= TOTAL_QUESTIONS * 0.6) return 'Good effort! Keep learning! 📚';
    if (score >= TOTAL_QUESTIONS * 0.4) return 'Not bad! Room for improvement! 💪';
    return "Keep practicing! You'll get better! 🎯";
  }, [results]);

  /* ── Results screen ──────────────────────────────────────────────────────── */

  if (gamePhase === 'results') {
    const finalScore = results.filter((r) => r.isCorrect).length;

    return (
      <main className="capitals-page">
        <h1 className="capitals-title">🏛️ State Capitals Trivia</h1>

        <div className="capitals-results" role="region" aria-label="Quiz results">
          <div className="capitals-score-display">
            <span className="capitals-score-number" aria-label="Final score">
              {finalScore}/{TOTAL_QUESTIONS}
            </span>
            <span className="capitals-score-label">Correct</span>
          </div>

          <p className="capitals-score-message" role="status" aria-live="polite">
            {scoreMessage}
          </p>

          <div className="capitals-results-list" role="list" aria-label="Question results">
            {results.map((result, index) => (
              <div
                key={index}
                className={`capitals-result-item ${
                  result.isCorrect ? 'capitals-result-item--correct' : 'capitals-result-item--wrong'
                }`}
                role="listitem"
              >
                <span className="capitals-result-icon" aria-hidden="true">
                  {result.isCorrect ? '✓' : '✗'}
                </span>
                <div className="capitals-result-details">
                  <span className="capitals-result-state">{result.state}</span>
                  {result.isCorrect ? (
                    <span className="capitals-result-answer">{result.correctAnswer}</span>
                  ) : (
                    <span className="capitals-result-answer">
                      Your answer: {result.userAnswer} → Correct: {result.correctAnswer}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="capitals-btn capitals-btn--primary" onClick={handlePlayAgain} aria-label="Play again">
            🔄 Play Again
          </button>
        </div>
      </main>
    );
  }

  /* ── Question screen ─────────────────────────────────────────────────────── */

  return (
    <main className="capitals-page">
      <h1 className="capitals-title">🏛️ State Capitals Trivia</h1>
      <p className="capitals-subtitle">Test your knowledge of US state capitals!</p>

      {/* Progress indicator */}
      <div
        className="capitals-progress"
        role="progressbar"
        aria-valuenow={currentQuestionIndex + 1}
        aria-valuemin={1}
        aria-valuemax={TOTAL_QUESTIONS}
        aria-label="Quiz progress"
      >
        <div className="capitals-progress-bar">
          <div
            className="capitals-progress-fill"
            style={{ width: `${((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>
        <span className="capitals-progress-text">
          Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}
        </span>
      </div>

      {/* Score tracker */}
      <div className="capitals-score-tracker" aria-label="Current score">
        <span className="capitals-score-current">{correctCount}</span>
        <span className="capitals-score-separator">/</span>
        <span className="capitals-score-total">{currentQuestionIndex}</span>
        <span className="capitals-score-text">correct so far</span>
      </div>

      {/* Question card */}
      <div className="capitals-question-card" role="region" aria-label="Current question">
        <h2 className="capitals-question" id="current-question">
          What is the capital of <strong>{currentQuestion.stateCapital.state}</strong>?
        </h2>

        <div className="capitals-choices" role="group" aria-labelledby="current-question">
          {currentQuestion.choices.map((choice, index) => {
            const isSelected = selectedAnswer === choice;
            const isCorrect = choice === currentQuestion.stateCapital.capital;
            const showCorrect = showFeedback && isCorrect;
            const showWrong = showFeedback && isSelected && !isCorrect;

            let buttonClass = 'capitals-choice';
            if (showCorrect) buttonClass += ' capitals-choice--correct';
            if (showWrong) buttonClass += ' capitals-choice--wrong';
            if (isSelected && !showFeedback) buttonClass += ' capitals-choice--selected';

            return (
              <button
                key={index}
                className={buttonClass}
                onClick={() => handleAnswerSelect(choice)}
                disabled={showFeedback}
                aria-label={`Answer option: ${choice}`}
                aria-pressed={isSelected}
              >
                <span className="capitals-choice-letter" aria-hidden="true">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="capitals-choice-text">{choice}</span>
                {showCorrect && (
                  <span className="capitals-choice-icon" aria-hidden="true">
                    ✓
                  </span>
                )}
                {showWrong && (
                  <span className="capitals-choice-icon" aria-hidden="true">
                    ✗
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div
            className={`capitals-feedback ${
              selectedAnswer === currentQuestion.stateCapital.capital
                ? 'capitals-feedback--correct'
                : 'capitals-feedback--wrong'
            }`}
            role="status"
            aria-live="polite"
          >
            {selectedAnswer === currentQuestion.stateCapital.capital
              ? 'Correct! 🎉'
              : `Wrong! The capital is ${currentQuestion.stateCapital.capital}`}
          </div>
        )}
      </div>
    </main>
  );
}
