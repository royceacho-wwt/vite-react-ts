import './SpreadsheetPage.css';

import { useEffect, useState } from 'react';

import { Spreadsheet } from '@/components/Spreadsheet';

export function SpreadsheetPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <main className="spreadsheet-page">
      <header className="spreadsheet-header">
        <h1>📊 Spreadsheet</h1>
        <p>A simple spreadsheet with formulas, cell references, and keyboard navigation.</p>
      </header>
      <Spreadsheet />
    </main>
  );
}
