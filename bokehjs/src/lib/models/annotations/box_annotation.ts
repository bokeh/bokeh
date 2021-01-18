import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits, RenderMode} from "core/enums"
import * as p from "core/properties"
import {BBox, CoordinateMapper} from "core/util/bbox"

export const EDGE_TOLERANCE = 2.5

export class BoxAnnotationView extends AnnotationView {
  model: BoxAnnotation
  visuals: BoxAnnotation.Visuals

  protected bbox: BBox = new BBox()

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
  }

  protected _render(): void {
    const {left, right, top, bottom} = this.model

    // don't render if *all* position are null
    if (left == null && right == null && top == null && bottom == null)
      return

    const {frame} = this.plot_view
    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    const _calc_dim = (dim: number | null, dim_units: SpatialUnits, scale: Scale, view: CoordinateMapper, frame_extrema: number): number => {
      let sdim
      if (dim != null) {
        if (this.model.screen)
          sdim = dim
        else {
          if (dim_units == 'data')
            sdim = scale.compute(dim)
          else
            sdim = view.compute(dim)
        }
      } else
        sdim = frame_extrema
      return sdim
    }

    this.bbox = new BBox({
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

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx)
      ctx.fill()
    }

    if (this.visuals.hatch.doit) {
      this.visuals.hatch.set_value(ctx)
      ctx.fill()
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx)
      ctx.stroke()
    }

    ctx.restore()
  }

  interactive_bbox(): BBox {
    const tolerance = this.model.line_width + EDGE_TOLERANCE
    return this.bbox.grow_by(tolerance)
  }

  interactive_hit(sx: number, sy: number): boolean {
    if (this.model.in_cursor == null)
      return false
    const bbox = this.interactive_bbox()
    return bbox.contains(sx, sy)
  }

  cursor(sx: number, sy: number): string | null {
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
    top_units: p.Property<SpatialUnits>
    bottom: p.Property<number | null>
    bottom_units: p.Property<SpatialUnits>
    left: p.Property<number | null>
    left_units: p.Property<SpatialUnits>
    right: p.Property<number | null>
    right_units: p.Property<SpatialUnits>
    screen: p.Property<boolean>
    ew_cursor: p.Property<string | null>
    ns_cursor: p.Property<string | null>
    in_cursor: p.Property<string | null>
    /** @deprecated */
    render_mode: p.Property<RenderMode>
  } & Mixins

  export type Mixins = mixins.LineScalar & mixins.FillScalar & mixins.HatchScalar

  export type Visuals = Annotation.Visuals & {line: visuals.LineScalar, fill: visuals.FillScalar, hatch: visuals.HatchScalar}
}

export interface BoxAnnotation extends BoxAnnotation.Attrs {}

export class BoxAnnotation extends Annotation {
  properties: BoxAnnotation.Props
  __view_type__: BoxAnnotationView

  constructor(attrs?: Partial<BoxAnnotation.Attrs>) {
    super(attrs)
  }

  static init_BoxAnnotation(): void {
    this.prototype.default_view = BoxAnnotationView

    this.mixins<BoxAnnotation.Mixins>([mixins.LineScalar, mixins.FillScalar, mixins.HatchScalar])

    this.define<BoxAnnotation.Props>(({Number, Nullable}) => ({
      top:          [ Nullable(Number), null ],
      top_units:    [ SpatialUnits, "data" ],
      bottom:       [ Nullable(Number), null ],
      bottom_units: [ SpatialUnits, "data" ],
      left:         [ Nullable(Number), null ],
      left_units:   [ SpatialUnits, "data" ],
      right:        [ Nullable(Number), null ],
      right_units:  [ SpatialUnits, "data" ],
      /** @deprecated */
      render_mode:  [ RenderMode, "canvas" ],
    }))

    this.internal<BoxAnnotation.Props>(({Boolean, String, Nullable}) => ({
      screen:    [ Boolean, false ],
      ew_cursor: [ Nullable(String), null ],
      ns_cursor: [ Nullable(String), null ],
      in_cursor: [ Nullable(String), null ],
    }))

    this.override<BoxAnnotation.Props>({
      fill_color: '#fff9ba',
      fill_alpha: 0.4,
      line_color: '#cccccc',
      line_alpha: 0.3,
    })
  }

  update({left, right, top, bottom}: {left: number | null, right: number | null, top: number | null, bottom: number | null}): void {
    this.setv({left, right, top, bottom, screen: true})
  }
}
