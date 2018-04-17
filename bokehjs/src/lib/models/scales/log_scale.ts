import {Scale} from "./scale"
import {Arrayable} from "core/types"

export namespace LogScale {
  export interface Attrs extends Scale.Attrs {}

  export interface Props extends Scale.Props {}
}

export interface LogScale extends LogScale.Attrs {}

export class LogScale extends Scale {

  properties: LogScale.Props

  constructor(attrs?: Partial<LogScale.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LogScale"
  }

  compute(x: number): number {
    const [factor, offset, inter_factor, inter_offset] = this._compute_state()

    let value: number
    if (inter_factor == 0)
      value = 0
    else {
      const _x = (Math.log(x) - inter_offset) / inter_factor
      if (isFinite(_x))
        value = _x*factor + offset
      else
        value = NaN
    }

    return value
  }

  v_compute(xs: Arrayable<number>): Arrayable<number> {
    const [factor, offset, inter_factor, inter_offset] = this._compute_state()

    const result = new Float64Array(xs.length)

    if (inter_factor == 0) {
      for (let i = 0; i < xs.length; i++)
        result[i] = 0
    } else {
      for (let i = 0; i < xs.length; i++) {
        const _x = (Math.log(xs[i]) - inter_offset) / inter_factor
        let value: number
        if (isFinite(_x))
          value = _x*factor + offset
        else
          value = NaN
        result[i] = value
      }
    }

    return result
  }

  invert(xprime: number): number {
    const [factor, offset, inter_factor, inter_offset] = this._compute_state()
    const value = (xprime - offset) / factor
    return Math.exp(inter_factor*value + inter_offset)
  }

  v_invert(xprimes: Arrayable<number>): Arrayable<number> {
    const [factor, offset, inter_factor, inter_offset] = this._compute_state()
    const result = new Float64Array(xprimes.length)
    for (let i = 0; i < xprimes.length; i++) {
      const value = (xprimes[i] - offset) / factor
      result[i] = Math.exp(inter_factor*value + inter_offset)
    }
    return result
  }

  protected _get_safe_factor(orig_start: number, orig_end: number): [number, number] {
    let start = orig_start < 0 ? 0 : orig_start
    let end = orig_end < 0 ? 0 :  orig_end

    if (start == end) {
      if (start == 0)
        [start, end] = [1, 10]
      else {
        const log_val = Math.log(start) / Math.log(10)
        start = Math.pow(10, Math.floor(log_val))

        if (Math.ceil(log_val) != Math.floor(log_val))
          end = Math.pow(10, Math.ceil(log_val))
        else
          end = Math.pow(10, Math.ceil(log_val) + 1)
      }
    }

    return [start, end]
  }

  protected _compute_state(): [number, number, number, number] {
    const source_start = this.source_range.start
    const source_end   = this.source_range.end
    const target_start = this.target_range.start
    const target_end   = this.target_range.end

    const screen_range = target_end - target_start
    const [start, end] = this._get_safe_factor(source_start, source_end)

    let inter_factor: number
    let inter_offset: number
    if (start == 0) {
      inter_factor = Math.log(end)
      inter_offset = 0
    } else {
      inter_factor = Math.log(end) - Math.log(start)
      inter_offset = Math.log(start)
    }

    const factor = screen_range
    const offset = target_start

    return [factor, offset, inter_factor, inter_offset]
  }
}

LogScale.initClass()
