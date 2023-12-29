import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {np} from "@bokehjs/api/linalg"
import {range, reversed, repeat} from "@bokehjs/core/util/array"
import {enumerate, zip} from "@bokehjs/core/util/iterator"
import {FactorRange,  ColumnDataSource, Range1d, FixedTicker, PrintfTickFormatter, HoverTool} from "@bokehjs/models"

// subset of colorcet.rainbow
const palette = [
  "#0034f8", "#0056cd", "#006fa2", "#2b807d", "#3d9058", "#3e9f2b", "#5aab0d", "#80b412",
  "#a3bc18", "#c4c41d", "#e4cb23", "#fbc722", "#ffb31a", "#ff9e10", "#ff8805", "#ff6f00",
  "#ff5300",
]

async function fetch_data(): Promise<Map<string, number[]>> {
  const response = await fetch("/assets/data/probly.csv")
  const data = await response.text()

  const [headers, ...valuesets] = data.trim().split("\n")
    .map((line) => line.split(",").map((val) => val.trim()))

  const probly: Map<string, number[]> = new Map(headers.map((header) => [header, []]))

  for (const values of valuesets) {
    for (const [val, numbers] of zip(values, probly.values())) {
      numbers.push(parseFloat(val))
    }
  }

  return probly
}

describe("Examples", () => {
  it("should support RidgePlot using sub-coordinates", async () => {
    const probly = await fetch_data()
    const cats = reversed([...probly.keys()])

    const x = np.linspace(-20, 110, 500)
    const source = new ColumnDataSource({data: {x}})

    const y_range = new FactorRange({
      factors: cats,
      range_padding: 0.12,
    })

    const hover_tool = new HoverTool({
      tooltips: [
        ["data (x, y)", "($x, $y)"],
        ["name", "$name"],
      ],
    })

    const p = figure({width: 900, x_range: [-5, 105], y_range, tools: [hover_tool], toolbar_location: null})

    for (const [[cat, data], i] of enumerate(probly.entries())) {
      source.set(cat, data)

      const target_start = cats.indexOf(cat) + 0.5 // middle of the current category
      const target_end = target_start + 20         // arbitrary scaling to make plots pop

      const xy = p.subplot({
        x_source: p.x_range,
        y_source: new Range1d({start: 0, end: 1}),
        x_target: p.x_range,
        y_target: new Range1d({start: target_start, end: target_end}),
      })

      xy.patch({field: "x"}, {field: cat}, {color: palette[i], alpha: 0.6, line_color: "black", source, name: cat})
    }

    p.outline_line_color = null
    p.background_fill_color = "#efefef"

    const x_ticker = new FixedTicker({ticks: range(0, 101, 10)})
    p.xaxis.ticker = x_ticker
    p.xaxis.formatter = new PrintfTickFormatter({format: "%d%%"})

    p.ygrid.grid_line_color = null
    p.xgrid.grid_line_color = "#dddddd"
    p.xgrid.ticker = x_ticker

    p.axis.minor_tick_line_color = null
    p.axis.major_tick_line_color = null
    p.axis.axis_line_color = null

    await display(p)
  })

  it("should support RidgePlot using categorical offsets", async () => {
    const probly = await fetch_data()
    const cats = reversed([...probly.keys()])

    const x = np.linspace(-20, 110, 500)
    const source = new ColumnDataSource({data: {x}})

    const y_range = new FactorRange({
      factors: cats,
      range_padding: 0.12,
    })

    const p = figure({width: 900, x_range: [-5, 105], y_range, tools: ["hover"], toolbar_location: null})

    function ridge(category: string, data: number[], scale: number = 20): [string, number][] {
      return [...zip(repeat(category, data.length), data.map((val) => scale*val))]
    }

    for (const [[cat, data], i] of enumerate(probly.entries())) {
      source.set(cat, ridge(cat, data))
      p.patch({field: "x"}, {field: cat}, {color: palette[i], alpha: 0.6, line_color: "black", source, name: cat})
    }

    p.outline_line_color = null
    p.background_fill_color = "#efefef"

    const x_ticker = new FixedTicker({ticks: range(0, 101, 10)})
    p.xaxis.ticker = x_ticker
    p.xaxis.formatter = new PrintfTickFormatter({format: "%d%%"})

    p.ygrid.grid_line_color = null
    p.xgrid.grid_line_color = "#dddddd"
    p.xgrid.ticker = x_ticker

    p.axis.minor_tick_line_color = null
    p.axis.major_tick_line_color = null
    p.axis.axis_line_color = null

    await display(p)
  })
})
