import {Range} from "./range"
import * as p from "core/properties"

export namespace Range1d {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Range.Props & {
    start: p.Property<number>
    end: p.Property<number>
    reset_start: p.Property<number | null>
    reset_end: p.Property<number | null>
  }
}

export interface Range1d extends Range1d.Attrs {}

export class Range1d extends Range {
  properties: Range1d.Props

  constructor(attrs?: Partial<Range1d.Attrs>) {
    super(attrs)
  }

  static init_Range1d(): void {
    this.define<Range1d.Props>(({Number, Nullable}) => ({
      start:       [ Number, 0 ],
      end:         [ Number, 1 ],
      reset_start: [ Nullable(Number), null, {
        on_update(reset_start, self: Range1d) {
          self._reset_start = reset_start ?? self.start
        },
      }],
      reset_end: [ Nullable(Number), null, {
        on_update(reset_end, self: Range1d) {
          self._reset_end = reset_end ?? self.end
        },
      }],
    }))
  }

  protected _set_auto_bounds(): void {
    if (this.bounds == 'auto') {
      const min = Math.min(this._reset_start, this._reset_end)
      const max = Math.max(this._reset_start, this._reset_end)
      this.setv({bounds: [min, max]}, {silent: true})
    }
  }

  private _reset_start: number
  private _reset_end: number

  initialize(): void {
    super.initialize()
    this._set_auto_bounds()
  }

  get min(): number {
    return Math.min(this.start, this.end)
  }

  get max(): number {
    return Math.max(this.start, this.end)
  }

  reset(): void {
    this._set_auto_bounds()
    const {_reset_start, _reset_end} = this
    if (this.start != _reset_start || this.end != _reset_end)
      this.setv({start: _reset_start, end: _reset_end})
    else
      this.change.emit()
  }

  map(fn: (v: number) => number): Range1d {
    return new Range1d({start: fn(this.start), end: fn(this.end)})
  }

  widen(v: number): Range1d {
    let {start, end} = this
    if (this.is_reversed) {
      start += v
      end -= v
    } else {
      start -= v
      end += v
    }
    return new Range1d({start, end})
  }
}
