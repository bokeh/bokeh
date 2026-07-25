import {NumericInputView, NumericInput} from "./numeric_input"
import type {VNode} from "core/vdom"
import {cls} from "core/vdom"
import type {Keys} from "core/dom"
import * as p from "core/properties"

import * as inputs_css from "styles/widgets/inputs.css"

const {min, max} = Math

type TimeoutHandle = ReturnType<typeof setTimeout>
type IntervalHandle = ReturnType<typeof setInterval>

function debounce(func: () => void, wait: number, immediate: boolean = false) {
  //func must works by side effects

  let timeoutId: TimeoutHandle | undefined

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
  declare readonly model: Spinner
  declare readonly signals: p.SignalsOf<Spinner.Props>
  declare readonly values: Spinner.Attrs

  private readonly _handles: {interval?: IntervalHandle, timeout?: TimeoutHandle} = {}

  private _counter: number

  private readonly _interval: number = 200

  protected override _buttons(): VNode {
    const {disabled} = this.signals
    return (
      <>
        <button
          class={cls(inputs_css.spin_btn, inputs_css.spin_btn_up)}
          disabled={disabled}
          onMouseDown={(event) => this._btn_mouse_down(event, +1)}
          onMouseUp={() => this._btn_mouse_up()}
          onMouseLeave={() => this._btn_mouse_leave()}
        />
        <button
          class={cls(inputs_css.spin_btn, inputs_css.spin_btn_down)}
          disabled={disabled}
          onMouseDown={(event) => this._btn_mouse_down(event, -1)}
          onMouseUp={() => this._btn_mouse_up()}
          onMouseLeave={() => this._btn_mouse_leave()}
        />
      </>
    )
  }

  /*
    onKeydown={(event) => this._input_key_down(event)}
    onKeyup={(event) => this._input_key_up(event)}
    onWheel={(event) => this._input_mouse_wheel(event)}
    onWheel={debounce(() => {
      this.model.value_throttled = this.model.value
    }, this.model.wheel_wait, false))
  */

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
        const quotient = Math.floor(this._counter / 5)
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

  protected _stop_incrementation(): void {
    clearTimeout(this._handles.timeout)
    clearInterval(this._handles.interval)
    this._handles.timeout = undefined
    this._handles.interval = undefined
    this.model.value_throttled = this.model.value
  }

  protected _btn_mouse_down(event: MouseEvent, direction: -1 | 1): void {
    event.preventDefault()
    this.increment(direction*this.values.step)
    this.input_el.focus()
    // while mouse is down we increment at a certain rate
    this._handles.timeout = setTimeout(() => {
      this._start_incrementation(direction)
    }, this._interval)
  }

  protected _btn_mouse_up(): void {
    this._stop_incrementation()
  }

  protected _btn_mouse_leave(): void {
    this._stop_incrementation()
  }

  protected _input_mouse_wheel(event: WheelEvent): void {
    if (this.shadow_el.activeElement === this.input_el) {
      event.preventDefault()
      const sign = event.deltaY > 0 ? -1 : 1
      this.increment(sign*this.values.step)
    }
  }

  protected _input_key_down(event: KeyboardEvent): void {
    const step = (() => {
      const {step, page_step_multiplier} = this.values
      switch (event.key as Keys) {
        case "ArrowUp":   return step
        case "ArrowDown": return -step
        case "PageUp":    return page_step_multiplier*step
        case "PageDown":  return -page_step_multiplier*step
        default:          return null
      }
    })()
    if (step != null) {
      event.preventDefault()
      this.increment(step)
    }
  }

  protected _input_key_up(_event: KeyboardEvent): void {
    this.model.value_throttled = this.model.value
  }

  increment(step: number): void {
    const {low, high, value} = this.values
    if (value == null) {
      if (step > 0) {
        this.model.value = low != null ? low : (high != null ? min(0, high) : 0)
      } else if (step < 0) {
        this.model.value = high != null ? high : (low != null ? max(low, 0) : 0)
      }
    } else {
      this.model.value = this.bound_value(value + step)
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
