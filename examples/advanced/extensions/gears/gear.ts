import {XYGlyph, XYGlyphView} from "@bokehjs/models/glyphs/xy_glyph"
import {generic_area_vector_legend} from "@bokehjs/models/glyphs/utils"
import {isString} from "@bokehjs/core/util/types"
import {Context2d} from "@bokehjs/core/util/canvas"
import type {Arrayable, Rect} from "@bokehjs/core/types"
import {LineVector, FillVector, HatchVector} from "@bokehjs/core/property_mixins"
import * as visuals from "@bokehjs/core/visuals"
import * as p from "@bokehjs/core/properties"

import {Draw, gear_tooth, internal_gear_tooth}  from "./gear_utils"
import {arc_to_bezier} from "./bezier"

export interface GearView extends Gear.Data {}

export class GearView extends XYGlyphView {
  declare model: Gear
  declare visuals: Gear.Visuals

  override _map_data(): void {
    this.smodule = this.sdist(this.renderer.xscale, this.x, this.module, "edge")
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Gear.Data>): void {
    const {sx, sy, smodule, angle, teeth, pressure_angle, shaft_size, internal} = {...this, ...data}

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const angle_i = angle.get(i)
      const smodule_i = smodule[i]
      const teeth_i = teeth.get(i)
      const pressure_angle_i = pressure_angle.get(i)
      const shaft_size_i = shaft_size.get(i)
      const internal_i = internal.get(i)

      if (isNaN(sx_i + sy_i + angle_i + smodule_i + teeth_i + pressure_angle_i + shaft_size_i))
        continue

      const fn = internal_i ? internal_gear_tooth : gear_tooth
      const seq0 = fn(smodule_i, teeth_i, pressure_angle_i)
      const [, x, y, ...seq] = seq0

      ctx.save()
      ctx.translate(sx_i, sy_i)
      ctx.rotate(angle_i)

      ctx.beginPath()

      const rot = 2*Math.PI/teeth_i
      ctx.moveTo(x as number, y as number)

      for (let j = 0; j < teeth_i; j++) {
        this._render_seq(ctx, seq)
        ctx.rotate(rot)
      }

      ctx.closePath()

      const pitch_radius = smodule_i*teeth_i/2
      if (internal_i) {
        const rim_radius = pitch_radius + 2.75*smodule_i
        ctx.moveTo(rim_radius, 0)
        ctx.arc(0, 0, rim_radius, 0, 2*Math.PI, true)
      } else if (shaft_size_i > 0) {
        const shaft_radius = pitch_radius*shaft_size_i
        ctx.moveTo(shaft_radius, 0)
        ctx.arc(0, 0, shaft_radius, 0, 2*Math.PI, true)
      }

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)
      this.visuals.line.apply(ctx, i)

      ctx.restore()
    }
  }

  _render_seq(ctx: Context2d, seq: (Draw | number)[]): void {
    let c: Draw = "M"
    let p = [0, 0]
    let i = 0

    while (i < seq.length) {
      if (isString(seq[i])) {
        c = seq[i] as Draw
        i += 1
      }

      switch (c) {
        case "M": {
          const [x, y] = seq.slice(i, i+2) as number[]
          ctx.moveTo(x, y)
          p = [x, y]
          i += 2
          break
        }
        case "L": {
          const [x, y] = seq.slice(i, i+2) as number[]
          ctx.lineTo(x, y)
          p = [x, y]
          i += 2
          break
        }
        case "C": {
          const [cx0, cy0, cx1, cy1, x, y] = seq.slice(i, i+6) as number[]
          ctx.bezierCurveTo(cx0, cy0, cx1, cy1, x, y)
          p = [x, y]
          i += 6
          break
        }
        case "Q": {
          const [cx0, cy0, x, y] = seq.slice(i, i+4) as number[]
          ctx.quadraticCurveTo(cx0, cy0, x, y)
          p = [x, y]
          i += 4
          break
        }
        case "A": {
          const [rx, ry, x_rotation, large_arc, sweep, x, y] = seq.slice(i, i+7) as number[]

          const [px, py] = p
          const segments = arc_to_bezier(px, py, rx, ry, -x_rotation, large_arc, 1 - sweep, x, y)

          for (const [cx0, cy0, cx1, cy1, x, y] of segments)
            ctx.bezierCurveTo(cx0, cy0, cx1, cy1, x, y)

          p = [x, y]
          i += 7
          break
        }
        default:
          throw new Error(`unexpected command: ${c}`)
      }
    }
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Gear {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    angle:          p.AngleSpec
    module:         p.NumberSpec
    pressure_angle: p.NumberSpec
    shaft_size:     p.NumberSpec
    teeth:          p.NumberSpec
    internal:       p.BooleanSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}

  export type Data = p.GlyphDataOf<Gear.Props> & {
    smodule: Arrayable<number>
  }
}

export interface Gear extends Gear.Attrs {}

export class Gear extends XYGlyph {
  declare properties: Gear.Props
  declare __view_type__: GearView

  constructor(attrs?: Partial<Gear.Attrs>) {
    super(attrs)
  }

  static override __module__ = "gears"

  static {
    this.prototype.default_view = GearView

    this.mixins<Gear.Mixins>([LineVector, FillVector, HatchVector])

    this.define<Gear.Props>(() => ({
      angle:          [ p.AngleSpec, 0 ],
      module:         [ p.NumberSpec ],
      pressure_angle: [ p.NumberSpec, 20 ], // TODO: units: deg
      shaft_size:     [ p.NumberSpec, 0.3 ],
      teeth:          [ p.NumberSpec ],
      internal:       [ p.BooleanSpec, false ],
    }))
  }
}
