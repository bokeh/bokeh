import {Range} from "./range"
import * as p from "core/properties"

export namespace Range1d {
  export interface Attrs extends Range.Attrs {
    start: number
    end: number
    initial_start: number
    initial_end: number
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
      initial_start:  [ p.Number ],
      initial_end:    [ p.Number ],
    })
  }

  protected _set_auto_bounds(): void {
    if (this.bounds == 'auto') {
      const min = Math.min(this.initial_start, this.initial_end)
      const max = Math.max(this.initial_start, this.initial_end)
      this.setv({bounds: [min, max]}, {silent: true})
    }
  }

  initialize(): void {
    super.initialize()
    if (this.initial_start == null) {
      this.initial_start = this.start
    }
    if (this.initial_end == null) {
      this.initial_end = this.end
    }
    this._set_auto_bounds()
  }

  get min(): number {
    return Math.min(this.start, this.end)
  }

  get max(): number {
    return Math.max(this.start, this.end)
  }

  get is_reversed(): boolean {
    return this.start > this.end
  }

  reset(): void {
    this._set_auto_bounds()
    if (this.start != this.initial_start || this.end != this.initial_end)
      this.setv({start: this.initial_start, end: this.initial_end})
    else
      this.change.emit()
  }
}

Range1d.initClass()
