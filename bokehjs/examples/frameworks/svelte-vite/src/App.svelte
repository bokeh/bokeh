<script lang="ts">
  import {bokeh} from "@bokeh/svelte"

  import {plot} from "./plot"
</script>

<div use:bokeh={{model: plot}}></div>
