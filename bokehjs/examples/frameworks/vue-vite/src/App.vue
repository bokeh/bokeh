<script setup lang="ts">
import {ref} from "vue"

import {Bokeh} from "@bokeh/vue"

import {plot, updatePlot} from "./plot"

const variation = ref(1)

function update(event: Event) {
  const value = (event.currentTarget as HTMLInputElement).valueAsNumber
  variation.value = value
  updatePlot(value)
}
</script>

<template>
  <main class="app-shell">
    <p class="eyebrow">Framework integration example</p>
    <h1>BokehJS + Vue</h1>
    <p class="intro">A native Vue control updates data in a live Bokeh plot.</p>
    <section class="demo-card" aria-label="Interactive Bokeh plot example">
      <div class="control-row">
        <label for="variation">Signal variation</label>
        <input id="variation" data-bokeh-control type="range" min="0.5" max="2" step="0.25"
          :value="variation" @input="update">
        <output data-bokeh-output for="variation">{{ variation.toFixed(2) }}×</output>
      </div>
      <div class="plot-host"><Bokeh :model="plot" /></div>
    </section>
    <p class="note">Vue owns the controls and page layout; BokehJS owns the plot.</p>
  </main>
</template>
