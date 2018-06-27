import {Range} from "./range"
import * as p from "core/properties"

export namespace Range1d {
  export interface Attrs extends Range.Attrs {
    start: number
    end: number
    reset_start: number
    reset_end: number
  }

  export interface Props extends Range.Props {}
}

export interface Range1d extends Range1d.Attrs {}

export class Range1d extends Range {

  properties: Range1d.Props

  constructor(attrs?: Partial<Range1d.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Range1d"

    this.define({
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
