# `@bokeh/vue`

Vue components and composables for mounting BokehJS models with automatic
cleanup.

```sh
npm install @bokeh/bokehjs @bokeh/vue vue
```

```vue
<script setup>
import {Bokeh} from "@bokeh/vue"
defineProps(["model"])
</script>

<template>
  <Bokeh :model="model" />
</template>
```

The package also exports `useBokeh`, `BokehDocument`, `BokehSession`, and `BokehRoot`. It is
versioned and released with `@bokeh/bokehjs`. See the
[BokehJS framework integration guide](https://docs.bokeh.org/en/latest/docs/user_guide/advanced/bokehjs.html)
for lifecycle and multi-root guidance.

## Live sessions

`BokehSession` acquires a live document and provides independent root slots:

```vue
<script setup>
import {computed} from "vue"
import {BokehRoot, BokehSession} from "@bokeh/vue"

const props = defineProps(["url", "token"])
const source = computed(() => ({connection: {url: props.url, token: props.token}}))
</script>

<template>
  <BokehSession :source="source" @mount-error="console.error">
    <aside><BokehRoot model="controls" /></aside>
    <main><BokehRoot model="plot" /></main>
    <BokehRoot model="extra" />
  </BokehSession>
</template>
```

The application supplies the full WebSocket `url` (including `/ws`) and token.
The `session` event provides the decoded `ClientSession`, and `mounted` provides the
ready `BokehMount`. Acquisition and rendering failures emit `mount-error`.

Acquisition automatically prepares Bokeh's built-in core, widget, and table
models. npm builds load this model registry lazily. Ordinary imports and
standalone mounts do not trigger registration. Existing custom registrations
are preserved. Load any application-specific extensions before connecting.

String root references select a unique document root by model `name`. An absent
root leaves an empty slot until it appears, and server removal detaches its view.
Removing a slot preserves sibling views and the connection. Decoded model
references also work.

To borrow an existing session, use a stable shallow source such as
`shallowRef({session})`. Avoid making Bokeh instances deeply reactive. Removing
the provider then disposes only its views. With `{connection: ...}`, the provider
owns acquisition and also closes its connection and destroys its acquired
document on removal or source replacement. Keep the source stable and use one
provider per document with as many root slots as needed.
