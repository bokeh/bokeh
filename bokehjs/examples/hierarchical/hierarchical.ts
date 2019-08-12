import * as Bokeh from "bokehjs"

const {figure, show} = Bokeh.Plotting
const {concat, zip} = Bokeh.LinAlg
const {FactorRange} = Bokeh

export namespace Hierarchical {
  const fruits = ["Apples", "Pears", "Nectarines", "Plums", "Grapes", "Strawberries"]
  const years = ["2015", "2016", "2017"]

  const data = {
    2015: [2, 1, 4, 3, 2, 4],
    2016: [5, 3, 3, 2, 4, 6],
    2017: [3, 2, 4, 4, 5, 3],
  }

  const x: [string, string][] = []
  for (const fruit of fruits)
    for (const year of years)
      x.push([fruit, year])

  const counts = concat(zip(data["2015"], data["2016"], data["2017"])) // like an hstack

  const p = figure({x_range: new FactorRange({factors: x, range_padding: 0.1}),
                    plot_height: 250, toolbar_location: null, title: "Fruit Counts by Year"})
  p.vbar({x, top: counts, width: 0.9})

  p.xaxis.map((axis) => axis.major_label_orientation = 1)
  p.xgrid.map((grid) => grid.grid_line_color = null)

  p.y_range.start = 0

  show(p)
}
