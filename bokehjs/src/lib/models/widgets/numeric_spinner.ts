import {NumericInputView, NumericInput} from "./numeric_input"

import * as p from "core/properties"
import {button, div, toggle_attribute, Keys} from "core/dom"


const {min, max, floor, abs} = Math

function precision(num: number): number { // get number of digits
  return (floor(num) !== num)? num.toFixed(16).replace(/0+$/, '').split(".")[1].length : 0
}



function debounce(func: () => void, wait: number, immediate: boolean = false) {
  //func must works by side effects

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function(this: any, ...args: any): void {
    const context = this

    const doLater = function() {
      timeoutId = undefined;
      if (!immediate) {
        func.apply(context, args)
      }
    }

    const shouldCallNow = immediate && timeoutId === undefined;

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
export class NumericSpinnerView extends NumericInputView {
  model: NumericSpinner

  protected wrapper_el: HTMLDivElement
  protected btn_up_el: HTMLButtonElement
  protected btn_down_el: HTMLButtonElement
  private _interval_handle: ReturnType<typeof setInterval>;

  *buttons(): Generator<HTMLButtonElement> {
    yield this.btn_up_el
    yield this.btn_down_el
  }

  initialize(): void {
    super.initialize()
  }

  connect_signals(): void {
    super.connect_signals()
    const p = this.model.properties
    this.on_change(p.disabled, () => {
      for (const btn of this.buttons()) {
        toggle_attribute(btn, "disabled", this.model.disabled)
      }
    })
  }

  render(): void {
    super.render()
    this.wrapper_el = div({class: "bk-spin-wrapper"})
    this.group_el.replaceChild(this.wrapper_el, this.input_el)

    this.btn_up_el = button({class: "bk-spin-btn bk-spin-btn-up"})
    this.btn_down_el = button({class: "bk-spin-btn bk-spin-btn-down"})
    this.wrapper_el.appendChild(this.input_el)
    this.wrapper_el.appendChild(this.btn_up_el)
    this.wrapper_el.appendChild(this.btn_down_el)
    for (const btn of this.buttons()) {
      toggle_attribute(btn, "disabled", this.model.disabled)
      btn.addEventListener("mousedown", (evt) => this._btn_mouse_down(evt))
      btn.addEventListener("mouseup", () => this._btn_mouse_up())
      btn.addEventListener("mouseleave", () => this._btn_mouse_leave())
    }
    this.input_el.addEventListener("keydown", (evt) =>
      this._input_key_down(evt)
    )
    this.input_el.addEventListener("wheel", (evt) =>
      this._input_mouse_wheel(evt)
    )
    this.input_el.addEventListener("wheel", debounce(() => {
      this.model.value_throttled = this.model.value
    }, 100, false))
  }

  get precision(): number {
    const {low, high, step} = this.model
    return max(...[low, high, step].map(abs).reduce<number[]>((prev, val) => {
        if (val!=null) prev.push(val)
        return prev
      }, []).map(precision))
  }

  _start_incrementation(sign: 1|-1): void {
    clearInterval(this._interval_handle)
    const {step} = this.model
    this._interval_handle = setInterval(() => this.increment(sign * step), 100)
  }

  _stop_incrementation(): void {
    clearInterval(this._interval_handle)
    this.model.value_throttled = this.model.value
  }

  _btn_mouse_down(evt: MouseEvent): void {
    evt.preventDefault()
    const sign = evt.currentTarget === (this.btn_up_el)? 1 : -1
    this.increment(sign * this.model.step)
    this.input_el.focus()
    //while mouse is down we increment at a certain rate
    this._start_incrementation(sign)
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
    switch (evt.keyCode) {
      case Keys.Up:
        evt.preventDefault()
        return this.increment(this.model.step)
      case Keys.Down:
        evt.preventDefault()
        return this.increment(-this.model.step)
      case Keys.PageUp:
        evt.preventDefault()
        return this.increment(10 * this.model.step)
      case Keys.PageDown:
        evt.preventDefault()
        return this.increment(-10 * this.model.step)
    }
  }

  adjust_to_precision(value: number): number {
    return this.bound_value(Number(value.toFixed(this.precision)))
  }

  increment(step: number): void {
    const {low, high} = this.model
    if (this.model.value == null) {
      if (step > 0)
        this.model.value = (low!=null)? low : (high!=null)? min(0, high) : 0
      else if (step < 0)
        this.model.value = (high!=null)? high : (low!=null)? max(low, 0) : 0
    } else
      this.model.value = this.adjust_to_precision(this.model.value + step)
  }

  change_input(): void {
    super.change_input()
    this.model.value_throttled = this.model.value
  }
}

export namespace NumericSpinner {
  export type Attrs = p.AttrsOf<Props>

  export type Props = NumericInput.Props & {
    value_throttled: p.Property<number | null>
    step: p.Property<number>
  }
}

export interface NumericSpinner extends NumericSpinner.Attrs {}

export class NumericSpinner extends NumericInput {
  properties: NumericSpinner.Props
  __view_type__: NumericSpinnerView

  constructor(attrs?: Partial<NumericSpinner.Attrs>) {
    super(attrs)
  }

  static init_NumericSpinner(): void {
    this.prototype.default_view = NumericSpinnerView

    this.define<NumericSpinner.Props>({
      value_throttled: [ p.Number, null ],
      step:            [ p.Number,    1 ],
    })

    this.override({
      mode: "float",
    })
  }
}
