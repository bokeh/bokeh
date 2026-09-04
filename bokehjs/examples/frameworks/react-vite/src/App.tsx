import {useState} from "react"
import type {FormEvent} from "react"

import {Bokeh} from "@bokeh/react"

import {plot, updatePlot} from "./plot"

export function App() {
  const [variation, setVariation] = useState(1)

  function update(event: FormEvent<HTMLInputElement>) {
    const variation = event.currentTarget.valueAsNumber
    setVariation(variation)
    updatePlot(variation)
  }

  return <main className="app-shell">
    <p className="eyebrow">Framework integration example</p>
    <h1>BokehJS + React</h1>
    <p className="intro">A native React control updates data in a live Bokeh plot.</p>
    <section className="demo-card" aria-label="Interactive Bokeh plot example">
      <div className="control-row">
        <label htmlFor="variation">Signal variation</label>
        <input id="variation" data-bokeh-control type="range" min="0.5" max="2" step="0.25"
          value={variation} onInput={update}/>
        <output data-bokeh-output htmlFor="variation">{variation.toFixed(2)}×</output>
      </div>
      <div className="plot-host"><Bokeh model={plot}/></div>
    </section>
    <p className="note">React owns the controls and page layout; BokehJS owns the plot.</p>
  </main>
}
