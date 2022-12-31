import {MarkerVisuals} from "./base_marker"
import {Float32Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {SingleMarkerGL} from "./single_marker"
import {GLMarkerType} from "./types"
import type {RectView} from "../rect"

export class RectGL extends SingleMarkerGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: RectView) {
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
    }

    const centers_array = this._centers.get_sized_array(nmarkers*2)
    for (let i = 0; i < nmarkers; i++) {
      if (isFinite(this.glyph.sx[i]) && isFinite(this.glyph.sy[i])) {
        centers_array[2*i  ] = this.glyph.sx[i]
        centers_array[2*i+1] = this.glyph.sy[i]
      } else {
        centers_array[2*i  ] = SingleMarkerGL.missing_point
        centers_array[2*i+1] = SingleMarkerGL.missing_point
      }
    }
    this._centers.update()

    this._widths!.set_from_array(this.glyph.sw)
    this._heights!.set_from_array(this.glyph.sh)
    this._angles!.set_from_prop(this.glyph.angle)

    const {top_left, top_right, bottom_right, bottom_left} = this.glyph.border_radius
    this._border_radius = [top_left, top_right, bottom_right, bottom_left]
  }
}
