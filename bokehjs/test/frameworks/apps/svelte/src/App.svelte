<script lang="ts">
  import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
  import type {BokehModel} from "@bokeh/framework"
  import {bokeh, bokehDocument, bokehRoot} from "@bokeh/svelte"

  export let model: BokehModel
  export let multiRoot: boolean
  export let mountOptions: MountOptions | undefined = undefined
  export let onMounted: (mounted: BokehMount) => void
  export let onError: (error: unknown) => void
</script>

{#if multiRoot}
  <main use:bokehDocument={{models: model, mountOptions, onMounted, onError}}>
    <section><div class="bokeh-target" use:bokehRoot={{model: model[0]}}></div></section>
    <p>ordinary Svelte content between roots</p>
    <aside><div class="bokeh-target" use:bokehRoot={{model: model[1]}}></div></aside>
  </main>
{:else}
  <div class="bokeh-target" use:bokeh={{model, mountOptions, onMounted, onError}}></div>
{/if}
