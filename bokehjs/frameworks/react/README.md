# `@bokeh/react`

React components and hooks for mounting BokehJS models with automatic cleanup.

```sh
npm install @bokeh/bokehjs @bokeh/react react react-dom
```

```jsx
import {Bokeh} from "@bokeh/react"

export function Plot({model}) {
  return <Bokeh model={model} />
}
```

The package also exports `useBokeh`, `BokehDocument`, `BokehSession`, and `BokehRoot`. It is
versioned and released with `@bokeh/bokehjs`. See the
[BokehJS framework integration guide](https://docs.bokeh.org/en/latest/docs/user_guide/advanced/bokehjs.html)
for lifecycle, multi-root, and Next.js guidance.

## Live sessions

`BokehSession` acquires a live document and provides independent root slots:

```jsx
import {useMemo} from "react"
import {BokehRoot, BokehSession} from "@bokeh/react"

export function LivePlot({url, token}) {
  const source = useMemo(() => ({connection: {url, token}}), [url, token])
  return <BokehSession source={source} onError={console.error}>
    <aside><BokehRoot model="controls" /></aside>
    <main><BokehRoot model="plot" /></main>
    <BokehRoot model="extra" />
  </BokehSession>
}
```

The `url` is the application's WebSocket URL, including `/ws`. The enclosing
application supplies its token. `onSession` receives the acquired `ClientSession`
before rendering, and `onMounted` receives the ready `BokehMount`. `onError` reports
acquisition or rendering failures.

Acquisition automatically prepares Bokeh's built-in core, widget, and table
models. npm builds load this model registry lazily. Ordinary imports and
standalone mounts do not trigger registration. Existing custom registrations
are preserved. Load any application-specific extensions before connecting.

A string `BokehRoot.model` selects a unique document root by its model `name`.
An absent name leaves an empty slot until the server adds that root. Removal
detaches its view. Removing a slot leaves sibling views and the session intact.
Decoded model references are also accepted.

To borrow an existing session, pass a stable source such as
`useMemo(() => ({session}), [session])`. Unmounting that provider only disposes its
views. With `{connection: ...}`, the provider owns acquisition: unmounting or
changing the source also closes its connection and destroys its acquired
document. Keep the source identity stable while using the same session, and use
one provider per document with as many root slots as needed.
