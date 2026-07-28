import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContactPage } from '@/pages/ContactPage';

describe('ContactPage', () => {
  it('renders the Contact heading', () => {
    render(<ContactPage />);
    expect(screen.getByRole('heading', { name: /contact us/i })).toBeDefined();
  });

  it('renders the contact form with all fields', () => {
    render(<ContactPage />);
    expect(screen.getByLabelText(/name/i)).toBeDefined();
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/message/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDefined();
  });

  it('allows user to fill in the form', () => {
    render(<ContactPage />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(/message/i) as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'Hello, this is a test message.' } });

    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(messageInput.value).toBe('Hello, this is a test message.');
  });

  it('shows thank you message after form submission', () => {
    render(<ContactPage />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    const submitButton = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'Hello!' } });
    fireEvent.click(submitButton);

    expect(screen.getByRole('heading', { name: /thank you/i })).toBeDefined();
    expect(screen.getByText(/john doe/i)).toBeDefined();
    expect(screen.getByText(/john@example.com/i)).toBeDefined();
  });

  it('allows sending another message after submission', () => {
    render(<ContactPage />);

    // Submit the form
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    // Click "Send Another Message"
    fireEvent.click(screen.getByRole('button', { name: /send another message/i }));

    // Form should be visible again with empty fields
    expect(screen.getByRole('heading', { name: /contact us/i })).toBeDefined();
    expect((screen.getByLabelText(/name/i) as HTMLInputElement).value).toBe('');
  });
});
