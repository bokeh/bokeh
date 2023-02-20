import {ReglWrapper} from "./regl_wrap"
import {SingleMarkerGL} from "./single_marker"
import {GLMarkerType} from "./types"
import type {LRTBView} from "../lrtb"

const {abs} = Math

export class LRTBGL extends SingleMarkerGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: LRTBView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "rect"
  }

  protected override _set_data(): void {
    const nmarkers = this.nvertices

    const centers_array = this._centers.get_sized_array(nmarkers*2)
    const widths_array = this._widths.get_sized_array(nmarkers)
    const heights_array = this._heights.get_sized_array(nmarkers)

    const {sleft, sright, stop, sbottom} = this.glyph
    const {missing_point} = SingleMarkerGL

    for (let i = 0; i < nmarkers; i++) {
      const l = sleft[i]
      const r = sright[i]
      const t = stop[i]
      const b = sbottom[i]

      if (isFinite(l + r + t + b)) {
        centers_array[2*i] = (l + r)/2
        centers_array[2*i+1] = (t + b)/2
        widths_array[i] = abs(r - l)
        heights_array[i] = abs(t - b)
      } else {
        centers_array[2*i] = missing_point
        centers_array[2*i+1] = missing_point
        widths_array[i] = missing_point
        heights_array[i] = missing_point
      }
    }

    this._centers.update()
    this._widths.update()
    this._heights.update()

    this._angles.set_from_scalar(0)

    const {top_left, top_right, bottom_right, bottom_left} = this.glyph.border_radius
    this._border_radius = [top_left, top_right, bottom_right, bottom_left]
  }

  protected override _set_once(): void {
    super._set_once()
    this._auxs.set_from_scalar(0)
  }
}
