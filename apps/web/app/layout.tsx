import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRM Canvas',
  description: 'Klaviyo email audit board generator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="masthead">
          <span className="wordmark">CRM Canvas</span>
          <nav>
            <a href="/">New audit</a>
            <a href="/audits">Audits</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
