import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {CoordinateUnits} from "core/enums"
import * as p from "core/properties"
import {BBox, LRTB, CoordinateMapper} from "core/util/bbox"

export const EDGE_TOLERANCE = 2.5

export class BoxAnnotationView extends AnnotationView {
  declare model: BoxAnnotation
  declare visuals: BoxAnnotation.Visuals

  override bbox: BBox = new BBox()

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
  }

  protected _render(): void {
    const {left, right, top, bottom} = this.model

    const {frame} = this.plot_view
    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    const _calc_dim = (dim: number | null, dim_units: CoordinateUnits, scale: Scale, view: CoordinateMapper, frame_extrema: number): number => {
      if (dim == null)
        return frame_extrema
      else {
        switch (dim_units) {
          case "canvas":
            return dim
          case "screen":
            return view.compute(dim)
          case "data":
            return scale.compute(dim)
        }
      }
    }

    this.bbox = BBox.from_lrtb({
      left:   _calc_dim(left,   this.model.left_units,   xscale, frame.bbox.xview, frame.bbox.left),
      right:  _calc_dim(right,  this.model.right_units,  xscale, frame.bbox.xview, frame.bbox.right),
      top:    _calc_dim(top,    this.model.top_units,    yscale, frame.bbox.yview, frame.bbox.top),
      bottom: _calc_dim(bottom, this.model.bottom_units, yscale, frame.bbox.yview, frame.bbox.bottom),
    })

    this._paint_box()
  }

  protected _paint_box(): void {
    const {ctx} = this.layer
    ctx.save()

    const {left, top, width, height} = this.bbox
    ctx.beginPath()
    ctx.rect(left, top, width, height)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)

    ctx.restore()
  }

  interactive_bbox(): BBox {
    const tolerance = this.model.line_width + EDGE_TOLERANCE
    return this.bbox.grow_by(tolerance)
  }

  override interactive_hit(sx: number, sy: number): boolean {
    if (this.model.in_cursor == null)
      return false
    const bbox = this.interactive_bbox()
    return bbox.contains(sx, sy)
  }

  override cursor(sx: number, sy: number): string | null {
    const tol = 3

    const {left, right, bottom, top} = this.bbox
    if (Math.abs(sx-left) < tol || Math.abs(sx-right) < tol)
      return this.model.ew_cursor
    else if (Math.abs(sy-bottom) < tol || Math.abs(sy-top) < tol)
      return this.model.ns_cursor
    else if (this.bbox.contains(sx, sy))
      return this.model.in_cursor
    else
      return null
  }
}

export namespace BoxAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    top: p.Property<number | null>
    bottom: p.Property<number | null>
    left: p.Property<number | null>
    right: p.Property<number | null>

    top_units: p.Property<CoordinateUnits>
    bottom_units: p.Property<CoordinateUnits>
    left_units: p.Property<CoordinateUnits>
    right_units: p.Property<CoordinateUnits>

    ew_cursor: p.Property<string | null>
    ns_cursor: p.Property<string | null>
    in_cursor: p.Property<string | null>
  } & Mixins

  export type Mixins = mixins.Line & mixins.Fill & mixins.Hatch

  export type Visuals = Annotation.Visuals & {line: visuals.Line, fill: visuals.Fill, hatch: visuals.Hatch}
}

export interface BoxAnnotation extends BoxAnnotation.Attrs {}

export class BoxAnnotation extends Annotation {
  declare properties: BoxAnnotation.Props
  declare __view_type__: BoxAnnotationView

  constructor(attrs?: Partial<BoxAnnotation.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BoxAnnotationView

    this.mixins<BoxAnnotation.Mixins>([mixins.Line, mixins.Fill, mixins.Hatch])

    this.define<BoxAnnotation.Props>(({Number, Nullable}) => ({
      top:          [ Nullable(Number), null ],
      bottom:       [ Nullable(Number), null ],
      left:         [ Nullable(Number), null ],
      right:        [ Nullable(Number), null ],

      top_units:    [ CoordinateUnits, "data" ],
      bottom_units: [ CoordinateUnits, "data" ],
      left_units:   [ CoordinateUnits, "data" ],
      right_units:  [ CoordinateUnits, "data" ],
    }))

    this.internal<BoxAnnotation.Props>(({String, Nullable}) => ({
      ew_cursor: [ Nullable(String), null ],
      ns_cursor: [ Nullable(String), null ],
      in_cursor: [ Nullable(String), null ],
    }))

    this.override<BoxAnnotation.Props>({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
    })
  }

  update({left, right, top, bottom}: LRTB): void {
    this.setv({left, right, top, bottom, visible: true})
  }

  clear(): void {
    this.visible = false
  }
}
