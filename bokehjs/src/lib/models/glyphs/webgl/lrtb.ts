import {MarkerVisuals} from "./base_marker"
import {Float32Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {SingleMarkerGL} from "./single_marker"
import {GLMarkerType} from "./types"
import type {BlockView} from "../block"
import type {HBarView} from "../hbar"
import type {QuadView} from "../quad"
import type {VBarView} from "../vbar"

type AnyLRTBView = BlockView | HBarView | QuadView | VBarView

export class LRTBGL extends SingleMarkerGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: AnyLRTBView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "rect"
  }

  protected override _get_visuals(): MarkerVisuals {
    return this.glyph.visuals
  }

  protected override _set_data(): void {
    const nmarkers = this.nvertices

    if (this._centers == null) {
      // Either all or none are set.
      this._centers = new Float32Buffer(this.regl_wrapper)
      this._widths = new Float32Buffer(this.regl_wrapper)
      this._heights = new Float32Buffer(this.regl_wrapper)

      this._angles = new Float32Buffer(this.regl_wrapper)
      this._angles.set_from_scalar(0)
    }

    const centers_array = this._centers.get_sized_array(nmarkers*2)
    const heights_array = this._heights!.get_sized_array(nmarkers)
    const widths_array = this._widths!.get_sized_array(nmarkers)
    for (let i = 0; i < nmarkers; i++) {
      const l = this.glyph.sleft[i]
      const r = this.glyph.sright[i]
      const t = this.glyph.stop[i]
      const b = this.glyph.sbottom[i]

      if (isFinite(l) && isFinite(r) && isFinite(t) && isFinite(b)) {
        centers_array[2*i] = (l+r)/2
        centers_array[2*i+1] = (t+b)/2
        heights_array[i] = Math.abs(t-b)
        widths_array[i] = Math.abs(r-l)
      } else {
        centers_array[2*i] = SingleMarkerGL.missing_point
        centers_array[2*i+1] = SingleMarkerGL.missing_point
        heights_array[i] = SingleMarkerGL.missing_point
        widths_array[i] = SingleMarkerGL.missing_point
      }
    }
    this._centers.update()
    this._heights!.update()
    this._widths!.update()

    const {top_left, top_right, bottom_right, bottom_left} = this.glyph.border_radius
    this._border_radius = [top_left, top_right, bottom_right, bottom_left]
  }
}
