import * as noUiSlider from "nouislider"

import * as p from "core/properties"
import {Color} from "core/types"
import {label, div} from "core/dom"
import {logger} from "core/logging"
import {repeat} from "core/util/array"
import {throttle} from "core/util/callback"
import {Orientation, SliderCallbackPolicy} from "core/enums"
import {HTML, SizingPolicy} from "core/layout"

import {Widget, WidgetView} from "./widget"
import {CallbackLike0} from "../callbacks/callback"

export interface SliderSpec {
  start: number
  end: number
  value: number[]
  step: number
}

export abstract class AbstractSliderView extends WidgetView {
  model: AbstractSlider

  protected sliderEl: HTMLElement
  protected titleEl: HTMLElement
  protected valueEl: HTMLElement
  protected callback_wrapper?: () => void

  private get noUiSlider(): noUiSlider.noUiSlider {
    return (this.sliderEl as noUiSlider.Instance).noUiSlider
  }

  initialize(options: any): void {
    super.initialize(options)
    this._init_callback()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.callback.change,          () => this._init_callback())
    this.connect(this.model.properties.callback_policy.change,   () => this._init_callback())
    this.connect(this.model.properties.callback_throttle.change, () => this._init_callback())

    this.connect(this.model.change, () => this.render()) // TODO
  }

  protected _init_callback(): void {
    const {callback} = this.model
    if (callback != null) {
      const fn = () => callback.execute(this.model)

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
  }

  protected _width_policy(): SizingPolicy {
    return this.model.orientation == "horizontal" ? "fit" : "fixed"
  }

  protected _height_policy(): SizingPolicy {
    return this.model.orientation == "horizontal" ? "fixed" : "fit"
  }

  _update_layout(): void {
    this.layout = new HTML(this.el)
    const sizing = this.box_sizing()
    if (this.model.orientation == "horizontal") {
      if (sizing.width == null)
        sizing.width = this.model.default_size
    } else {
      if (sizing.height == null)
        sizing.height = this.model.default_size
    }
    this.layout.set_sizing(sizing)
  }

  protected abstract _calc_to(): SliderSpec

  protected abstract _calc_from(values: number[]): number | number[]

  render(): void {
    if (this.sliderEl == null) {
      // XXX: temporary workaround for _render_css()
      super.render()
    }

    const prefix = 'bk-noUi-'

    const {start, end, value, step} = this._calc_to()

    let tooltips: boolean | any[] // XXX
    if (this.model.tooltips) {
      const formatter = {
        to: (value: number): string => this.model.pretty(value),
      }

      tooltips = repeat(formatter, value.length)
    } else
      tooltips = false

    this.el.classList.add("bk-slider")

    if (this.sliderEl == null) {
      this.sliderEl = div() as any
      this.el.appendChild(this.sliderEl)

      noUiSlider.create(this.sliderEl, {
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

      // Add keyboard support
      const keypress = (e: KeyboardEvent): void => {
        const current = this._calc_to()
        let value = current.value[0]
        switch (e.which) {
          case 37: {
            value = Math.max(value - step, start)
            break
          }
          case 39: {
            value = Math.min(value + step, end)
            break
          }
          default:
            return
        }

        const pretty = this.model.pretty(value)
        logger.debug(`[slider keypress] value = ${pretty}`)
        this.model.value = value
        this.noUiSlider.set(value)
        if (this.valueEl != null)
          this.valueEl.textContent = pretty
        if (this.callback_wrapper != null)
          this.callback_wrapper()
      }

      const handle = this.sliderEl.querySelector(`.${prefix}handle`)!
      handle.setAttribute('tabindex', '0')
      handle.addEventListener('keydown', keypress)

      const toggleTooltip = (i: number, show: boolean): void => {
        const handle = this.sliderEl.querySelectorAll(`.${prefix}handle`)[i]
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

    if (this.titleEl != null)
      this.el.removeChild(this.titleEl)
    if (this.valueEl != null)
      this.el.removeChild(this.valueEl)

    if (this.model.title != null) {
      if (this.model.title.length != 0) {
        this.titleEl = label({}, `${this.model.title}:`)
        this.el.insertBefore(this.titleEl, this.sliderEl)
      }

      if (this.model.show_value) {
        const pretty = value.map((v) => this.model.pretty(v)).join(" .. ")
        this.valueEl = div({class: "bk-slider-value"}, pretty)
        this.el.insertBefore(this.valueEl, this.sliderEl)
      }
    }

    if (!this.model.disabled) {
      this.sliderEl.querySelector<HTMLElement>(`.${prefix}connect`)!
                   .style
                   .backgroundColor = this.model.bar_color
    }

    if (this.model.disabled)
      this.sliderEl.setAttribute('disabled', 'true')
    else
      this.sliderEl.removeAttribute('disabled')
  }

  protected _slide(values: number[]): void {
    const value = this._calc_from(values)
    const pretty = values.map((v) => this.model.pretty(v)).join(" .. ")
    logger.debug(`[slider slide] value = ${pretty}`)
    if (this.valueEl != null)
      this.valueEl.textContent = pretty
    this.model.value = value
    if (this.callback_wrapper != null)
      this.callback_wrapper()
  }

  protected _change(values: number[]): void {
    const value = this._calc_from(values)
    const pretty = values.map((v) => this.model.pretty(v)).join(" .. ")
    logger.debug(`[slider change] value = ${pretty}`)
    if (this.valueEl != null)
      this.valueEl.dataset.value = pretty
    this.model.value = value
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

export namespace AbstractSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    default_size: p.Property<number>
    title: p.Property<string>
    show_value: p.Property<boolean>
    start: p.Property<any> // XXX
    end: p.Property<any> // XXX
    value: p.Property<any> // XXX
    step: p.Property<number>
    format: p.Property<string>
    orientation: p.Property<Orientation>
    direction: p.Property<"ltr" | "rtl">
    tooltips: p.Property<boolean>
    callback: p.Property<CallbackLike0<AbstractSlider> | null>
    callback_throttle: p.Property<number>
    callback_policy: p.Property<SliderCallbackPolicy>
    bar_color: p.Property<Color>
  }
}

export interface AbstractSlider extends AbstractSlider.Attrs {}

export abstract class AbstractSlider extends Widget {
  properties: AbstractSlider.Props

  constructor(attrs?: Partial<AbstractSlider.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "AbstractSlider"

    this.define<AbstractSlider.Props>({
      default_size:      [ p.Number,               300          ],
      title:             [ p.String,               ""           ],
      show_value:        [ p.Boolean,              true         ],
      start:             [ p.Any                                ],
      end:               [ p.Any                                ],
      value:             [ p.Any                                ],
      step:              [ p.Number,               1            ],
      format:            [ p.String                             ],
      orientation:       [ p.Orientation,          "horizontal" ],
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
