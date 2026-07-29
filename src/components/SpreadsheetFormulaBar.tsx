import './SpreadsheetFormulaBar.css';

interface SpreadsheetFormulaBarProps {
  cellAddress: string;
  value: string;
}

export function SpreadsheetFormulaBar({ cellAddress, value }: SpreadsheetFormulaBarProps) {
  return (
    <div className="spreadsheet-formula-bar">
      <div className="formula-bar-address">{cellAddress}</div>
      <div className="formula-bar-separator">|</div>
      <div className="formula-bar-content">{value}</div>
    </div>
  );
}
