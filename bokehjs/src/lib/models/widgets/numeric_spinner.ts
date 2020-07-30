import {NumericInputView, NumericInput} from "./numeric_input"

import * as p from "core/properties"
import {button, div, toggle_attribute} from "core/dom"


const {min, max, floor} = Math

function precision(num: number): number { // get number of digits
  if (floor(num) !== num)
    return num.toFixed(16).replace(/0+$/, '').split(".")[1].length
  return 0
}

// Inpisration from https://github.com/uNmAnNeR/ispinjs
export class NumericSpinnerView extends NumericInputView {
  model: NumericSpinner

  protected wrapper_el: HTMLDivElement
  protected inc_el: HTMLButtonElement
  protected dec_el: HTMLButtonElement
  private _interval_handle: number;

  *buttons(): Generator<HTMLButtonElement> {
    yield this.inc_el
    yield this.dec_el
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

    this.inc_el = button({class: "bk-spin-btn bk-spin-btn-inc"})
    this.dec_el = button({class: "bk-spin-btn bk-spin-btn-dec"})
    this.wrapper_el.appendChild(this.input_el)
    this.wrapper_el.appendChild(this.inc_el)
    this.wrapper_el.appendChild(this.dec_el)
    for (const btn of this.buttons()) {
      toggle_attribute(btn, "disabled", this.model.disabled)
      btn.addEventListener("mousedown", (evt) => this._btn_mouse_down(evt))
      btn.addEventListener("mouseup", () => this._btn_mouse_up())
      btn.addEventListener("mouseleave", () => this._btn_mouse_leave())
    }
    this.input_el.addEventListener("wheel", (evt) =>
      this._input_mouse_wheel(evt)
    )
    this.input_el.addEventListener("keydown", (evt) =>
      this._input_key_down(evt)
    )
  }

  get precision(): number {
    const {low, step} = this.model
    return max(
      ...[low, step]
        .reduce<number[]>((prev, val) => {
          if (val != null) prev.push(val)
          return prev
        }, [])
        .map(precision)
    )
  }

  _start_incrementation(sign: 1 | -1): void {
    clearInterval(this._interval_handle)
    const {step} = this.model
    this._interval_handle = setInterval(() => this.increment(sign * step), 100)
  }

  _btn_mouse_down(evt: MouseEvent): void {
    evt.preventDefault()
    const sign = evt.currentTarget === this.inc_el ? 1 : -1
    this.increment(sign * this.model.step)
    this.input_el.focus()
    //while mouse is down we increment at a certain rate
    this._start_incrementation(sign)
  }

  _btn_mouse_up(): void {
    clearInterval(this._interval_handle)
  }

  _btn_mouse_leave(): void {
    clearInterval(this._interval_handle)
  }

  _input_mouse_wheel(evt: WheelEvent): void {
    if (document.activeElement !== this.input_el) return
    evt.preventDefault()

    const sign = evt.deltaY > 0 ? -1 : 1
    this.increment(sign * this.model.step)
  }

  _input_key_down(evt: KeyboardEvent) {
    switch (evt.keyCode) {
      case 38: // arrow up
        evt.preventDefault()
        return this.increment(this.model.step)
      case 40: // arrow down
        evt.preventDefault()
        return this.increment(-this.model.step)
      case 33: // page up
        evt.preventDefault()
        return this.increment(10 * this.model.step)
      case 34: // page down
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
        this.model.value =
          low != null ? low : high != null ? min(0, high) : 0
      else if (step < 0)
        this.model.value =
          high != null ? high : low != null ? max(low, 0) : 0
    } else this.model.value = this.adjust_to_precision(this.model.value + step)
  }
}

export namespace NumericSpinner {
  export type Attrs = p.AttrsOf<Props>

  export type Props = NumericInput.Props & {
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
      step: [p.Number, 1],
    })

    this.override({
      mode: "float",
    })
  }
}
