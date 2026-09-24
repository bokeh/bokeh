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
