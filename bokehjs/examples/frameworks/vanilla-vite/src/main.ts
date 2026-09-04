import {ColumnDataSource, Plotting, mount} from "@bokeh/bokehjs"

const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const baseline = [2, 2.8, 4.2, 5.1, 4.7, 3.8, 3.2, 4.1, 5.6, 6.3, 5.7, 7]
const response = [0.8, 0.2, -0.8, -1.4, -0.4, 1.2, 1.8, 0.7, -0.9, -1.6, 0.5, -1.2]
const source = ColumnDataSource.create({data: {x, y: baseline}})
const plot = Plotting.figure({title: "BokehJS with Vite", width: 560, height: 300})
plot.line({field: "x"}, {field: "y"}, {source, line_width: 3})

document.querySelector("#app")!.innerHTML = `
  <main class="app-shell">
    <p class="eyebrow">Direct consumer example</p>
    <h1>BokehJS + Vite</h1>
    <p class="intro">A native DOM control updates data in a live Bokeh plot.</p>
    <section class="demo-card" aria-label="Interactive Bokeh plot example">
      <div class="control-row">
        <label for="variation">Signal variation</label>
        <input id="variation" data-bokeh-control type="range" min="0.5" max="2" step="0.25" value="1">
        <output data-bokeh-output for="variation">1.00×</output>
      </div>
      <div id="plot" class="plot-host"></div>
    </section>
    <p class="note">The page owns the controls and layout; BokehJS owns the plot.</p>
  </main>
`

const input = document.querySelector<HTMLInputElement>("[data-bokeh-control]")!
const output = document.querySelector<HTMLOutputElement>("[data-bokeh-output]")!
input.addEventListener("input", () => {
  const variation = input.valueAsNumber
  source.data = {x, y: baseline.map((value, index) => value + (variation - 1)*response[index])}
  output.value = `${variation.toFixed(2)}×`
})

await mount(plot, document.querySelector<HTMLElement>("#plot")!)
