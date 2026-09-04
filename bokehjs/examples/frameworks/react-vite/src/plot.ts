import {ColumnDataSource, Plotting} from "@bokeh/bokehjs"

const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const baseline = [2, 2.8, 4.2, 5.1, 4.7, 3.8, 3.2, 4.1, 5.6, 6.3, 5.7, 7]
const response = [0.8, 0.2, -0.8, -1.4, -0.4, 1.2, 1.8, 0.7, -0.9, -1.6, 0.5, -1.2]

export const source = ColumnDataSource.create({data: {x, y: baseline}})
export const plot = Plotting.figure({title: "BokehJS with React", width: 560, height: 300})
plot.line({field: "x"}, {field: "y"}, {source, line_width: 3})

export function updatePlot(variation: number) {
  source.data = {x, y: baseline.map((value, index) => value + (variation - 1)*response[index])}
}
