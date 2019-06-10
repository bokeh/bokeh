// The "core/properties" module has all the property types
import * as p from "core/properties"

// HTML construction and manipulation functions
import {div, input} from "core/dom"

// We will subclass in JavaScript from the same class that was subclassed
// from in Python
import {InputWidget, InputWidgetView} from "models/widgets/input_widget"

declare function jQuery(...args: any[]): any

export type SliderData = {from: number, to: number}

// This model will actually need to render things, so we must provide
// view. The LayoutDOM model has a view already, so we will start with that
export class IonRangeSliderView extends InputWidgetView {
  model: IonRangeSlider

  private value_el?: HTMLInputElement
  private slider_el: HTMLInputElement

  render(): void {
    // BokehJS Views create <div> elements by default, accessible as @el.
    // Many Bokeh views ignore this default <div>, and instead do things
    // like draw to the HTML canvas. In this case though, we change the
    // contents of the <div>, based on the current slider value.
    super.render()

    if (this.model.title != null) {
      this.value_el = input({type: "text", class: "bk-input", readonly: true, style: {marginBottom: "5px"}})
      this.group_el.appendChild(this.value_el)
    }

    this.slider_el = input({type: "text"})
    this.group_el.appendChild(div({style: {width: "100%"}}, this.slider_el))

    // Set up parameters
    const max = this.model.end
    const min = this.model.start
    const [from, to] = this.model.range || [max, min]
    const opts = {
      type: "double",
      grid: this.model.grid,
      min,
      max,
      from,
      to,
      step: this.model.step || (max - min)/50,
      disable: this.model.disabled,
      onChange: (data: SliderData) => this.slide(data),
      onFinish: (data: SliderData) => this.slidestop(data),
    }

    jQuery(this.slider_el).ionRangeSlider(opts)
    if (this.value_el != null)
      this.value_el.value = `${from} - ${to}`
  }

  slidestop(_data: SliderData): void {
  }

  slide({from, to}: SliderData): void {
    if (this.value_el != null)
      this.value_el.value = `${from} - ${to}`

    this.model.range = [from, to]
  }
}

export namespace IonRangeSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    range: p.Property<[number, number]>
    start: p.Property<number>
    end: p.Property<number>
    step: p.Property<number>
    grid: p.Property<boolean>
  }
}

export interface IonRangeSlider extends IonRangeSlider.Attrs {}

export class IonRangeSlider extends InputWidget {
  properties: IonRangeSlider.Props

  constructor(attrs?: Partial<IonRangeSlider.Attrs>) {
    super(attrs)
  }

  static init_IonRangeSlider(): void {
    // If there is an associated view, this is boilerplate.
    this.prototype.default_view = IonRangeSliderView

    // The @define block adds corresponding "properties" to the JS model. These
    // should basically line up 1-1 with the Python model class. Most property
    // types have counterparts, e.g. bokeh.core.properties.String will be
    // p.String in the JS implementation. Where the JS type system is not yet
    // as rich, you can use p.Any as a "wildcard" property type.
    this.define<IonRangeSlider.Props>({
      range:             [ p.Any                              ],
      start:             [ p.Number,               0          ],
      end:               [ p.Number,               1          ],
      step:              [ p.Number,               0.1        ],
      grid:              [ p.Boolean,              true       ],
    })
  }
}
