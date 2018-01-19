/* XXX: partial */
import * as noUiSlider from "nouislider"

import * as p from "core/properties"
import {label, div} from "core/dom"
import {logger} from "core/logging"
import {repeat} from "core/util/array"
import {throttle} from "core/util/callback"
import {Orientation, SliderCallbackPolicy} from "core/enums"

import {Widget, WidgetView} from "./widget"

export abstract class AbstractSliderView extends WidgetView {
  model: AbstractSlider

  protected sliderEl: HTMLElement
  protected valueEl?: HTMLElement

  initialize(options: any): void {
    super.initialize(options)
    this.render()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  abstract _calc_to()

  abstract _calc_from(values: number[])

  render(): void {
    if (this.sliderEl == null) {
      // XXX: temporary workaround for _render_css()
      super.render()
    }

    if (this.model.callback != null) {
      const callback = () => this.model.callback.execute(this.model)

      switch (this.model.callback_policy) {
        case 'continuous': {
          this.callback_wrapper = callback
          break
        }
        case 'throttle': {
          this.callback_wrapper = throttle(callback, this.model.callback_throttle)
          break
        }
      }
    }

    const prefix = 'noUi-'

    const {start, end, value, step} = this._calc_to()

    let tooltips: boolean | any[] // XXX
    if (this.model.tooltips) {
      const formatter = {
        to: (value) => this.model.pretty(value)
      }

      tooltips = repeat(formatter, value.length)
    } else
      tooltips = false

    this.el.classList.add("bk-slider")

    if (this.sliderEl == null) {
      this.sliderEl = div()
      this.el.appendChild(this.sliderEl)

      noUiSlider.create(this.sliderEl, {
        cssPrefix: prefix,
        range: {min: start, max: end},
        start: value,
        step: step,
        behaviour: this.model.behaviour,
        connect: this.model.connected,
        tooltips: tooltips,
        orientation: this.model.orientation,
        direction: this.model.direction,
      })

      this.sliderEl.noUiSlider.on('slide',  (_, __, values) => this._slide(values))
      this.sliderEl.noUiSlider.on('change', (_, __, values) => this._change(values))

      // Add keyboard support
      const keypress = (e: Event): void => {
        let value = Number(this.sliderEl.noUiSlider.get())
        switch (e.which) {
          case 37: {
            value -= step
            break
          }
          case 39: {
            value += step
            break
          }
          default:
            return
        }

        const pretty = this.model.pretty(value)
        logger.debug(`[slider keypress] value = ${pretty}`)
        this.model.value = value
        this.sliderEl.noUiSlider.set(value)
        if (this.valueEl != null)
          this.valueEl.textContent = pretty
        if (this.callback_wrapper != null)
          this.callback_wrapper()
      }

      const handle = this.sliderEl.querySelector(`.${prefix}handle`)
      handle.setAttribute('tabindex', 0)
      handle.addEventListener('click', this.focus)
      handle.addEventListener('keydown', keypress)

      const toggleTooltip = (i: number, show: boolean): void => {
        const handle = this.sliderEl.querySelectorAll(`.${prefix}handle`)[i]
        const tooltip = handle.querySelector(`.${prefix}tooltip`)
        tooltip.style.display = show ? 'block' : ''
      }

      this.sliderEl.noUiSlider.on('start', (_, i) => toggleTooltip(i, true))
      this.sliderEl.noUiSlider.on('end',   (_, i) => toggleTooltip(i, false))
    } else {
      this.sliderEl.noUiSlider.updateOptions({
        range: {min: start, max: end},
        start: value,
        step: step,
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
      this.sliderEl.querySelector(`.${prefix}connect`)
                   .style
                   .backgroundColor = this.model.bar_color
    }

    if (this.model.disabled)
      this.sliderEl.setAttribute('disabled', true)
    else
      this.sliderEl.removeAttribute('disabled')
  }

  _slide(values): void {
    const value = this._calc_from(values)
    const pretty = values.map((v) => this.model.pretty(v)).join(" .. ")
    logger.debug(`[slider slide] value = ${pretty}`)
    if (this.valueEl != null)
      this.valueEl.textContent = pretty
    this.model.value = value
    if (this.callback_wrapper != null)
      this.callback_wrapper()
  }

  _change(values): void {
    const value = this._calc_from(values)
    const pretty = values.map((v) => this.model.pretty(v)).join(" .. ")
    logger.debug(`[slider change] value = ${pretty}`)
    if (this.valueEl != null)
      this.valueEl.value = pretty
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

export abstract class AbstractSlider extends Widget {

  static initClass() {
    this.prototype.type = "AbstractSlider"

    this.define({
      title:             [ p.String,      ""           ],
      show_value:        [ p.Bool,        true         ],
      start:             [ p.Any                       ],
      end:               [ p.Any                       ],
      value:             [ p.Any                       ],
      step:              [ p.Number,      1            ],
      format:            [ p.String                    ],
      orientation:       [ p.Orientation, "horizontal" ],
      direction:         [ p.Any,         "ltr"        ],
      tooltips:          [ p.Boolean,     true         ],
      callback:          [ p.Instance                  ],
      callback_throttle: [ p.Number,      200          ],
      callback_policy:   [ p.String,      "throttle"   ], // TODO (bev) enum
      bar_color:         [ p.Color,       "#e6e6e6"    ],
    })
  }

  title: string
  show_value: boolean
  start: any // XXX
  end: any // XXX
  value: any // XXX
  step: number
  format: string
  orientation: Orientation
  direction: "ltr" | "rtl"
  tooltips: boolean
  callback: any // XXX
  callback_throttle: number
  callback_policy: SliderCallbackPolicy
  bar_color: any // XXX: Color

  behaviour = null
  connected = false

  _formatter = (value, _format) => {
    return `${value}`
  }

  pretty(value) {
    return this._formatter(value, this.format)
  }
}

AbstractSlider.initClass()
