"use client"

import {useState} from "react"
import type {FormEvent} from "react"

import {ColumnDataSource, Plotting} from "@bokeh/bokehjs"
import {Bokeh} from "@bokeh/react"

const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const baseline = [2, 2.8, 4.2, 5.1, 4.7, 3.8, 3.2, 4.1, 5.6, 6.3, 5.7, 7]
const response = [0.8, 0.2, -0.8, -1.4, -0.4, 1.2, 1.8, 0.7, -0.9, -1.6, 0.5, -1.2]

function createPlot() {
  const source = ColumnDataSource.create({data: {x, y: baseline}})
  const plot = Plotting.figure({title: "BokehJS with Next.js", width: 560, height: 300})
  plot.line({field: "x"}, {field: "y"}, {source, line_width: 3})
  return {plot, source}
}

export function BokehExample() {
  const [{plot, source}] = useState(createPlot)
  const [variation, setVariation] = useState(1)

  function update(event: FormEvent<HTMLInputElement>) {
    const variation = event.currentTarget.valueAsNumber
    setVariation(variation)
    source.data = {x, y: baseline.map((value, index) => value + (variation - 1)*response[index])}
  }

  return <section className="demo-card" aria-label="Interactive Bokeh plot example">
    <div className="control-row">
      <label htmlFor="variation">Signal variation</label>
      <input id="variation" data-bokeh-control type="range" min="0.5" max="2" step="0.25"
        value={variation} onInput={update}/>
      <output data-bokeh-output htmlFor="variation">{variation.toFixed(2)}×</output>
    </div>
    <div className="plot-host"><Bokeh model={plot}/></div>
  </section>
}
