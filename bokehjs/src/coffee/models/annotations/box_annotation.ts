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

export class BoxAnnotationView extends AnnotationView {
  model: BoxAnnotation
  visuals: BoxAnnotation.Visuals

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

    const sleft   = _calc_dim(this.model.left,   this.model.left_units,   xscale, frame.xview, frame._left.value)
    const sright  = _calc_dim(this.model.right,  this.model.right_units,  xscale, frame.xview, frame._right.value)
    const stop    = _calc_dim(this.model.top,    this.model.top_units,    yscale, frame.yview, frame._top.value)
    const sbottom = _calc_dim(this.model.bottom, this.model.bottom_units, yscale, frame.yview, frame._bottom.value)

    const draw = this.model.render_mode == 'css' ? this._css_box.bind(this) : this._canvas_box.bind(this)
    draw(sleft, sright, sbottom, stop)
  }

  protected _css_box(sleft: number, sright: number, sbottom: number, stop: number): void {
    const sw = Math.abs(sright - sleft)
    const sh = Math.abs(sbottom - stop)

    this.el.style.left = `${sleft}px`
    this.el.style.width = `${sw}px`
    this.el.style.top = `${stop}px`
    this.el.style.height = `${sh}px`
    this.el.style.borderWidth = `${this.model.properties.line_width.value()}px`
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
      screen: [ p.Boolean, false ],
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
