'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Global error boundary.
 *
 * Next.js hides the details of server-side errors in production.
 * This renders the message + digest on screen so a failure can be
 * reported without opening the browser console.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          color: '#fafafa',
        }}
      >
        <div style={{ maxWidth: 560, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#a1a1aa', marginBottom: 8 }}>
            <strong>Message:</strong> {error.message || '(empty)'}
          </p>
          <p
            style={{
              color: '#a1a1aa',
              marginBottom: 20,
              overflowWrap: 'anywhere',
            }}
          >
            <strong>Digest:</strong> {error.digest ?? '(none)'}
          </p>
          <Button onClick={() => reset()} variant="secondary">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
