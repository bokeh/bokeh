<script lang="ts">
  import {bokeh} from "@bokeh/svelte"

  import {plot, updatePlot} from "./plot"

  let variation = 1

  function update(event: Event) {
    variation = (event.currentTarget as HTMLInputElement).valueAsNumber
    updatePlot(variation)
  }
</script>

<main class="app-shell">
  <p class="eyebrow">Framework integration example</p>
  <h1>BokehJS + Svelte</h1>
  <p class="intro">A native Svelte control updates data in a live Bokeh plot.</p>
  <section class="demo-card" aria-label="Interactive Bokeh plot example">
    <div class="control-row">
      <label for="variation">Signal variation</label>
      <input id="variation" data-bokeh-control type="range" min="0.5" max="2" step="0.25"
        value={variation} oninput={update}>
      <output data-bokeh-output for="variation">{variation.toFixed(2)}×</output>
    </div>
    <div class="plot-host" use:bokeh={{model: plot}}></div>
  </section>
  <p class="note">Svelte owns the controls and page layout; BokehJS owns the plot.</p>
</main>
