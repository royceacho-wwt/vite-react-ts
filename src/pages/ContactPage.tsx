import './ContactPage.css';

import { useState } from 'react';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send the form data to a server here
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="contact-page">
        <div className="contact-card">
          <h1 className="contact-title">📬 Thank You!</h1>
          <p className="contact-message">
            Thanks for reaching out, {formData.name}! We&apos;ll get back to you at {formData.email} soon.
          </p>
          <button
            type="button"
            className="contact-button"
            onClick={() => {
              setSubmitted(false);
              setFormData({ name: '', email: '', message: '' });
            }}
          >
            Send Another Message
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="contact-page">
      <div className="contact-card">
        <h1 className="contact-title">📬 Contact Us</h1>
        <p className="contact-message">Have a question or feedback? We&apos;d love to hear from you!</p>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              className="form-input form-textarea"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder="Your message..."
              rows={5}
            />
          </div>
          <button type="submit" className="contact-button">
            Send Message
          </button>
        </form>
      </div>
    </main>
  );
}
