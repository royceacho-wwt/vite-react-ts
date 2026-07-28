/**
 * US State Capitals data for the trivia game.
 * Each entry contains the state name and its capital city.
 */

export interface StateCapital {
  state: string;
  capital: string;
}

export const STATE_CAPITALS: StateCapital[] = [
  { state: 'Alabama', capital: 'Montgomery' },
  { state: 'Alaska', capital: 'Juneau' },
  { state: 'Arizona', capital: 'Phoenix' },
  { state: 'Arkansas', capital: 'Little Rock' },
  { state: 'California', capital: 'Sacramento' },
  { state: 'Colorado', capital: 'Denver' },
  { state: 'Connecticut', capital: 'Hartford' },
  { state: 'Delaware', capital: 'Dover' },
  { state: 'Florida', capital: 'Tallahassee' },
  { state: 'Georgia', capital: 'Atlanta' },
  { state: 'Hawaii', capital: 'Honolulu' },
  { state: 'Idaho', capital: 'Boise' },
  { state: 'Illinois', capital: 'Springfield' },
  { state: 'Indiana', capital: 'Indianapolis' },
  { state: 'Iowa', capital: 'Des Moines' },
  { state: 'Kansas', capital: 'Topeka' },
  { state: 'Kentucky', capital: 'Frankfort' },
  { state: 'Louisiana', capital: 'Baton Rouge' },
  { state: 'Maine', capital: 'Augusta' },
  { state: 'Maryland', capital: 'Annapolis' },
  { state: 'Massachusetts', capital: 'Boston' },
  { state: 'Michigan', capital: 'Lansing' },
  { state: 'Minnesota', capital: 'Saint Paul' },
  { state: 'Mississippi', capital: 'Jackson' },
  { state: 'Missouri', capital: 'Jefferson City' },
  { state: 'Montana', capital: 'Helena' },
  { state: 'Nebraska', capital: 'Lincoln' },
  { state: 'Nevada', capital: 'Carson City' },
  { state: 'New Hampshire', capital: 'Concord' },
  { state: 'New Jersey', capital: 'Trenton' },
  { state: 'New Mexico', capital: 'Santa Fe' },
  { state: 'New York', capital: 'Albany' },
  { state: 'North Carolina', capital: 'Raleigh' },
  { state: 'North Dakota', capital: 'Bismarck' },
  { state: 'Ohio', capital: 'Columbus' },
  { state: 'Oklahoma', capital: 'Oklahoma City' },
  { state: 'Oregon', capital: 'Salem' },
  { state: 'Pennsylvania', capital: 'Harrisburg' },
  { state: 'Rhode Island', capital: 'Providence' },
  { state: 'South Carolina', capital: 'Columbia' },
  { state: 'South Dakota', capital: 'Pierre' },
  { state: 'Tennessee', capital: 'Nashville' },
  { state: 'Texas', capital: 'Austin' },
  { state: 'Utah', capital: 'Salt Lake City' },
  { state: 'Vermont', capital: 'Montpelier' },
  { state: 'Virginia', capital: 'Richmond' },
  { state: 'Washington', capital: 'Olympia' },
  { state: 'West Virginia', capital: 'Charleston' },
  { state: 'Wisconsin', capital: 'Madison' },
  { state: 'Wyoming', capital: 'Cheyenne' },
];

/**
 * Shuffles an array using Fisher-Yates algorithm.
 * Returns a new array without mutating the original.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generates wrong answer choices for a given correct capital.
 * Returns an array of 3 wrong capitals that are different from the correct one.
 */
export function generateWrongAnswers(correctCapital: string, count = 3): string[] {
  const allCapitals = STATE_CAPITALS.map((sc) => sc.capital).filter((c) => c !== correctCapital);
  return shuffleArray(allCapitals).slice(0, count);
}
