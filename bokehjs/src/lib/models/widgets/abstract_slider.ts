import * as noUiSlider from "nouislider"

import * as p from "core/properties"
import {Color} from "core/types"
import {div, span, empty} from "core/dom"
import {repeat} from "core/util/array"
import {throttle} from "core/util/callback"
import {SliderCallbackPolicy} from "core/enums"

import {Control, ControlView} from "./control"
import {CallbackLike0} from "../callbacks/callback"

import {bk_slider_value, bk_slider_title, bk_input_group} from "styles/widgets/sliders"

const prefix = 'bk-noUi-'

export interface SliderSpec {
  start: number
  end: number
  value: number[]
  step: number
}

abstract class AbstractBaseSliderView extends ControlView {
  model: AbstractSlider

  protected group_el: HTMLElement
  protected slider_el: HTMLElement
  protected title_el: HTMLElement
  protected callback_wrapper?: () => void

  private get noUiSlider(): noUiSlider.noUiSlider {
    return (this.slider_el as noUiSlider.Instance).noUiSlider
  }

  initialize(): void {
    super.initialize()
    this._init_callback()
  }

  connect_signals(): void {
    super.connect_signals()

    const {callback, callback_policy, callback_throttle} = this.model.properties
    this.on_change([callback, callback_policy, callback_throttle], () => this._init_callback())

    const {start, end, value, step, title} = this.model.properties
    this.on_change([start, end, value, step], () => {
      const {start, end, value, step} = this._calc_to()
      this.noUiSlider.updateOptions({
        range: {min: start, max: end},
        start: value,
        step,
      })
    })

    const {bar_color} = this.model.properties
    this.on_change(bar_color, () => {
      this._set_bar_color()
    })

    this.on_change([value, title], () => this._update_title())
  }

  protected _init_callback(): void {
    const {callback} = this.model
    const fn = () => {
      if (callback != null)
        callback.execute(this.model)
      this.model.value_throttled = this.model.value
    }

    switch (this.model.callback_policy) {
      case 'continuous': {
        this.callback_wrapper = fn
        break
      }
      case 'throttle': {
        this.callback_wrapper = throttle(fn, this.model.callback_throttle)
        break
      }
      default:
        this.callback_wrapper = undefined
    }
  }

  _update_title(): void {
    empty(this.title_el)

    const hide_header = this.model.title == null || (this.model.title.length == 0 && !this.model.show_value)
    this.title_el.style.display = hide_header ? "none" : ""

    if (!hide_header) {
      if (this.model.title.length != 0)
        this.title_el.textContent = `${this.model.title}: `

      if (this.model.show_value) {
        const {value} = this._calc_to()
        const pretty = value.map((v) => this.model.pretty(v)).join(" .. ")
        this.title_el.appendChild(span({class: bk_slider_value}, pretty))
      }
    }
  }

  protected _set_bar_color(): void {
    if (!this.model.disabled) {
      this.slider_el.querySelector<HTMLElement>(`.${prefix}connect`)!
                    .style
                    .backgroundColor = this.model.bar_color
    }
  }

  protected abstract _calc_to(): SliderSpec

  protected abstract _calc_from(values: number[]): number | number[]

  protected abstract _set_keypress_handles(): void

  protected _keypress_handle(e: KeyboardEvent, idx: 0 | 1 = 0): void {
    const {start, value, end, step} = this._calc_to()
    const is_range = value.length==2
    let low = start
    let high = end
    if (is_range && idx==0) {
      high = value[1]
    } else if (is_range && idx==1) {
      low = value[0]
    }
    switch (e.which) {
      case 37: {
        value[idx] = Math.max(value[idx] - step, low)
        break
      }
      case 39: {
        value[idx] = Math.min(value[idx] + step, high)
        break
      }
      default:
        return
    }
    if (is_range) {
      this.model.value = value
      this.model.properties.value.change.emit()
    } else {
      this.model.value = value[0]
    }
    this.noUiSlider.set(value)
    if (this.callback_wrapper != null)
      this.callback_wrapper()
  }

