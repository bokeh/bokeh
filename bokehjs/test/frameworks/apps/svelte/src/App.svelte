<script lang="ts">
  import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
  import type {BokehModel} from "@bokeh/framework"
  import {bokeh} from "@bokeh/svelte"

  export let model: BokehModel
  export let mountOptions: MountOptions | undefined = undefined
  export let onMounted: (mounted: BokehMount) => void
  export let onError: (error: unknown) => void
</script>

<div class="bokeh-target" use:bokeh={{model, mountOptions, onMounted, onError}}></div>
