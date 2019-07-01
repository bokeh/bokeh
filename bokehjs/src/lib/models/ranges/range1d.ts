import {Range} from "./range"
import * as p from "core/properties"

export namespace Range1d {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Range.Props & {
    start: p.Property<number>
    end: p.Property<number>
    reset_start: p.Property<number>
    reset_end: p.Property<number>
  }
}

export interface Range1d extends Range1d.Attrs {}

export class Range1d extends Range {
  properties: Range1d.Props

  constructor(attrs?: Partial<Range1d.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.define<Range1d.Props>({
      start:  [ p.Number, 0 ],
      end:    [ p.Number, 1 ],
      reset_start:  [ p.Number ],
      reset_end:    [ p.Number ],
    })
  }

  protected _set_auto_bounds(): void {
    if (this.bounds == 'auto') {
      const min = Math.min(this.reset_start, this.reset_end)
      const max = Math.max(this.reset_start, this.reset_end)
      this.setv({bounds: [min, max]}, {silent: true})
    }
  }

  initialize(): void {
    super.initialize()
    if (this.reset_start == null) {
      this.reset_start = this.start
    }
    if (this.reset_end == null) {
      this.reset_end = this.end
    }
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
    if (this.start != this.reset_start || this.end != this.reset_end)
      this.setv({start: this.reset_start, end: this.reset_end})
    else
      this.change.emit()
  }
}
Range1d.initClass()
