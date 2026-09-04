import {Plotting} from "@bokeh/bokehjs"
import {defineBokehElement} from "@bokeh/web-component"
import type {BokehElement} from "@bokeh/web-component"

defineBokehElement()

const plot = Plotting.figure({title: "BokehJS Web Component", width: 500, height: 300})
plot.line([1, 2, 3, 4], [2, 5, 3, 6], {line_width: 3})

const element = document.createElement("bokeh-plot") as BokehElement
element.model = plot
document.querySelector("#app")!.append(element)
