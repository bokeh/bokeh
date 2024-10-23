import type {API, PartialFormatter} from "nouislider"
import noUiSlider from "nouislider"

import * as p from "core/properties"
import type {Color} from "core/types"
import type {StyleSheetLike} from "core/dom"
import {div, span, empty} from "core/dom"
import {repeat} from "core/util/array"
import {color2css} from "core/util/color"

import {OrientedControl, OrientedControlView} from "../oriented_control"

import sliders_css, * as sliders from "styles/widgets/sliders.css"
import nouislider_css from "styles/widgets/nouislider.css"
import * as inputs from "styles/widgets/inputs.css"

export type SliderSpec<T> = {
  range: {min: number, max: number}
  start: T[]
  step: number
  format?: {
    to: (value: number) => string | number
    from: (value: string) => number | false
  }
}

export abstract class AbstractSliderView<T extends number | string> extends OrientedControlView {
  declare model: AbstractSlider<T>

  protected behaviour: "drag" | "tap"
  protected connected: false | boolean[] = false

  protected group_el: HTMLElement
  protected slider_el?: HTMLElement
  protected title_el: HTMLElement

  protected override readonly _auto_width = "auto"
  protected override readonly _auto_height = "auto"

  public *controls() {
    yield this.slider_el as HTMLInputElement
  }

  private _noUiSlider: API

  get _steps(): API["steps"] {
    return this._noUiSlider.steps
  }

  abstract pretty(value: number | string): string

  protected _update_slider(): void {
    this._noUiSlider.updateOptions(this._calc_to(), true)
  }

  override connect_signals(): void {
    super.connect_signals()

    const {direction, orientation, tooltips} = this.model.properties
    this.on_change([direction, orientation, tooltips], () => this.rerender())

    const {bar_color} = this.model.properties
    this.on_change(bar_color, () => {
      this._set_bar_color()
    })

    const {value, title, show_value} = this.model.properties
    this.on_change([value, title, show_value], () => this._update_title())

    this.on_change(value, () => this._update_slider())
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), nouislider_css, sliders_css]
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
        const {start} = this._calc_to()
        const pretty = start.map((v) => this.pretty(v)).join(" .. ")
        this.title_el.appendChild(span({class: sliders.slider_value}, pretty))
      }
    }
  }

  protected _set_bar_color(): void {
    if (this.connected !== false && !this.model.disabled && this.slider_el != null) {
      const connect_el = this.slider_el.querySelector<HTMLElement>(".noUi-connect")!
      connect_el.style.backgroundColor = color2css(this.model.bar_color)
    }
  }

  protected abstract _calc_to(): SliderSpec<T>

  protected abstract _calc_from(values: number[]): T | T[]

  override render(): void {
    super.render()

    let tooltips: PartialFormatter[] | null
    if (this.model.tooltips) {
      const formatter = {
        to: (value: number): string => this.pretty(value),
      }

      const {start} = this._calc_to()
      tooltips = repeat(formatter, start.length)
    } else {
      tooltips = null
    }

    if (this.slider_el == null) {
      this.slider_el = div()

      this._noUiSlider = noUiSlider.create(this.slider_el, {
        ...this._calc_to(),
        behaviour: this.behaviour,
        connect: this.connected,
        tooltips: tooltips ?? false,
        orientation: this.model.orientation,
        direction: this.model.direction,
      })

      this._noUiSlider.on("slide",  (_, __, values) => this._slide(values))
      this._noUiSlider.on("change", (_, __, values) => this._change(values))

      const toggle_tooltip = (i: number, show: boolean): void => {
        if (tooltips == null || this.slider_el == null) {
          return
        }
        const handle = this.slider_el.querySelectorAll(".noUi-handle")[i]
        const tooltip = handle.querySelector<HTMLElement>(".noUi-tooltip")!
        tooltip.style.display = show ? "block" : ""
      }

      this._noUiSlider.on("start", () => this._toggle_user_select(false))
      this._noUiSlider.on("end",   () => this._toggle_user_select(true))

      this._noUiSlider.on("start", (_, i) => toggle_tooltip(i, true))
      this._noUiSlider.on("end",   (_, i) => toggle_tooltip(i, false))
    } else {
      this._update_slider()
    }

    this._set_bar_color()

    if (this.model.disabled) {
      this.slider_el.setAttribute("disabled", "true")
    } else {
      this.slider_el.removeAttribute("disabled")
    }

    this.title_el = div({class: sliders.slider_title})
    this._update_title()

    this.group_el = div({class: inputs.input_group}, this.title_el, this.slider_el)
    this.shadow_el.appendChild(this.group_el)
    this._has_finished = true
  }

  protected _toggle_user_select(enable: boolean): void {
    const {style} = document.body
    const value = enable ? "" : "none"
    style.userSelect = value
    style.webkitUserSelect = value
  }

  protected _slide(values: number[]): void {
    this.model.value = this._calc_from(values)
  }

  protected _change(values: number[]): void {
    const value = this._calc_from(values)
    this.model.setv({value, value_throttled: value})
  }
}

export namespace AbstractSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = OrientedControl.Props & {
    title: p.Property<string | null>
    show_value: p.Property<boolean>
    value: p.Property<unknown>
    value_throttled: p.Property<unknown>
    direction: p.Property<"ltr" | "rtl">
    tooltips: p.Property<boolean>
    bar_color: p.Property<Color>
  }
}

export interface AbstractSlider<T extends number | string> extends AbstractSlider.Attrs {}

export abstract class AbstractSlider<T extends number | string> extends OrientedControl {
  declare properties: AbstractSlider.Props
  declare __view_type__: AbstractSliderView<T>

  constructor(attrs?: Partial<AbstractSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.define<AbstractSlider.Props>(({Unknown, Bool, Str, Color, Enum, Nullable}) => {
      return {
        title:           [ Nullable(Str), "" ],
        show_value:      [ Bool, true ],
        value:           [ Unknown ],
        value_throttled: [ Unknown, p.unset, {readonly: true} ],
        direction:       [ Enum("ltr", "rtl"), "ltr" ],
        tooltips:        [ Bool, true ],
        bar_color:       [ Color, "#e6e6e6" ],
      }
    })

    this.override<AbstractSlider.Props>({
      width: 300, // sliders don't have any intrinsic width
    })
  }
}
