import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {inherit} from "./glyph"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Rect, Indices} from "core/types"
import {to_screen} from "core/types"
import {RadiusDimension} from "core/enums"
import * as p from "core/properties"
import type {SpatialIndex} from "core/util/spatial"
import {elementwise} from "core/util/array"
import type {Context2d} from "core/util/canvas"
import type {Range1d} from "../ranges/range1d"

export interface RadialGlyphView extends RadialGlyph.Data {}

export abstract class RadialGlyphView extends XYGlyphView {
  declare model: RadialGlyph
  declare visuals: RadialGlyph.Visuals

  protected override _index_data(index: SpatialIndex): void {
    const {x, y, radius, data_size} = this
    for (let i = 0; i < data_size; i++) {
      const x_i = x[i]
      const y_i = y[i]
      const r_i = radius.get(i)
      index.add_rect(x_i - r_i, y_i - r_i, x_i + r_i, y_i + r_i)
    }
  }

  protected override _map_data(): void {
    this._define_or_inherit_attr<RadialGlyph.Data>("sradius", () => {
      if (this.model.properties.radius.units == "data") {
        const sradius_x = () => this.sdist(this.renderer.xscale, this.x, this.radius)
        const sradius_y = () => this.sdist(this.renderer.yscale, this.y, this.radius)

        const {radius_dimension} = this.model
        switch (radius_dimension) {
          case "x": {
            return this.inherited_x && this.inherited_radius ? inherit : sradius_x()
          }
          case "y": {
            return this.inherited_y && this.inherited_radius ? inherit : sradius_y()
          }
          case "min":
          case "max": {
            if (this.inherited_x && this.inherited_y && this.inherited_radius) {
              return inherit
            } else {
              return elementwise(sradius_x(), sradius_y(), Math[radius_dimension])
            }
          }
        }
      } else {
        return this.inherited_sradius ? inherit : to_screen(this.radius)
      }
    })
  }

  protected override _mask_data(): Indices {
    const {frame} = this.renderer.plot_view

    const shr = frame.x_target
    const svr = frame.y_target

    let hr: Range1d
    let vr: Range1d
    if (this.model.properties.radius.units == "data") {
      hr = shr.map((x) => this.renderer.xscale.invert(x)).widen(this.max_radius)
      vr = svr.map((y) => this.renderer.yscale.invert(y)).widen(this.max_radius)
    } else {
      hr = shr.widen(this.max_radius).map((x) => this.renderer.xscale.invert(x))
      vr = svr.widen(this.max_radius).map((y) => this.renderer.yscale.invert(y))
    }

    return this.index.indices({
      x0: hr.start, x1: hr.end,
      y0: vr.start, y1: vr.end,
    })
  }

  override draw_legend_for_index(ctx: Context2d, {x0, y0, x1, y1}: Rect, index: number): void {
    // using objects like this is wonky, since the keys are coerced to strings, but it works
    const len = index + 1

    const sx: number[] = new Array(len)
    sx[index] = (x0 + x1)/2
    const sy: number[] = new Array(len)
    sy[index] = (y0 + y1)/2

    const sradius: number[] = new Array(len)
    sradius[index] = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0))*0.2

    this._paint(ctx, [index], {sx, sy, sradius})
  }
}

export namespace RadialGlyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    radius: p.DistanceSpec
    radius_dimension: p.Property<RadiusDimension>
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}

  export type Data = p.GlyphDataOf<Props>
}

export interface RadialGlyph extends RadialGlyph.Attrs {}

export class RadialGlyph extends XYGlyph {
  declare properties: RadialGlyph.Props
  declare __view_type__: RadialGlyphView

  constructor(attrs?: Partial<RadialGlyph.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<RadialGlyph.Mixins>([LineVector, FillVector, HatchVector])

    this.define<RadialGlyph.Props>(() => ({
      radius:           [ p.DistanceSpec, {field: "radius"} ],
      radius_dimension: [ RadiusDimension, "x" ],
    }))
  }
}
