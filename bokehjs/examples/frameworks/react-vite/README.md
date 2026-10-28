# React examples

- [`index.html`](index.html) uses the `@bokeh/react` adapter to embed a standalone
  plot. See [`src/App.tsx`](src/App.tsx) and the [framework examples guide](../README.md).
- [`live.html`](live.html) borrows one live server document and independently
  places its roots. See the [live session guide](README-live.md) for ASGI and
  Tornado setup and usage.
- [`server.html`](server.html) uses `server_document(app_url, target)` to embed
  the whole application without a framework. It uses the same backend and
  [setup commands](README-live.md).
