import {createElement} from "react"
import {ref} from "vue"

import {ColumnDataSource, ModelResolver, Plotting, Range1d, mount, register_models, register_standard_models} from "@bokeh/bokehjs"
import {Bokeh as ReactBokeh, useBokeh as useReactBokeh} from "@bokeh/react"
import {bokeh} from "@bokeh/svelte"
import {Bokeh as VueBokeh, useBokeh as useVueBokeh} from "@bokeh/vue"
import {BokehElement, defineBokehElement} from "@bokeh/web-component"

const source = ColumnDataSource.create({data: {x: [0, 1], y: [1, 0]}})
const plot = Plotting.figure({tools: []})
plot.line({field: "x"}, {field: "y"}, {source})

void mount(plot, document.createElement("div"))
createElement(ReactBokeh, {model: plot})
void useReactBokeh
void useVueBokeh(() => plot, ref(document.createElement("div")))
void VueBokeh
void bokeh(document.createElement("div"), plot)
void BokehElement
void defineBokehElement

interface CustomRange extends Range1d.Attrs {}
class CustomRange extends Range1d {}
CustomRange.__qualified__ = "CustomRange"
const resolver = new ModelResolver(null)
register_models([CustomRange], resolver)
register_standard_models(resolver)
