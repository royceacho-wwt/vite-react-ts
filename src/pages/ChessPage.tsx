import './ChessPage.css';

import { useChess, isWhite } from '@/hooks/useChess';
import type { Square, PieceCode } from '@/hooks/useChess';

// ─── Piece Unicode glyphs ─────────────────────────────────────────────────────

const GLYPHS: Record<PieceCode, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

// ─── Square component ─────────────────────────────────────────────────────────

interface SquareProps {
  index: number;
  piece: Square;
  isLight: boolean;
  isSelected: boolean;
  isLegalTarget: boolean;
  isLastMoveFrom: boolean;
  isLastMoveTo: boolean;
  isCheckKing: boolean;
  onClick: () => void;
}

function BoardSquare({
  index, piece, isLight, isSelected, isLegalTarget,
  isLastMoveFrom, isLastMoveTo, isCheckKing, onClick,
}: SquareProps) {
  const classes = [
    'chess-sq',
    isLight ? 'chess-sq--light' : 'chess-sq--dark',
    isSelected      ? 'chess-sq--selected'   : '',
    isLegalTarget   ? 'chess-sq--legal'       : '',
    isLastMoveFrom  ? 'chess-sq--last-from'   : '',
    isLastMoveTo    ? 'chess-sq--last-to'     : '',
    isCheckKing     ? 'chess-sq--check'       : '',
  ].filter(Boolean).join(' ');

  const fileLabel = index % 8 === 0 ? String(8 - Math.floor(index / 8)) : null;
  const rankLabel = index >= 56     ? 'abcdefgh'[index % 8]              : null;

  return (
    <button
      className={classes}
      onClick={onClick}
      aria-label={`${'abcdefgh'[index % 8]}${8 - Math.floor(index / 8)}${piece ? ` ${piece}` : ''}`}
    >
      {fileLabel && <span className="chess-coord chess-coord--file">{fileLabel}</span>}
      {rankLabel && <span className="chess-coord chess-coord--rank">{rankLabel}</span>}
      {piece && (
        <span className={`chess-piece${isWhite(piece) ? ' chess-piece--white' : ' chess-piece--black'}`}>
          {GLYPHS[piece]}
        </span>
      )}
      {isLegalTarget && !piece && <span className="chess-dot" aria-hidden="true" />}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ChessPage() {
  const { state, selectSquare, newGame, resetScores } = useChess();
  const { board, selected, legalMoves, lastMove, status, scores, cpuThinking, turn } = state;

  const legalTargets = new Set(legalMoves.map(m => m.to));

  // Find king indices for check highlight
  const whiteKingIdx = board.indexOf('K');
  const blackKingIdx = board.indexOf('k');

  const statusMessage = (() => {
    if (status === 'checkmate') {
      return turn === 'w' ? 'Checkmate — CPU wins! 🤖' : 'Checkmate — You win! 🎉';
    }
    if (status === 'stalemate') return 'Stalemate — Draw! 🤝';
    if (cpuThinking) return 'CPU is thinking… 🤔';
    if (status === 'check') return turn === 'w' ? 'You are in check! ⚠️' : 'CPU is in check! ⚠️';
    return turn === 'w' ? "Your turn (White)" : "CPU's turn (Black)";
  })();

  const gameOver = status === 'checkmate' || status === 'stalemate';

  return (
    <main className="chess-page">
      <h1 className="chess-title">♟ Chess</h1>
      <p className="chess-subtitle">You play White. CPU plays Black.</p>

      {/* Scoreboard */}
      <div className="chess-scoreboard" aria-label="Scoreboard">
        <div className="chess-score chess-score--white">
          <span className="chess-score-label">You (White)</span>
          <span className="chess-score-value">{scores.w}</span>
        </div>
        <div className="chess-score chess-score--draws">
          <span className="chess-score-label">Draws</span>
          <span className="chess-score-value">0</span>
        </div>
        <div className="chess-score chess-score--black">
          <span className="chess-score-label">CPU (Black)</span>
          <span className="chess-score-value">{scores.b}</span>
        </div>
      </div>

      {/* Status */}
      <div
        className={`chess-status${gameOver ? ' chess-status--gameover' : ''}`}
        role="status"
        aria-live="polite"
      >
        {statusMessage}
      </div>

      {/* Board */}
      <div className="chess-board" role="grid" aria-label="Chess board">
        {board.map((piece, i) => {
          const r = Math.floor(i / 8);
          const f = i % 8;
          const isLight = (r + f) % 2 === 0;
          const isCheckKing =
            (status === 'check' && turn === 'w' && i === whiteKingIdx) ||
            (status === 'check' && turn === 'b' && i === blackKingIdx);
          return (
            <BoardSquare
              key={i}
              index={i}
              piece={piece}
              isLight={isLight}
              isSelected={selected === i}
              isLegalTarget={legalTargets.has(i)}
              isLastMoveFrom={lastMove?.from === i}
              isLastMoveTo={lastMove?.to === i}
              isCheckKing={isCheckKing}
              onClick={() => selectSquare(i)}
            />
          );
        })}
      </div>

      {/* Actions */}
      <div className="chess-actions">
        <button className="chess-btn chess-btn--primary" onClick={newGame}>
          🔄 New Game
        </button>
        <button className="chess-btn chess-btn--secondary" onClick={resetScores}>
          🗑️ Reset Scores
        </button>
      </div>
    </main>
  );
}

