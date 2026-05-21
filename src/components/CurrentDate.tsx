import './CurrentDate.css';

export function CurrentDate() {
  const today = new Date();
  const formatted = today.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="CurrentDate" aria-label="current date">
      {formatted}
    </div>
  );
}
