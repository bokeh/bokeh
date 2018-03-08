import {Range} from "./range"
import * as p from "core/properties"

export namespace Range1d {
  export interface Attrs extends Range.Attrs {
    start: number
    end: number
    bounds: [number, number] | "auto"
    min_interval: number
    max_interval: number
  }
}

export interface Range1d extends Range1d.Attrs {}

export class Range1d extends Range {

  constructor(attrs?: Partial<Range1d.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Range1d"

    this.define({
      start:  [ p.Number, 0 ],
      end:    [ p.Number, 1 ],
      bounds: [ p.Any       ], // TODO (bev)
      min_interval: [ p.Any ],
      max_interval: [ p.Any ],
    })
  }

  protected _initial_start: number
  protected _initial_end: number

  protected _set_auto_bounds(): void {
    if (this.bounds == 'auto') {
      const min = Math.min(this._initial_start, this._initial_end)
      const max = Math.max(this._initial_start, this._initial_end)
      this.setv({bounds: [min, max]}, {silent: true})
    }
  }

  initialize(): void {
    super.initialize()

    this._initial_start = this.start
    this._initial_end = this.end

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
    if (this.start != this._initial_start || this.end != this._initial_end)
      this.setv({start: this._initial_start, end: this._initial_end})
    else
      this.change.emit()
  }
}

Range1d.initClass()
