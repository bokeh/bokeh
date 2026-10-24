<script lang="ts">
  import type {BokehMount, ClientSession} from "@bokeh/bokehjs"
  import type {BokehSessionSource} from "@bokeh/framework"
  import {bokehSession, bokehRoot} from "@bokeh/svelte"

  export let source: BokehSessionSource
  export let onSession: (session: ClientSession) => void
  export let onMounted: (mounted: BokehMount) => void
  export let onError: (error: unknown) => void
  let visible = true
  export function showFirst(value: boolean) { visible = value }
</script>

<main use:bokehSession={{source, onSession, onMounted, onError}}>
  <section>{#if visible}<div class="first" use:bokehRoot={{model: "first"}}></div>{/if}</section>
  <p>ordinary Svelte content between session roots</p>
  <aside><div class="second" use:bokehRoot={{model: "second"}}></div></aside>
  <div class="late" use:bokehRoot={{model: "late"}}></div>
</main>
