import {createElement} from "react"
import {ref} from "vue"

import {ColumnDataSource, ModelResolver, Plotting, Range1d, mount, register_models, register_standard_models} from "@bokeh/bokehjs"
import type {properties as p} from "@bokeh/bokehjs"
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
void bokeh(document.createElement("div"), {model: plot})
void BokehElement
void defineBokehElement

namespace CustomRange {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Range1d.Props & {
    history_enabled: p.Property<boolean>
  }
}
interface CustomRange extends CustomRange.Attrs {}
class CustomRange extends Range1d {
  declare properties: CustomRange.Props
  readonly history: number[] = []

  static {
    this.define<CustomRange.Props>(({Bool}) => ({
      history_enabled: [Bool, true],
    }))
  }

  override initialize(): void {
    super.initialize()
    if (this.history_enabled) {
      this.history.push(this.start)
    }
  }
}
const custom_range = CustomRange.create({start: 0, end: 1, history_enabled: true})
custom_range.history.push(custom_range.end)
// @ts-expect-error Bokeh models must be constructed through their inherited factory.
new Range1d({start: 0, end: 1})
// @ts-expect-error The inherited factory accepts only declared Bokeh properties.
CustomRange.create({missing: true})
const resolver = new ModelResolver(null)
register_models({CustomRange}, resolver)
register_standard_models(resolver)
