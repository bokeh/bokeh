from bokeh.core.properties import Instance, Required, String
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import Slider, UIElement
from bokeh.util.compiler import TypeScript

CODE = """
import {UIElement, UIElementView} from "models/ui/ui_element"
import {Slider} from "models/widgets/sliders/slider"
import {div} from "core/dom"
import * as p from "core/properties"

export class CustomView extends UIElementView {
  declare model: Custom

  private content_el: HTMLElement

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.slider.change, () => this._update_text())
  }

  override render(): void {
    // BokehJS views create <div> elements by default. These are accessible
    // as ``this.el``. Many Bokeh views ignore the default <div> and
    // instead do things like draw to the HTML canvas. In this case though,
    // the program changes the contents of the <div> based on the current
    // slider value.
    super.render()

    this.content_el = div({style: {
      textAlign: "center",
      fontSize: "1.2em",
      padding: "2px",
      color: "#b88d8e",
      backgroundColor: "#2a3153",
    }})
    this.shadow_el.appendChild(this.content_el)

    this._update_text()
  }

  private _update_text(): void {
    this.content_el.textContent = `${this.model.text}: ${this.model.slider.value}`
  }
}

export namespace Custom {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    text: p.Property<string>
    slider: p.Property<Slider>
  }
}

export interface Custom extends Custom.Attrs {}

export class Custom extends UIElement {
  declare properties: Custom.Props
  declare __view_type__: CustomView

  constructor(attrs?: Partial<Custom.Attrs>) {
    super(attrs)
  }

  static {
    // If there is an associated view, this is typically boilerplate.
    this.prototype.default_view = CustomView

    // The this.define() block adds corresponding "properties" to the JS
    // model. These should normally line up 1-1 with the Python model
    // class. Most property types have counterparts. For example,
    // bokeh.core.properties.String will correspond to ``String`` in the
    // JS implementation. Where JS lacks a given type, you can use
    // ``p.Any`` as a "wildcard" property type.
    this.define<Custom.Props>(({String, Ref}) => ({
      text:   [ String, "Custom text" ],
      slider: [ Ref(Slider) ],
    }))
  }
}
"""

class Custom(UIElement):

    __implementation__ = TypeScript(CODE)

    text = String(default="Custom text")

    slider = Required(Instance(Slider))

slider = Slider(start=0, end=10, step=0.1, value=0, title="value")

custom = Custom(text="Special Slider Display", slider=slider)

layout = column(slider, custom)

show(layout)
