from bokeh.core.properties import String, Instance
from bokeh.models import LayoutDOM, Slider

CODE ="""
import {LayoutDOM, LayoutDOMView} from "models/layouts/layout_dom"
import {Slider} from "models/widgets/slider"
import {FixedLayout} from "core/layout/index" // XXX: should be core/layout
import * as p from "core/properties"

export class CustomView extends LayoutDOMView {

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.slider.change, () => this._update_text())
  }

  get child_models() {
    return []
  }

  _update_layout(): void {
    this.layout = new FixedLayout(200, 30) // TODO: fit height
  }

  render(): void {
    // BokehJS Views create <div> elements by default, accessible as ``this.el``.
    // Many Bokeh views extend this default <div> with additional elemements
    // (e.g. <canvas>), and instead do things like paint on the HTML canvas.
    // In this case though, we change the contents of the <div>, based on the
    // current slider value.
    super.render()

    const {style} = this.el
    style.textAlign = "center"
    style.fontSize = "1.2em"
    style.padding = "2px"
    style.color = "#b88d8e"
    style["background-color"] = "#2a3153"

    this._update_text()
  }

  private _update_text(): void {
    this.el.textContent = `${this.model.text}: ${this.model.slider.value}`
  }
}

export namespace LayoutDOM {
  export interface Attrs extends LayoutDOM.Attrs {
    text: string
    slider: Slider
  }

  export interface Props extends LayoutDOM.Props {
    text: p.Property<string>
    slider: p.Property<Slider>
  }
}

export interface Custom extends Custom.Attrs {}

export class Custom extends LayoutDOM {
  properties: Custom.Props

  constructor(attrs?: Partial<Custom.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    // The ``type`` class attribute should generally match exactly the name
    // of the corresponding Python class.
    this.prototype.type = "Custom"

    // If there is an associated view, this is typically boilerplate.
    this.prototype.default_view = CustomView

    // The define block adds corresponding "properties" to the JS model. These
    // should normally line up 1-1 with the Python model class. Most property
    // types have counterparts, e.g. bokeh.core.properties.String will be
    // ``p.String`` in the JS implementation. Any time the JS type system is not
    // yet as complete, you can use ``p.Any`` as a "wildcard" property type.
    this.define({
      text:   [ p.String ],
      slider: [ p.Any    ],
    })
  }
}
Custom.initClass()
"""

from bokeh.util.compiler import TypeScript

class Custom(LayoutDOM):

    __implementation__ = TypeScript(CODE)

    text = String(default="Custom text")

    slider = Instance(Slider)

from bokeh.io import show

from bokeh.layouts import column
from bokeh.models import Slider

slider = Slider(start=0, end=10, step=0.1, value=0, title="value")

custom = Custom(text="Special Slider Display", slider=slider)

layout = column(slider, custom)

show(layout)
