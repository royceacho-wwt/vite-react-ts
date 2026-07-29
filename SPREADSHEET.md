# Spreadsheet Application

A fully-featured spreadsheet application built with React and TypeScript. This single-page application provides a grid-based spreadsheet with formula support, cell references, and automatic recalculation.

## Features

### Grid Interface
- **20x10 resizable grid** of cells with column headers (A-J) and row numbers (1-20)
- **Sticky headers** for easy navigation
- **Click-to-edit** cells with double-click support
- **Keyboard navigation** with arrow keys, Tab, and Shift+Tab

### Formula Support
The spreadsheet supports formulas starting with `=` and includes:

#### Cell References
- **Single cell**: `=A1` references the value in cell A1
- **Ranges**: `=A1:B3` references all cells from A1 to B3

#### Arithmetic Operations
- Addition: `=A1+B1`
- Subtraction: `=A1-B1`
- Multiplication: `=A1*B1`
- Division: `=A1/B1`
- Parentheses: `=(A1+B1)*C1`

#### Built-in Functions
- **SUM**: `=SUM(A1:B3)` - Sum all values in range
- **AVERAGE**: `=AVERAGE(A1:B3)` - Calculate average of range
- **MIN**: `=MIN(A1:B3)` - Find minimum value in range
- **MAX**: `=MAX(A1:B3)` - Find maximum value in range
- **COUNT**: `=COUNT(A1:B3)` - Count number of cells in range

### Error Handling
- **#CIRC!** - Displayed when a circular reference is detected (e.g., A1 references B1 which references A1)
- **#ERR!** - Displayed when a formula has invalid syntax or calculation error

### Display Modes
- **Formula Bar**: Shows the raw formula or literal value of the selected cell
- **Cell Display**: Shows the computed value when cell is not in edit mode
- **Edit Mode**: Shows the raw formula/value when cell is being edited

### Data Persistence
- All spreadsheet data is automatically saved to browser's localStorage
- Data persists across browser sessions
- Stored under the key `spreadsheet_data`

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Arrow Up | Move to cell above |
| Arrow Down | Move to cell below |
| Arrow Left | Move to cell to the left |
| Arrow Right | Move to cell to the right |
| Tab | Move to next cell (right) |
| Shift+Tab | Move to previous cell (left) |
| Enter | Confirm edit and move down |
| Escape | Cancel edit |

### Mouse Interaction
- **Click**: Select a cell
- **Double-click**: Enter edit mode
- **Click on selected cell**: Enter edit mode

## Usage Examples

### Basic Arithmetic
```
A1: 10
B1: 20
C1: =A1+B1  → displays 30
```

### Using Functions
```
A1: 5
A2: 10
A3: 15
A4: =SUM(A1:A3)  → displays 30
A5: =AVERAGE(A1:A3)  → displays 10
A6: =MAX(A1:A3)  → displays 15
A7: =MIN(A1:A3)  → displays 5
A8: =COUNT(A1:A3)  → displays 3
```

### Complex Formulas
```
A1: 100
B1: 0.1
C1: =A1*B1  → displays 10

D1: 50
E1: =SUM(A1:D1)  → displays 160

F1: =(A1+D1)/2  → displays 75
```

### Circular Reference Detection
```
A1: =B1
B1: =A1
Result: Both cells display #CIRC!
```

## Technical Implementation

### Components
- **Spreadsheet**: Main component managing grid state and formula evaluation
- **SpreadsheetCell**: Individual cell component with edit mode
- **SpreadsheetFormulaBar**: Display bar showing current cell address and formula

### Hooks
- **useSpreadsheetData**: Custom hook for localStorage persistence

### Formula Evaluation
- Formulas are parsed and evaluated using a safe evaluation approach
- Cell references are resolved recursively
- Circular references are detected using a recursion stack
- All calculations are performed in correct dependency order

### Data Structure
```typescript
interface CellData {
  value: string;           // raw formula or literal
  computed: string | number; // computed result
}

interface SpreadsheetData {
  [key: string]: CellData; // e.g., "A1", "B2", etc.
}
```

## Browser Compatibility
- Works in all modern browsers supporting ES6 and localStorage
- Tested on Chrome, Firefox, Safari, and Edge

## Performance
- Efficient recalculation only when cells change
- Circular reference detection prevents infinite loops
- Sticky headers for smooth scrolling
- Optimized rendering with React

## Future Enhancements
- Multi-column support (beyond J)
- More rows (beyond 20)
- Copy/paste functionality
- Undo/redo support
- Cell formatting (colors, fonts)
- More functions (IF, CONCATENATE, etc.)
- Export to CSV
- Import from CSV
