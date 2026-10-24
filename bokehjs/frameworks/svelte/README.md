# `@bokeh/svelte`

Svelte actions for mounting BokehJS models with automatic cleanup.

```sh
npm install @bokeh/bokehjs @bokeh/svelte svelte
```

```svelte
<script>
  import {bokeh} from "@bokeh/svelte"
  export let model
</script>

<div use:bokeh={{model}}></div>
```

The package also exports `bokehDocument` and `bokehRoot` for shared multi-root
documents. It is versioned and released with `@bokeh/bokehjs`. See the
[BokehJS framework integration guide](https://docs.bokeh.org/en/latest/docs/user_guide/advanced/bokehjs.html)
for the lifecycle contract.

## Live sessions

`bokehSession` provides one live document to descendant `bokehRoot` actions.
Give it a connection URL and server-issued token to acquire a session:

```svelte
<script>
  import {bokehSession, bokehRoot} from "@bokeh/svelte"

  export let websocketUrl
  export let token
  $: source = {connection: {url: websocketUrl, token}}
</script>

<main use:bokehSession={{source}}>
  <section use:bokehRoot={{model: "plot"}}></section>
  <aside use:bokehRoot={{model: "controls"}}></aside>
</main>
```

Here `plot` and `controls` are unique root `model.name` values assigned by the
server. Keep those names stable. A named slot follows root addition, removal,
and replacement without remounting its siblings. A slot may also receive a
decoded root model. String names require a session provider. `bokehDocument`
accepts model objects.

Use `source = {session}` to borrow an already acquired `ClientSession`. Destroying
the provider releases its views and keeps the borrowed session open. With
`source = {connection: {url, token}}`, the provider owns a fresh connection and
closes it and destroys its acquired document on cleanup. Removing a root action
only detaches that view. Setting `source` to `null` releases the current session
scope while retaining root slots for a later source.

Options include `mountOptions`, `onSession`, `onMounted`, and `onError`. The
provider also dispatches `bokeh-session` with the acquired session,
`bokeh-mount`/`bokeh-unmount` with the mount, and `bokeh-mount-error` with the error.
Connection options and `mountOptions` may include an abort signal. Aborting
either disposes the provider scope with the same ownership rules. Keep source
and option objects stable unless their configuration changes.

Acquisition automatically prepares Bokeh's built-in core, widget, and table
models. npm builds load this model registry lazily. Ordinary imports and
standalone mounts do not trigger registration. Existing custom registrations
are preserved. The host supplies matching BokehJS code, custom extensions, and
token issuance. Load application-specific extensions before connecting. Use one
provider per document. Roots from the same session share that provider's mount.
