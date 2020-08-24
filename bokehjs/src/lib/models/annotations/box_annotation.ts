import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import {Signal0} from "core/signaling"
import * as mixins from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import {SpatialUnits, RenderMode} from "core/enums"
import * as p from "core/properties"
import {BBox, CoordinateMapper} from "core/util/bbox"

export const EDGE_TOLERANCE = 2.5

export class BoxAnnotationView extends AnnotationView {
  model: BoxAnnotation
  visuals: BoxAnnotation.Visuals

  private sleft: number
  private sright: number
  private sbottom: number
  private stop: number

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.plot_view.request_paint(this))
    this.connect(this.model.data_update, () => this.plot_view.request_paint(this))
  }

  protected _render(): void {
    // don't render if *all* position are null
    if (this.model.left == null && this.model.right == null && this.model.top == null && this.model.bottom == null) {
      return
    }

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

    this.sleft   = _calc_dim(this.model.left,   this.model.left_units,   xscale, frame.xview, frame.bbox.left)
    this.sright  = _calc_dim(this.model.right,  this.model.right_units,  xscale, frame.xview, frame.bbox.right)
    this.stop    = _calc_dim(this.model.top,    this.model.top_units,    yscale, frame.yview, frame.bbox.top)
    this.sbottom = _calc_dim(this.model.bottom, this.model.bottom_units, yscale, frame.yview, frame.bbox.bottom)

    this._paint_box(this.sleft, this.sright, this.sbottom, this.stop)
  }

  protected _paint_box(sleft: number, sright: number, sbottom: number, stop: number): void {
    const {ctx} = this.layer
    ctx.save()

    ctx.beginPath()
    ctx.rect(sleft, stop, sright-sleft, sbottom-stop)

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx)
      ctx.fill()
    }
    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx)
      ctx.stroke()
    }
    ctx.restore()
  }

  interactive_bbox(): BBox {
    const tol = this.model.properties.line_width.value() + EDGE_TOLERANCE
    return new BBox({
      x0: this.sleft-tol,
      y0: this.stop-tol,
      x1: this.sright+tol,
      y1: this.sbottom+tol,
    })
  }

  interactive_hit(sx: number, sy: number): boolean {
    if (this.model.in_cursor == null)
      return false
    const bbox = this.interactive_bbox()
    return bbox.contains(sx, sy)
  }

  cursor(sx: number, sy: number): string | null {
    const tol = 3
    if (Math.abs(sx-this.sleft) < tol || Math.abs(sx-this.sright) < tol)
      return this.model.ew_cursor
    else if (Math.abs(sy-this.sbottom) < tol || Math.abs(sy-this.stop) < tol)
      return this.model.ns_cursor
    else if (sx > this.sleft && sx < this.sright && sy > this.stop && sy < this.sbottom)
      return this.model.in_cursor
    else
      return null
  }
}

export namespace BoxAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    render_mode: p.Property<RenderMode>
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
  } & Mixins

  export type Mixins = mixins.Line/*Scalar*/ & mixins.Fill/*Scalar*/

  export type Visuals = Annotation.Visuals & {line: Line, fill: Fill}
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

    this.mixins<BoxAnnotation.Mixins>([mixins.Line/*Scalar*/, mixins.Fill/*Scalar*/])

    this.define<BoxAnnotation.Props>({
      render_mode:  [ p.RenderMode,   'canvas'  ],
      top:          [ p.Number,       null      ],
      top_units:    [ p.SpatialUnits, 'data'    ],
      bottom:       [ p.Number,       null      ],
      bottom_units: [ p.SpatialUnits, 'data'    ],
      left:         [ p.Number,       null      ],
      left_units:   [ p.SpatialUnits, 'data'    ],
      right:        [ p.Number,       null      ],
      right_units:  [ p.SpatialUnits, 'data'    ],
    })

    this.internal({
      screen:    [ p.Boolean, false ],
      ew_cursor: [ p.String,  null  ],
      ns_cursor: [ p.String,  null  ],
      in_cursor: [ p.String,  null  ],
    })

    this.override({
      fill_color: '#fff9ba',
      fill_alpha: 0.4,
      line_color: '#cccccc',
      line_alpha: 0.3,
    })
  }

  data_update: Signal0<this>

  initialize(): void {
    super.initialize()
    this.data_update = new Signal0(this, "data_update")
  }

  update({left, right, top, bottom}: {left: number | null, right: number | null, top: number | null, bottom: number | null}): void {
    this.setv({left, right, top, bottom, screen: true}, {silent: true})
    this.data_update.emit()
  }
}
