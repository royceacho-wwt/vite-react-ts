import { useEffect, useState } from 'react';

import { SpreadsheetData } from '@/components/Spreadsheet';

const STORAGE_KEY = 'spreadsheet_data';

export function useSpreadsheetData(): [SpreadsheetData, (data: SpreadsheetData) => void] {
  const [data, setDataState] = useState<SpreadsheetData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load spreadsheet data from localStorage:', error);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save spreadsheet data to localStorage:', error);
    }
  }, [data]);

  return [data, setDataState];
}
