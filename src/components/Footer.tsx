import './Footer.css';

import { version } from '../../package.json';

export function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <span className="footer-version">v{version}</span>
    </footer>
  );
}
