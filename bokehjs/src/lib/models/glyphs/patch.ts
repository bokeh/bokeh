import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {generic_area_scalar_legend} from "./utils"
import type {PointGeometry} from "core/geometry"
import type {FloatArray, Rect} from "core/types"
import type * as visuals from "core/visuals"
import type {Context2d} from "core/util/canvas"
import * as hittest from "core/hittest"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"
import {Selection} from "../selections/selection"
import type {PatchGL} from "./webgl/patch"

export interface PatchView extends Patch.Data {}

export class PatchView extends XYGlyphView {
  declare model: Patch
  declare visuals: Patch.Visuals

  /** @internal */
  declare glglyph?: PatchGL

  override async load_glglyph() {
    const {PatchGL} = await import("./webgl/patch")
    return PatchGL
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Patch.Data>): void {
    const {sx, sy} = {...this, ...data}

    let move = true
    ctx.beginPath()

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]

      if (!isFinite(sx_i + sy_i)) {
        ctx.closePath()
        move = true
      } else {
        if (move) {
          ctx.moveTo(sx_i, sy_i)
          move = false
        } else {
          ctx.lineTo(sx_i, sy_i)
        }
      }
    }

    ctx.closePath()

    this.visuals.fill.apply(ctx, "evenodd")
    this.visuals.hatch.apply(ctx, "evenodd")
    this.visuals.line.apply(ctx)
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, _index: number): void {
    generic_area_scalar_legend(this.visuals, ctx, bbox)
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const result = new Selection()
    const {sx, sy} = geometry

    // Collect NaN-separated sub-paths
    const sub_paths_sx: FloatArray[] = []
    const sub_paths_sy: FloatArray[] = []
    const n = this.sx.length
    let k = 0
    for (let j = 0; j <= n; j++) {
      if (j == n || isNaN(this.sx[j])) {
        if (j > k) {
          // Use subarray to create views (like patches.ts does)
          sub_paths_sx.push((this.sx as FloatArray).subarray(k, j))
          sub_paths_sy.push((this.sy as FloatArray).subarray(k, j))
        }
        k = j + 1
      }
    }

    if (sub_paths_sx.length == 0) {
      return result
    }

    // Use "evenodd" fill rule (matches Canvas2D rendering):
    // A point is inside the filled region if it's contained by an odd number of sub-paths.
    // This handles both holes (even count = outside) and disjoint polygons (each adds to count).
    let inside_count = 0
    for (let i = 0; i < sub_paths_sx.length; i++) {
      if (hittest.point_in_poly(sx, sy, sub_paths_sx[i], sub_paths_sy[i])) {
        inside_count++
      }
    }

    // Odd count = inside filled region, Even count = inside hole or outside
    if (inside_count % 2 === 1) {
      result.add_to_selected_glyphs(this.model)
      result.view = this
    }

    return result
  }
}

export namespace Patch {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & Mixins

  export type Mixins = mixins.LineScalar & mixins.FillScalar & mixins.HatchScalar

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineScalar, fill: visuals.FillScalar, hatch: visuals.HatchScalar}

  export type Data = p.GlyphDataOf<Props>
}

export interface Patch extends Patch.Attrs {}

export class Patch extends XYGlyph {
  declare properties: Patch.Props
  declare __view_type__: PatchView

  constructor(attrs?: Partial<Patch.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PatchView

    this.mixins<Patch.Mixins>([mixins.LineScalar, mixins.FillScalar, mixins.HatchScalar])
  }
}
