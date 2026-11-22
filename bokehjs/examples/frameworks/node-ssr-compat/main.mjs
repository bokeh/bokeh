import {Plotting} from "@bokeh/bokehjs"

const plot = Plotting.figure({title: "BokehJS in Node"})
plot.line([1, 2, 3], [2, 5, 3])

console.log(`constructed ${plot.type} in Node without DOM globals`)
