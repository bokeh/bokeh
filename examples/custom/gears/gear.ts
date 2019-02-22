import {XYGlyph, XYGlyphView, XYGlyphData} from "models/glyphs/xy_glyph"
import {generic_area_legend} from "models/glyphs/utils"
import {isString} from "core/util/types"
import {Context2d} from "core/util/canvas"
import {Arrayable, Area} from "core/types"
import {LineVector, FillVector} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import * as p from "core/properties"

import {Draw, gear_tooth, internal_gear_tooth}  from "./gear_utils"
import {arc_to_bezier} from "./bezier"

export interface GearData extends XYGlyphData {
  _angle: Arrayable<number>
  _module: Arrayable<number>
  _pressure_angle: Arrayable<number>
  _shaft_size: Arrayable<number>
  _teeth: Arrayable<number>
  _internal: Arrayable<boolean>

  smodule: Arrayable<number>
}

export interface GearView extends GearData {}

export class GearView extends XYGlyphView {
  model: Gear
  visuals: Gear.Visuals

  _map_data(): void {
    this.smodule = this.sdist(this.renderer.xscale, this._x, this._module, 'edge')
  }

  _render(ctx: Context2d, indices: number[],
          {sx, sy, smodule, _angle, _teeth, _pressure_angle, _shaft_size, _internal}: GearData): void {
    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + _angle[i] + smodule[i] + _teeth[i] + _pressure_angle[i] + _shaft_size[i]))
        continue

      const fn = _internal[i] ? internal_gear_tooth : gear_tooth
      const seq0 = fn(smodule[i], _teeth[i], _pressure_angle[i])
      const [, x, y, ...seq] = seq0

      ctx.save()
      ctx.translate(sx[i], sy[i])
      ctx.rotate(_angle[i])

      ctx.beginPath()

      const rot = 2*Math.PI/_teeth[i]
      ctx.moveTo(x as number, y as number)

      for (let j = 0; j < _teeth[i]; j++) {
        this._render_seq(ctx, seq)
        ctx.rotate(rot)
      }

      ctx.closePath()

      const pitch_radius = smodule[i]*_teeth[i]/2
      if (_internal[i]) {
        const rim_radius = pitch_radius + 2.75*smodule[i]
        ctx.moveTo(rim_radius, 0)
        ctx.arc(0, 0, rim_radius, 0, 2*Math.PI, true)
      } else if (_shaft_size[i] > 0) {
        const shaft_radius = pitch_radius*_shaft_size[i]
        ctx.moveTo(shaft_radius, 0)
        ctx.arc(0, 0, shaft_radius, 0, 2*Math.PI, true)
      }

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i)
        ctx.fill()
      }

      if (this.visuals.line.doit) {
        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
      }

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

  draw_legend_for_index(ctx: Context2d, bbox: Area, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Gear {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & LineVector & FillVector & {
    angle:          p.AngleSpec
    module:         p.NumberSpec
    pressure_angle: p.NumberSpec
    shaft_size:     p.NumberSpec
    teeth:          p.NumberSpec
    internal:       p.BooleanSpec
  }

  export type Visuals = XYGlyph.Visuals & {line: Line, fill: Fill}
}

export interface Gear extends Gear.Attrs {}

export class Gear extends XYGlyph {
  properties: Gear.Props

  constructor(attrs?: Partial<Gear.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Gear'
    this.prototype.default_view = GearView

    this.mixins(['line', 'fill'])
    this.define<Gear.Props>({
      angle:          [ p.AngleSpec,   0     ],
      module:         [ p.NumberSpec         ],
      pressure_angle: [ p.NumberSpec,  20    ], // TODO: units: deg
      shaft_size:     [ p.NumberSpec,  0.3   ],
      teeth:          [ p.NumberSpec         ],
      internal:       [ p.BooleanSpec, false ],
    })
  }
}
Gear.initClass()
