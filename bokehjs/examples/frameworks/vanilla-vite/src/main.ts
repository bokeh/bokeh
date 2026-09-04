import {Plotting, mount} from "@bokeh/bokehjs"

const plot = Plotting.figure({title: "BokehJS with Vite", width: 500, height: 300})
plot.line([1, 2, 3, 4], [2, 5, 3, 6], {line_width: 3})

await mount(plot, document.querySelector<HTMLElement>("#app")!)
