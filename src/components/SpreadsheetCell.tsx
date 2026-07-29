import './SpreadsheetCell.css';

import { useEffect, useRef, useState } from 'react';

import { CellData } from '@/components/Spreadsheet';

interface SpreadsheetCellProps {
  address: string;
  data?: CellData;
  isSelected: boolean;
  onChange: (address: string, value: string) => void;
  onSelect: () => void;
}

export function SpreadsheetCell({ address, data, isSelected, onChange, onSelect }: SpreadsheetCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    onSelect();
    if (isSelected && !isEditing) {
      setEditValue(data?.value || '');
      setIsEditing(true);
    }
  };

  const handleDoubleClick = () => {
    onSelect();
    setEditValue(data?.value || '');
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange(address, editValue);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onChange(address, editValue);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    onChange(address, editValue);
    setIsEditing(false);
  };

  const handleFocus = () => {
    setEditValue(data?.value || '');
  };

  const displayValue = data?.computed ?? '';

  return (
    <div
      className={`spreadsheet-cell ${isSelected ? 'spreadsheet-cell--selected' : ''} ${isEditing ? 'spreadsheet-cell--editing' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="spreadsheet-cell-input"
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
      ) : (
        <div className="spreadsheet-cell-display">{displayValue}</div>
      )}
    </div>
  );
}
