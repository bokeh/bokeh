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

The package also exports `useBokeh`, `BokehDocument`, and `BokehRoot`. It is
versioned and released with `@bokeh/bokehjs`. See the
[BokehJS framework integration guide](https://docs.bokeh.org/en/latest/docs/user_guide/advanced/bokehjs.html)
for lifecycle, multi-root, and Next.js guidance.
