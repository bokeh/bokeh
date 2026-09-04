import {Plotting} from "@bokeh/bokehjs"

export const plot = Plotting.figure({title: "BokehJS with Vue", width: 500, height: 300})
plot.line([1, 2, 3, 4], [2, 5, 3, 6], {line_width: 3})
