import {Transform} from "./base"
import {MarkerVisuals} from "./base_marker"
import {Float32Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {SingleMarkerGL} from "./single_marker"
import type {HexTileView} from "../hex_tile"

export class HexTileGL extends SingleMarkerGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: HexTileView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: HexTileView, transform: Transform): void {
    this._draw_impl(indices, transform, main_glyph.glglyph!, "hex")
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

    if (this.glyph.model.orientation == "pointytop") {
      this._angles!.set_from_scalar(0.5*Math.PI)
      this._widths!.set_from_scalar(this.glyph.svy[0]*2)
      this._heights!.set_from_scalar(this.glyph.svx[4]*4/Math.sqrt(3))
    } else {
      this._angles!.set_from_scalar(0)
      this._widths!.set_from_scalar(this.glyph.svx[0]*2)
      this._heights!.set_from_scalar(this.glyph.svy[4]*4/Math.sqrt(3))
    }
  }
}
