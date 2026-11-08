# `@bokeh/framework`

Shared lifecycle support for Bokeh's official framework adapters. Applications
normally install the adapter for their framework instead of using this package
directly.

This package is versioned and released with `@bokeh/bokehjs`. See the
[BokehJS framework integration guide](https://docs.bokeh.org/en/latest/docs/user_guide/advanced/bokehjs.html)
for the public adapters and lifecycle contract.

## Live sessions

`SessionMountController` implements the same live-session lifecycle for all
packaged adapters and for imperative integrations such as Angular:

```ts
import {SessionMountController} from "@bokeh/framework"

const controller = new SessionMountController()
const detach = controller.attach("plot", host)
controller.update({connection: {url, token}}, {
  onSession: (session) => console.log("document acquired", session.document),
  onMounted: (mounted) => console.log("initial slots rendered", mounted),
  onError: reportError,
})

// Selective UI cleanup:
detach()
// Provider/component cleanup:
controller.dispose()
```

Acquisition automatically prepares Bokeh's built-in core, widget, and table
models. The npm implementation imports this registry lazily on first connection.
Ordinary package imports and standalone mounts do not trigger this preparation.
Loading is shared between concurrent acquisitions, and existing custom
registrations are preserved. Load application-specific extensions before
connecting.

`{session}` borrows an existing `ClientSession`, retaining its connection and
document on cleanup.
`{connection: {url, token, args_string?, signal?}}` acquires a fresh connection.
The controller disposes its views, closes that connection, and destroys its
exclusively acquired document on replacement, failure, abort, or disposal.
`mountOptions.signal` also cancels the provider scope. Cancellation does not
invoke `onError`, but connection, target, or rendering failures do.

Advanced hosts that manage their own model registry can set
`connection.register_builtin_models` to `false`. They must register every model
their server document needs before acquisition. The ordinary connection path
requires no registration calls.

Root references can be decoded models or unique, stable root model names.
Missing named roots leave empty slots. Root additions, removals, and replacements
are reconciled without rebuilding unaffected views. Renaming a root in place
is not tracked. Ambiguous names and duplicate slots are errors. Root slots own
attachment only and do not close sessions. `update(null)` releases the current
source while retaining slots. Final `dispose()` also forgets slots.

Keep source/options objects stable unless their configuration changes. Source
or mount-option changes replace the provider scope. `onSession` reports initial
acquisition, and `onMounted` reports the initial registered slots. Neither promises
ongoing connectivity or readiness of arbitrary later roots. Use one provider
per document. Custom extension resources, token issuance, and
reconnect/token-refresh policy remain the host's responsibility.
