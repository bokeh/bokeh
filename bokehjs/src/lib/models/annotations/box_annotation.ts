import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import {Signal0} from "core/signaling"
import {LineMixinScalar, FillMixinScalar} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import {SpatialUnits, RenderMode} from "core/enums"
import {Color} from "core/types"
import {show, hide} from "core/dom"
import * as p from "core/properties"
import {ViewTransform} from "core/layout/layout_canvas"
import {BBox} from "core/util/bbox"

export const EDGE_TOLERANCE = 2.5

export class BoxAnnotationView extends AnnotationView {
  model: BoxAnnotation
  visuals: BoxAnnotation.Visuals

  private sleft: number
  private sright: number
  private sbottom: number
  private stop: number

  initialize(options: any): void {
    super.initialize(options)
    this.plot_view.canvas_overlays.appendChild(this.el)
    this.el.classList.add("bk-shading")
    hide(this.el)
  }

  connect_signals(): void {
    super.connect_signals()
    // need to respond to either normal BB change events or silent
    // "data only updates" that tools might want to use
    if (this.model.render_mode == 'css') {
      // dispatch CSS update immediately
      this.connect(this.model.change, () => this.render())
      this.connect(this.model.data_update, () => this.render())
    } else {
      this.connect(this.model.change, () => this.plot_view.request_render())
      this.connect(this.model.data_update, () => this.plot_view.request_render())
    }
  }

  render(): void {
    if (!this.model.visible && this.model.render_mode == 'css')
      hide(this.el)

    if (!this.model.visible)
      return

    // don't render if *all* position are null
    if (this.model.left == null && this.model.right == null && this.model.top == null && this.model.bottom == null) {
      hide(this.el)
      return
    }

    const {frame} = this.plot_model
    const xscale = frame.xscales[this.model.x_range_name]
    const yscale = frame.yscales[this.model.y_range_name]

    const _calc_dim = (dim: number | null, dim_units: SpatialUnits, scale: Scale, view: ViewTransform, frame_extrema: number): number => {
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

    this.sleft   = _calc_dim(this.model.left,   this.model.left_units,   xscale, frame.xview, frame._left.value)
    this.sright  = _calc_dim(this.model.right,  this.model.right_units,  xscale, frame.xview, frame._right.value)
    this.stop    = _calc_dim(this.model.top,    this.model.top_units,    yscale, frame.yview, frame._top.value)
    this.sbottom = _calc_dim(this.model.bottom, this.model.bottom_units, yscale, frame.yview, frame._bottom.value)

    const draw = this.model.render_mode == 'css' ? this._css_box.bind(this) : this._canvas_box.bind(this)

    draw(this.sleft, this.sright, this.sbottom, this.stop)
  }

  protected _css_box(sleft: number, sright: number, sbottom: number, stop: number): void {
    const line_width = this.model.properties.line_width.value()
    const sw = Math.floor(sright - sleft) - line_width
    const sh = Math.floor(sbottom - stop) - line_width

    this.el.style.left = `${sleft}px`
    this.el.style.width = `${sw}px`
    this.el.style.top = `${stop}px`
    this.el.style.height = `${sh}px`
    this.el.style.borderWidth = `${line_width}px`
    this.el.style.borderColor = this.model.properties.line_color.value()
    this.el.style.backgroundColor = this.model.properties.fill_color.value()
    this.el.style.opacity = this.model.properties.fill_alpha.value()

    // try our best to honor line dashing in some way, if we can
    const ld = this.model.properties.line_dash.value().length < 2 ? "solid" : "dashed"
    this.el.style.borderStyle = ld

    show(this.el)
  }

  protected _canvas_box(sleft: number, sright: number, sbottom: number, stop: number): void {
    const {ctx} = this.plot_view.canvas_view
    ctx.save()

    ctx.beginPath()
    ctx.rect(sleft, stop, sright-sleft, sbottom-stop)

    this.visuals.fill.set_value(ctx)
    ctx.fill()

    this.visuals.line.set_value(ctx)
    ctx.stroke()

    ctx.restore()
  }

  interactive_bbox() : BBox {
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
  export interface Mixins extends LineMixinScalar, FillMixinScalar {}

  export interface Attrs extends Annotation.Attrs, Mixins {
    render_mode: RenderMode
    x_range_name: string
    y_range_name: string
    top: number | null
    top_units: SpatialUnits
    bottom: number | null
    bottom_units: SpatialUnits
    left: number | null
    left_units: SpatialUnits
    right: number | null
    right_units: SpatialUnits
    screen: boolean
    ew_cursor: string | null
    ns_cursor: string | null
    in_cursor: string | null
  }

  export interface Props extends Annotation.Props {
    render_mode: p.Property<RenderMode>
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
    top: p.Property<number | null>
    top_units: p.Property<SpatialUnits>
    bottom: p.Property<number | null>
    bottom_units: p.Property<SpatialUnits>
    left: p.Property<number | null>
    left_units: p.Property<SpatialUnits>
    right: p.Property<number | null>
    right_units: p.Property<SpatialUnits>

    line_color: p.Property<Color>
    line_width: p.Property<number>
    line_dash:  p.Property<number[]>
    fill_color: p.Property<Color>
    fill_alpha: p.Property<number>
  }

  export type Visuals = Annotation.Visuals & {line: Line, fill: Fill}
}

export interface BoxAnnotation extends BoxAnnotation.Attrs {}

export class BoxAnnotation extends Annotation {

  properties: BoxAnnotation.Props

  constructor(attrs?: Partial<BoxAnnotation.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'BoxAnnotation'
    this.prototype.default_view = BoxAnnotationView

    this.mixins(['line', 'fill'])

    this.define({
      render_mode:  [ p.RenderMode,   'canvas'  ],
      x_range_name: [ p.String,       'default' ],
      y_range_name: [ p.String,       'default' ],
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
BoxAnnotation.initClass()
