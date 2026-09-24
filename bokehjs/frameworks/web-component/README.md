# `@bokeh/web-component`

Framework-neutral custom elements for mounting BokehJS models with automatic
cleanup.

```sh
npm install @bokeh/bokehjs @bokeh/web-component
```

```ts
import {defineBokehElement} from "@bokeh/web-component"

const BokehPlot = defineBokehElement()
const element = new BokehPlot()
element.model = plot
document.body.append(element)
```

The package also provides shared-document and keyed-root elements. It is
versioned and released with `@bokeh/bokehjs`. See the
[BokehJS framework integration guide](https://docs.bokeh.org/en/latest/docs/user_guide/advanced/bokehjs.html)
for the lifecycle contract.
