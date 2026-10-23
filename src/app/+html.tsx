import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Root HTML for the web build (static rendering only; never runs on native).
 * Tuned for iPhone Safari: the page extends under the notch and home bar
 * (screens already pad for safe areas), and "Add to Home Screen" gets the DRI
 * icon, name and colours so it opens like an app.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="DRI — book a vetted driver to drive your own car in Kigali." />
        <meta name="theme-color" content="#F6F5F0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="DRI" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Paper background behind the app (also shown during iOS overscroll), no grey
// flash when tapping on iOS, and no browser focus outline on inputs: fields
// draw their own green focus border.
const pageStyles = `
html, body { background-color: #F6F5F0; }
* { -webkit-tap-highlight-color: transparent; }
input, textarea, select { outline: none !important; }
`;
