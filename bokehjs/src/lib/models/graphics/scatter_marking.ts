import {MarkerType} from "core/enums"
import * as p from "core/properties"
import {FillVector, HatchVector, LineVector} from "core/property_mixins"
import type {Context2d} from "core/util/canvas"
import {marker_funcs} from "../glyphs/defs"
import type {VectorVisuals} from "../glyphs/defs"
import {Marking, MarkingView} from "./marking"
import type {MarkingGeometry} from "./marking"

export class ScatterMarkingView extends MarkingView {
  declare model: ScatterMarking
  declare visuals: ScatterMarking.Visuals

  override hit_geometry(i: number): MarkingGeometry | null {
    const r = this.size.get(i)/2
    if (!isFinite(r) || r <= 0) {
      return null
    }
    return {type: "polygon", x: [-r, r, r, -r], y: [-r, -r, r, r]}
  }

  paint(ctx: Context2d, i: number): void {
    const r = this.size.get(i)/2
    if (isFinite(r) && r > 0) {
      ctx.beginPath()
      marker_funcs[this.model.marker](ctx, i, r, this.visuals)
    }
  }
}

export namespace ScatterMarking {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Marking.Props & {
    marker: p.Property<MarkerType>
    size: p.NumberSpec
  } & LineVector & FillVector & HatchVector
  export type Visuals = Marking.Visuals & VectorVisuals
}

export interface ScatterMarking extends ScatterMarking.Attrs {}

export class ScatterMarking extends Marking {
  declare properties: ScatterMarking.Props
  declare __view_type__: ScatterMarkingView

  static {
    this.prototype.default_view = ScatterMarkingView
    this.mixins<LineVector & FillVector & HatchVector>([LineVector, FillVector, HatchVector])
    this.define<ScatterMarking.Props>(() => ({
      marker: [ MarkerType, "circle" ],
      size: [ p.NumberSpec, 8 ],
    }))
  }
}
