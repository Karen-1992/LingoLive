<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2a7bbab1-009d-456f-a4b5-92b2af1ce82a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in `.env` to your Gemini API key
3. Run the app:
   `npm run dev`

## ⚠️ Security note

Vite only exposes env vars prefixed with `VITE_` — but that also means they're bundled
straight into the client-side JS. Anyone can open DevTools → Network/Sources and read
`VITE_GEMINI_API_KEY` in plain text.

This is fine for local development, but **before deploying publicly**, the proper fix is
to move Gemini calls to a server:

- Add a backend (e.g. a Vercel API route under `/api`) that holds the key as a
  server-only env var (no `VITE_` prefix) and proxies requests to Gemini.
- The client calls your own `/api/...` endpoint instead of Google's API directly.
- This works cleanly for regular REST calls (like translation via `generateContent`).
  The Gemini Live API uses a persistent WebSocket, which can't be proxied through a
  serverless function — that needs a small always-on server (e.g. Render/Railway) if a
  fully hidden key is required.

As a lighter interim step, restrict the key in Google Cloud Console
(APIs & Services → Credentials → your key → "Application restrictions" → HTTP referrers)
to your deployed domain only.
