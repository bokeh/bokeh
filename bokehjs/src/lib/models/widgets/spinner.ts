import {NumericInputView, NumericInput} from "./numeric_input"

import * as p from "core/properties"
import {button, div, toggle_attribute} from "core/dom"

const {min, max} = Math

function debounce(func: () => void, wait: number, immediate: boolean = false) {
  //func must works by side effects

  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function(this: any, ...args: any): void {
    const context = this

    const doLater = function() {
      timeoutId = undefined
      if (!immediate) {
        func.apply(context, args)
      }
    }

    const shouldCallNow = immediate && timeoutId === undefined

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(doLater, wait)

    if (shouldCallNow) {
      func.apply(context, args)
    }
  }
}

// Inspiration from https://github.com/uNmAnNeR/ispinjs
export class SpinnerView extends NumericInputView {
  declare model: Spinner

  protected wrapper_el: HTMLDivElement
  protected btn_up_el: HTMLButtonElement
  protected btn_down_el: HTMLButtonElement
  private _handles:  {
    interval: ReturnType<typeof setInterval> | undefined
    timeout: ReturnType<typeof setTimeout> | undefined
  }
  private _counter: number
  private _interval: number

  *buttons(): Generator<HTMLButtonElement> {
    yield this.btn_up_el
    yield this.btn_down_el
  }

  override initialize(): void {
    super.initialize()
    this._handles = {interval: undefined, timeout: undefined}
    this._interval = 200
  }

  override connect_signals(): void {
    super.connect_signals()
    const p = this.model.properties
    this.on_change(p.disabled, () => {
      for (const btn of this.buttons()) {
        toggle_attribute(btn, "disabled", this.model.disabled)
      }
    })
  }

  protected override _render_input(): HTMLElement {
    super._render_input()

    this.btn_up_el = button({class: "bk-spin-btn bk-spin-btn-up"})
    this.btn_down_el = button({class: "bk-spin-btn bk-spin-btn-down"})

    const {input_el, btn_up_el, btn_down_el} = this
    this.wrapper_el = div({class: "bk-spin-wrapper"}, input_el, btn_up_el, btn_down_el)

    return this.wrapper_el
  }

  override render(): void {
    super.render()

    for (const btn of this.buttons()) {
      toggle_attribute(btn, "disabled", this.model.disabled)
      btn.addEventListener("mousedown", (evt) => this._btn_mouse_down(evt))
      btn.addEventListener("mouseup", () => this._btn_mouse_up())
      btn.addEventListener("mouseleave", () => this._btn_mouse_leave())
    }
    this.input_el.addEventListener("keydown", (evt) => {
      this._input_key_down(evt)
    })
    this.input_el.addEventListener("keyup", () => {
      this.model.value_throttled = this.model.value
    })
    this.input_el.addEventListener("wheel", (evt) => {
      this._input_mouse_wheel(evt)
    })
    this.input_el.addEventListener("wheel", debounce(() => {
      this.model.value_throttled = this.model.value
    }, this.model.wheel_wait, false))
  }

  override remove(): void {
    this._stop_incrementation()
    super.remove()
  }

  _start_incrementation(sign: 1|-1): void {
    clearInterval(this._handles.interval)
    this._counter = 0
    const {step} = this.model
    const increment_with_increasing_rate = (step: number) => {
      this._counter += 1
      if (this._counter % 5 == 0) {
        const quotient  = Math.floor(this._counter / 5)
        if (quotient < 10) {
          clearInterval(this._handles.interval)
          this._handles.interval = setInterval(() => increment_with_increasing_rate(step), this._interval/(quotient+1))
        } else if (quotient >= 10 && quotient <= 13) {
          clearInterval(this._handles.interval)
          this._handles.interval = setInterval(() => increment_with_increasing_rate(step*2), this._interval/10)
        }
      }
      this.increment(step)
    }
    this._handles.interval = setInterval(() => increment_with_increasing_rate(sign * step), this._interval)
  }

  _stop_incrementation(): void {
    clearTimeout(this._handles.timeout)
    this._handles.timeout = undefined
    clearInterval(this._handles.interval)
    this._handles.interval = undefined
    this.model.value_throttled = this.model.value
  }

  _btn_mouse_down(evt: MouseEvent): void {
    evt.preventDefault()
    const sign = evt.currentTarget === (this.btn_up_el)? 1 : -1
    this.increment(sign * this.model.step)
    this.input_el.focus()
    //while mouse is down we increment at a certain rate
    this._handles.timeout = setTimeout(() => this._start_incrementation(sign), this._interval)
  }

  _btn_mouse_up(): void {
    this._stop_incrementation()
  }

  _btn_mouse_leave(): void {
    this._stop_incrementation()
  }

  _input_mouse_wheel(evt: WheelEvent): void {
    if (document.activeElement === this.input_el) {
      evt.preventDefault()
      const sign = (evt.deltaY>0)? -1 : 1
      this.increment(sign * this.model.step)
    }
  }

  _input_key_down(evt: KeyboardEvent) {
    switch (evt.key) {
      case "ArrowUp": {
        evt.preventDefault()
        return this.increment(this.model.step)
      }
      case "ArrowDown": {
        evt.preventDefault()
        return this.increment(-this.model.step)
      }
      case "PageUp": {
        evt.preventDefault()
        return this.increment(this.model.page_step_multiplier * this.model.step)
      }
      case "PageDown": {
        evt.preventDefault()
        return this.increment(-this.model.page_step_multiplier * this.model.step)
      }
    }
  }

  increment(step: number): void {
    const {low, high} = this.model
    if (this.model.value == null) {
      if (step > 0) {
        this.model.value = (low!=null)? low : (high!=null)? min(0, high) : 0
      } else if (step < 0) {
        this.model.value = (high!=null)? high : (low!=null)? max(low, 0) : 0
      }
    } else {
      this.model.value = this.bound_value(this.model.value + step)
    }
  }

  override change_input(): void {
    super.change_input()
    this.model.value_throttled = this.model.value
  }

  override bound_value(value: number): number {
    const {low, high} = this.model
    if (low != null && value < low) {
      return this.model.value ?? 0
    }
    if (high != null && value > high) {
      return this.model.value ?? 0
    }
    return value
  }
}

export namespace Spinner {
  export type Attrs = p.AttrsOf<Props>

  export type Props = NumericInput.Props & {
    value_throttled: p.Property<number | null>
    step: p.Property<number>
    page_step_multiplier: p.Property<number>
    wheel_wait: p.Property<number>
  }
}

export interface Spinner extends Spinner.Attrs {}

export class Spinner extends NumericInput {
  declare properties: Spinner.Props
  declare __view_type__: SpinnerView

  constructor(attrs?: Partial<Spinner.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SpinnerView

    this.define<Spinner.Props>(({Float, Nullable}) => ({
      value_throttled:      [ Nullable(Float), p.unset, {readonly: true} ],
      step:                 [ Float, 1 ],
      page_step_multiplier: [ Float, 10 ],
      wheel_wait:           [ Float, 100 ],
    }))

    this.override<Spinner.Props>({
      mode: "float",
    })
  }
}
