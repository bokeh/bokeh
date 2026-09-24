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

The package also exports `useBokeh`, `BokehDocument`, and `BokehRoot`. It is
versioned and released with `@bokeh/bokehjs`. See the
[BokehJS framework integration guide](https://docs.bokeh.org/en/latest/docs/user_guide/advanced/bokehjs.html)
for lifecycle and multi-root guidance.