  render(): void {
    super.render()

    const {start, end, value, step} = this._calc_to()

    let tooltips: boolean | any[] // XXX
    if (this.model.tooltips) {
      const formatter = {
        to: (value: number): string => this.model.pretty(value),
      }

      tooltips = repeat(formatter, value.length)
    } else
      tooltips = false

    if (this.slider_el == null) {
      this.slider_el = div() as any

      noUiSlider.create(this.slider_el, {
        cssPrefix: prefix,
        range: {min: start, max: end},
        start: value,
        step,
        behaviour: this.model.behaviour,
        connect: this.model.connected,
        tooltips,
        orientation: this.model.orientation,
        direction: this.model.direction,
      } as any) // XXX: bad typings; no cssPrefix

      this.noUiSlider.on('slide',  (_, __, values) => this._slide(values))
      this.noUiSlider.on('change', (_, __, values) => this._change(values))

      this._set_keypress_handles()

      const toggleTooltip = (i: number, show: boolean): void => {
        if (!tooltips)
          return
        const handle = this.slider_el.querySelectorAll(`.${prefix}handle`)[i]
        const tooltip = handle.querySelector<HTMLElement>(`.${prefix}tooltip`)!
        tooltip.style.display = show ? 'block' : ''
      }

      this.noUiSlider.on('start', (_, i) => toggleTooltip(i, true))
      this.noUiSlider.on('end',   (_, i) => toggleTooltip(i, false))
    } else {
      this.noUiSlider.updateOptions({
        range: {min: start, max: end},
        start: value,
        step,
      })
    }

    this._set_bar_color()

    if (this.model.disabled)
      this.slider_el.setAttribute('disabled', 'true')
    else
      this.slider_el.removeAttribute('disabled')

    this.title_el = div({class: bk_slider_title})
    this._update_title()

    this.group_el = div({class: bk_input_group}, this.title_el, this.slider_el)
    this.el.appendChild(this.group_el)
  }

  protected _slide(values: number[]): void {
    this.model.value = this._calc_from(values)
    if (this.callback_wrapper != null)
      this.callback_wrapper()
  }

  protected _change(values: number[]): void {
    this.model.value = this._calc_from(values)
    this.model.value_throttled = this.model.value
    switch (this.model.callback_policy) {
      case 'mouseup':
      case 'throttle': {
        if (this.model.callback != null)
          this.model.callback.execute(this.model)
        break
      }
    }
  }
}

export abstract class AbstractSliderView extends AbstractBaseSliderView{

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

  protected _set_keypress_handles(): void{
    // Add single cursor event
    const handle = this.slider_el.querySelector(`.${prefix}handle`)!
    handle.setAttribute('tabindex', '0')
    handle.addEventListener('keydown', (e: KeyboardEvent): void => this._keypress_handle(e))
  }
}

export abstract class AbstractRangeSliderView extends AbstractBaseSliderView{

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

  protected _set_keypress_handles(): void{
    const handle_lower = this.slider_el.querySelector(`.${prefix}handle-lower`)!
    const handle_upper = this.slider_el.querySelector(`.${prefix}handle-upper`)!
    handle_lower.setAttribute('tabindex', '0')
    handle_lower.addEventListener('keydown', (e: KeyboardEvent): void => this._keypress_handle(e, 0))
    handle_upper.setAttribute('tabindex', '1')
    handle_upper.addEventListener('keydown', (e: KeyboardEvent): void => this._keypress_handle(e, 1))
  }
}

export namespace AbstractSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    title: p.Property<string>
    show_value: p.Property<boolean>
    start: p.Property<any> // XXX
    end: p.Property<any> // XXX
    value: p.Property<any> // XXX
    value_throttled: p.Property<any> // XXX
    step: p.Property<number>
    format: p.Property<string>
    direction: p.Property<"ltr" | "rtl">
    tooltips: p.Property<boolean>
    callback: p.Property<CallbackLike0<AbstractSlider> | null>
    callback_throttle: p.Property<number>
    callback_policy: p.Property<SliderCallbackPolicy>
    bar_color: p.Property<Color>
  }
}

export interface AbstractSlider extends AbstractSlider.Attrs {}

export abstract class AbstractSlider extends Control {
  properties: AbstractSlider.Props

  constructor(attrs?: Partial<AbstractSlider.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.define<AbstractSlider.Props>({
      title:             [ p.String,               ""           ],
      show_value:        [ p.Boolean,              true         ],
      start:             [ p.Any                                ],
      end:               [ p.Any                                ],
      value:             [ p.Any                                ],
      value_throttled:   [ p.Any                                ],
      step:              [ p.Number,               1            ],
      format:            [ p.String                             ],
      direction:         [ p.Any,                  "ltr"        ],
      tooltips:          [ p.Boolean,              true         ],
      callback:          [ p.Any                                ],
      callback_throttle: [ p.Number,               200          ],
      callback_policy:   [ p.SliderCallbackPolicy, "throttle"   ], // TODO (bev) enum
      bar_color:         [ p.Color,                "#e6e6e6"    ],
    })
  }

  behaviour: "drag" | "tap"
  connected: false | boolean[] = false

  protected _formatter(value: number, _format: string): string {
    return `${value}`
  }

  pretty(value: number): string {
    return this._formatter(value, this.format)
  }
}
AbstractSlider.initClass()
