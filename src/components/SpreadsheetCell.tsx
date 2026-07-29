import './SpreadsheetCell.css';

import { CellData } from '@/data/formulaEngine';

interface SpreadsheetCellProps {
  col: number;
  row: number;
  data: CellData;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  onCellClick: (col: number, row: number) => void;
  onCellDoubleClick: (col: number, row: number) => void;
  onCellChange: (value: string) => void;
  onCellBlur: () => void;
  onCellKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function SpreadsheetCell({
  col,
  row,
  data,
  isSelected,
  isEditing,
  editValue,
  onCellClick,
  onCellDoubleClick,
  onCellChange,
  onCellBlur,
  onCellKeyDown,
  inputRef,
}: SpreadsheetCellProps) {
  const displayValue = isEditing ? editValue : data.error || data.value || '';

  return (
    <div
      className={`spreadsheet-cell ${isSelected ? 'spreadsheet-cell--selected' : ''} ${
        isEditing ? 'spreadsheet-cell--editing' : ''
      } ${data.error ? 'spreadsheet-cell--error' : ''}`}
      onClick={() => onCellClick(col, row)}
      onDoubleClick={() => onCellDoubleClick(col, row)}
      role="gridcell"
      aria-selected={isSelected}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="spreadsheet-cell-input"
          value={editValue}
          onChange={(e) => onCellChange(e.target.value)}
          onBlur={onCellBlur}
          onKeyDown={onCellKeyDown}
        />
      ) : (
        <div className="spreadsheet-cell-content">{displayValue}</div>
      )}
    </div>
  );
}
