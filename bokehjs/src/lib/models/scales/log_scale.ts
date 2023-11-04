import {ContinuousScale} from "./continuous_scale"
import type * as p from "core/properties"

export namespace LogScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousScale.Props
}

export interface LogScale extends LogScale.Attrs {}

export class LogScale extends ContinuousScale {
  declare properties: LogScale.Props

  constructor(attrs?: Partial<LogScale.Attrs>) {
    super(attrs)
  }

  get s_compute(): (x: number) => number {
    const [factor, offset, inter_factor, inter_offset] = this._compute_state()
    return (x) => {
      if (inter_factor == 0) {
        return 0
      } else {
        const _x = (Math.log(x) - inter_offset) / inter_factor
        return isFinite(_x) ? _x*factor + offset : NaN
      }
    }
  }

  get s_invert(): (x: number) => number {
    const [factor, offset, inter_factor, inter_offset] = this._compute_state()
    return (xprime) => {
      const value = (xprime - offset) / factor
      return Math.exp(inter_factor*value + inter_offset)
    }
  }

  protected _get_safe_factor(orig_start: number, orig_end: number): [number, number] {
    let start = orig_start < 0 ? 0 : orig_start
    let end = orig_end < 0 ? 0 : orig_end

    if (start == end) {
      if (start == 0) {
        [start, end] = [1, 10]
      } else {
        const log_val = Math.log10(start)
        start = 10**Math.floor(log_val)

        if (Math.ceil(log_val) != Math.floor(log_val)) {
          end = 10**Math.ceil(log_val)
        } else {
          end = 10**(Math.ceil(log_val) + 1)
        }
      }
    }

    return [start, end]
  }

  /*protected*/ _compute_state(): [number, number, number, number] {
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
      inter_factor = Math.log(end / start)
      inter_offset = Math.log(start)
    }

    const factor = screen_range
    const offset = target_start

    return [factor, offset, inter_factor, inter_offset]
  }
}
