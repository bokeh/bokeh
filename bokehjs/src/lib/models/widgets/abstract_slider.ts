import noUiSlider, {API} from "nouislider"

import * as p from "core/properties"
import {Color} from "core/types"
import {div, span, empty} from "core/dom"
import {repeat} from "core/util/array"
import {color2css} from "core/util/color"

import {OrientedControl, OrientedControlView} from "./oriented_control"
import {TickFormatter} from "../formatters/tick_formatter"

import sliders_css, * as sliders from "styles/widgets/sliders.css"
import nouislider_css from "styles/widgets/nouislider.css"
import * as inputs from "styles/widgets/inputs.css"

export interface SliderSpec {
  start: number
  end: number
  value: number[]
  step: number
}

abstract class AbstractBaseSliderView extends OrientedControlView {
  override model: AbstractSlider

  protected group_el: HTMLElement
  protected slider_el?: HTMLElement
  protected title_el: HTMLElement

  *controls() {
    yield this.slider_el as HTMLInputElement
  }

  private _noUiSlider: API

  override connect_signals(): void {
    super.connect_signals()

    const {direction, orientation, tooltips} = this.model.properties
    this.on_change([direction, orientation, tooltips], () => this.render())

    const {start, end, value, step, title} = this.model.properties
    this.on_change([start, end, value, step], () => {
      const {start, end, value, step} = this._calc_to()
      this._noUiSlider.updateOptions({
        range: {min: start, max: end},
        start: value,
        step,
      }, true)
    })

    const {bar_color} = this.model.properties
    this.on_change(bar_color, () => {
      this._set_bar_color()
    })

    const {show_value} = this.model.properties
    this.on_change([value, title, show_value], () => this._update_title())
  }

  override styles(): string[] {
    return [...super.styles(), nouislider_css, sliders_css]
  }

  _update_title(): void {
    empty(this.title_el)

    const hide_header = this.model.title == null || (this.model.title.length == 0 && !this.model.show_value)
    this.title_el.style.display = hide_header ? "none" : ""

    if (!hide_header) {
      const {title} = this.model
      if (title != null && title.length > 0) {
        if (this.contains_tex_string(title)) {
          this.title_el.innerHTML = `${this.process_tex(title)}: `
        } else {
          this.title_el.textContent = `${title}: `
        }
      }

      if (this.model.show_value) {
        const {value} = this._calc_to()
        const pretty = value.map((v) => this.model.pretty(v)).join(" .. ")
        this.title_el.appendChild(span({class: sliders.slider_value}, pretty))
      }
    }
  }

  protected _set_bar_color(): void {
    if (!this.model.disabled && this.slider_el != null) {
      const connect_el = this.slider_el.querySelector<HTMLElement>(".noUi-connect")!
      connect_el.style.backgroundColor = color2css(this.model.bar_color)
    }
  }

  protected abstract _calc_to(): SliderSpec

  protected abstract _calc_from(values: number[]): number | number[]

  override render(): void {
    super.render()

    const {start, end, value, step} = this._calc_to()

    let tooltips: any[] | null // XXX
    if (this.model.tooltips) {
      const formatter = {
        to: (value: number): string => this.model.pretty(value),
      }

      tooltips = repeat(formatter, value.length)
    } else
      tooltips = null

    if (this.slider_el == null) {
      this.slider_el = div()

      this._noUiSlider = noUiSlider.create(this.slider_el, {
        range: {min: start, max: end},
        start: value,
        step,
        behaviour: this.model.behaviour,
        connect: this.model.connected,
        tooltips: tooltips ?? false,
        orientation: this.model.orientation,
        direction: this.model.direction,
      })

      this._noUiSlider.on("slide",  (_, __, values) => this._slide(values))
      this._noUiSlider.on("change", (_, __, values) => this._change(values))

      const toggle_tooltip = (i: number, show: boolean): void => {
        if (tooltips == null || this.slider_el == null)
          return
        const handle = this.slider_el.querySelectorAll(".noUi-handle")[i]
        const tooltip = handle.querySelector<HTMLElement>(".noUi-tooltip")!
        tooltip.style.display = show ? "block" : ""
      }

      this._noUiSlider.on("start", (_, i) => toggle_tooltip(i, true))
      this._noUiSlider.on("end",   (_, i) => toggle_tooltip(i, false))
    } else {
      this._noUiSlider.updateOptions({
        range: {min: start, max: end},
        start: value,
        step,
      }, true)
    }

    this._set_bar_color()

    if (this.model.disabled)
      this.slider_el.setAttribute("disabled", "true")
    else
      this.slider_el.removeAttribute("disabled")

    this.title_el = div({class: sliders.slider_title})
    this._update_title()

    this.group_el = div({class: inputs.input_group}, this.title_el, this.slider_el)
    this.shadow_el.appendChild(this.group_el)
    this._has_finished = true
  }

  protected _slide(values: number[]): void {
    this.model.value = this._calc_from(values)
  }

  protected _change(values: number[]): void {
    const value = this._calc_from(values)
    this.model.setv({value, value_throttled: value})
  }
}

export abstract class AbstractSliderView extends AbstractBaseSliderView {
  protected _calc_to(): SliderSpec {
    return {
      start: this.model.start,
      end: this.model.end,
      value: [this.model.value],
      step: this.model.step,
    }
  }

  protected _calc_from([value]: number[]): number {
    if (Number.isInteger(this.model.start) && Number.isInteger(this.model.end) && Number.isInteger(this.model.step))
      return Math.round(value)
    else
      return value
  }
}

export abstract class AbstractRangeSliderView extends AbstractBaseSliderView {
  protected _calc_to(): SliderSpec {
    return {
      start: this.model.start,
      end: this.model.end,
      value: this.model.value,
      step: this.model.step,
    }
  }

  protected _calc_from(values: number[]): number[] {
    return values
  }
}

export namespace AbstractSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = OrientedControl.Props & {
    title: p.Property<string | null>
    show_value: p.Property<boolean>
    start: p.Property<any> // XXX
    end: p.Property<any> // XXX
    value: p.Property<any> // XXX
    value_throttled: p.Property<any> // XXX
    step: p.Property<number>
    format: p.Property<string | TickFormatter>
    direction: p.Property<"ltr" | "rtl">
    tooltips: p.Property<boolean>
    bar_color: p.Property<Color>
  }
}

export interface AbstractSlider extends AbstractSlider.Attrs {}

export abstract class AbstractSlider extends OrientedControl {
  override properties: AbstractSlider.Props
  // TODO: __view_type__: AbstractSliderView

  constructor(attrs?: Partial<AbstractSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.define<AbstractSlider.Props>(({Any, Boolean, Number, String, Color, Or, Enum, Ref, Nullable}) => {
      return {
        title:           [ Nullable(String), "" ],
        show_value:      [ Boolean, true ],
        start:           [ Any ],
        end:             [ Any ],
        value:           [ Any ],
        value_throttled: [ Any ],
        step:            [ Number, 1 ],
        format:          [ Or(String, Ref(TickFormatter)) ],
        direction:       [ Enum("ltr", "rtl"), "ltr" ],
        tooltips:        [ Boolean, true ],
        bar_color:       [ Color, "#e6e6e6" ],
      }
    })
  }

  behaviour: "drag" | "tap"
  connected: false | boolean[] = false

  protected abstract _formatter(value: number, format: string | TickFormatter): string

  pretty(value: number): string {
    return this._formatter(value, this.format)
  }
}
