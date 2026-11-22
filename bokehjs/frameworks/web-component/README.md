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

## Live sessions

Register a session provider and root elements to place live roots independently:

```ts
import {defineBokehSessionElement, defineBokehRootElement} from "@bokeh/web-component"

const BokehSession = defineBokehSessionElement()
const BokehRoot = defineBokehRootElement()
const provider = new BokehSession()
provider.source = {connection: {url: websocketUrl, token}}

const plot = new BokehRoot()
plot.model = "plot"
const controls = new BokehRoot()
controls.model = "controls"
provider.append(plot, controls)
document.body.append(provider)
```

The default element names are `bokeh-session` and `bokeh-root`. Set `source` and
`model` as JavaScript properties. Root strings refer to unique root `model.name`
values assigned by the server. Named slots follow root additions, removals, and
replacements while preserving sibling views. Slots may also receive decoded
root models. The static `BokehDocumentElement` requires model objects.
Keep root names stable while a session is active.

Use `provider.source = {session}` to borrow a `ClientSession`. Disconnecting the
provider removes its views and keeps the borrowed session open. A
`{connection: {url, token}}` source acquires a fresh connection that the provider
closes on cleanup, then destroys its acquired document. Removing one root
element only detaches that view. Assigning `null` to `source` releases the
current session scope and retains connected root slots for a later source.

Descendant roots find their nearest document or session provider, including
through a shadow root. For a root elsewhere in the page, assign
`root.bokehDocument = provider` explicitly. One provider owns the mount for all
roots of its document.

Set `provider.mountOptions` for mount options. The provider dispatches
`bokeh-session` with a `ClientSession` in `event.detail`, `bokeh-mount` and
`bokeh-unmount` with the `BokehMount`, and `bokeh-mount-error` with the error.
Connection options and `mountOptions` accept abort signals. Aborting either
disposes the provider scope with the same ownership rules. Keep source and
option objects stable unless their configuration changes.

Acquisition automatically prepares Bokeh's built-in core, widget, and table
models. npm builds load this model registry lazily. Ordinary imports and
standalone mounts do not trigger registration. Existing custom registrations
are preserved. The host supplies matching BokehJS code, custom extensions, and
server-issued tokens. Load application-specific extensions before connecting.
The provider does not discover server resources or issue tokens.
