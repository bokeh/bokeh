import {throttle} from "core/util/callback"

// The "core/properties" module has all the property types
import * as p from "core/properties"

// HTML construction and manipulation functions
import {label, input, div} from "core/dom"

// We will subclass in JavaScript from the same class that was subclassed
// from in Python
import {InputWidget, InputWidgetView} from "models/widgets/input_widget"

export type SliderData = {from: number, to: number}

// This model will actually need to render things, so we must provide
// view. The LayoutDOM model has a view already, so we will start with that
export class IonRangeSliderView extends InputWidgetView {

  private title_el?: HTMLElement
  private value_el?: HTMLElement
  private slider_el: HTMLElement

  private callback_wrapper?: () => void

  initialize(options: any): void {
    super.initialize(options)

    const {callback} = this.model
    if (callback != null) {
      const wrapper = () => callback.execute(this.model)

      switch (this.model.callback_policy) {
        case "continuous": {
          this.callback_wrapper = wrapper
          break
        }
        case "throttle": {
          this.callback_wrapper = throttle(wrapper, this.model.callback_throttle)
          break
        }
      }
    }
  }

  render(): void {
    // BokehJS Views create <div> elements by default, accessible as @el.
    // Many Bokeh views ignore this default <div>, and instead do things
    // like draw to the HTML canvas. In this case though, we change the
    // contents of the <div>, based on the current slider value.
    super.render()

    if (this.model.title != null) {
      if (this.model.title.length != 0) {
        this.title_el = label({}, `${this.model.title}: `)
        this.el.appendChild(this.title_el)
      }

      this.value_el = input({type: "text", readonly: true})
      this.el.appendChild(this.value_el)
    }

    this.slider_el = input({type: "text", class: "bk-slider"})
    this.el.appendChild(this.slider_el)

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
      onChange: (data) => this.slide(data),
      onFinish: (data) => this.slidestop(data),
    }

    jQuery(this.slider_el).ionRangeSlider(opts)
    this.value_el.value = `${from} - ${to}`
  }

  slidestop(_data: SliderData): void {
    switch (this.model.callback_policy) {
      case "mouseup":
      case "throttle": {
        const {callback} = this.model
        if (callback != null)
          callback.execute(this.model)
        break
      }
    }
  }

  slide({from, to}: SliderData): void {
    this.value_el.value = `${from} - ${to}`
    this.model.range = [from, to]
    if (this.callback_wrapper != null)
      this.callback_wrapper()
  }
}

export class IonRangeSlider extends InputWidget {

  static initClass(): void {
    // The ``type`` class attribute should generally match exactly the name
    // of the corresponding Python class.
    this.prototype.type = "IonRangeSlider"

    // If there is an associated view, this is boilerplate.
    this.prototype.default_view = IonRangeSliderView

    // The @define block adds corresponding "properties" to the JS model. These
    // should basically line up 1-1 with the Python model class. Most property
    // types have counterparts, e.g. bokeh.core.properties.String will be
    // p.String in the JS implementation. Where the JS type system is not yet
    // as rich, you can use p.Any as a "wildcard" property type.
    this.define({
      range:             [ p.Any,                      ],
      start:             [ p.Number,      0            ],
      end:               [ p.Number,      1            ],
      step:              [ p.Number,      0.1          ],
      grid:              [ p.Bool,        true         ],
      callback_throttle: [ p.Number,      200          ],
      callback_policy:   [ p.String,      "throttle"   ],
    })
  }
}
IonRangeSlider.initClass()
