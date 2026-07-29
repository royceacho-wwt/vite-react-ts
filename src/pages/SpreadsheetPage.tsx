import './SpreadsheetPage.css';

import { useEffect, useState } from 'react';

import { Spreadsheet } from '@/components/Spreadsheet';

export function SpreadsheetPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <div className="spreadsheet-page">Loading...</div>;
  }

  return (
    <div className="spreadsheet-page">
      <h1>📊 Spreadsheet</h1>
      <Spreadsheet />
    </div>
  );
}
