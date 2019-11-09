import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import {LineScalar} from "core/property_mixins"
import {Line} from "core/visuals"
import {SpatialUnits, RenderMode, Dimension} from "core/enums"
import {display, undisplay} from "core/dom"
import * as p from "core/properties"
import {CoordinateTransform} from "core/util/bbox"

export class SpanView extends AnnotationView {
  model: Span
  visuals: Span.Visuals

  initialize(): void {
    super.initialize()
    this.plot_view.canvas_view.add_overlay(this.el)
    this.el.style.position = "absolute"
    undisplay(this.el)
  }

  connect_signals(): void {
    super.connect_signals()
    if (this.model.for_hover)
      this.connect(this.model.properties.computed_location.change, () => this._draw_span())
    else {
      if (this.model.render_mode == 'canvas') {
        this.connect(this.model.change, () => this.plot_view.request_render())
        this.connect(this.model.properties.location.change, () => this.plot_view.request_render())
      } else {
        this.connect(this.model.change, () => this.render())
        this.connect(this.model.properties.location.change, () => this._draw_span())
      }
    }
  }

  render(): void {
    if (!this.model.visible && this.model.render_mode == 'css')
      undisplay(this.el)

    if (!this.model.visible)
      return

    this._draw_span()
  }

  protected _draw_span(): void {
    const loc = this.model.for_hover ? this.model.computed_location : this.model.location
    if (loc == null) {
      undisplay(this.el)
      return
    }

    const {frame} = this.plot_view

    const xscale = frame.xscales[this.model.x_range_name]
    const yscale = frame.yscales[this.model.y_range_name]

    const _calc_dim = (scale: Scale, view: CoordinateTransform): number => {
      if (this.model.for_hover)
        return this.model.computed_location!
      else {
        if (this.model.location_units == 'data')
          return scale.compute(loc)
        else
          return view.compute(loc)
      }
    }

    let height: number, sleft: number, stop: number, width: number
    if (this.model.dimension == 'width') {
      stop = _calc_dim(yscale, frame.yview)
      sleft = frame._left.value
      width = frame._width.value
      height = this.model.properties.line_width.value()
    } else {
      stop = frame._top.value
      sleft = _calc_dim(xscale, frame.xview)
      width = this.model.properties.line_width.value()
      height = frame._height.value
    }

    if (this.model.render_mode == "css") {
      this.el.style.top = `${stop}px`
      this.el.style.left = `${sleft}px`
      this.el.style.width = `${width}px`
      this.el.style.height = `${height}px`
      this.el.style.backgroundColor = this.model.properties.line_color.value()
      this.el.style.opacity = this.model.properties.line_alpha.value()
      display(this.el)
    } else if (this.model.render_mode == "canvas") {
      const {ctx} = this.plot_view.canvas_view
      ctx.save()

      ctx.beginPath()
      this.visuals.line.set_value(ctx)
      ctx.moveTo(sleft, stop)
      if (this.model.dimension == "width") {
        ctx.lineTo(sleft + width, stop)
      } else {
        ctx.lineTo(sleft, stop + height)
      }
      ctx.stroke()

      ctx.restore()
    }
  }
}

export namespace Span {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & LineScalar & {
    render_mode: p.Property<RenderMode>
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
    location: p.Property<number | null>
    location_units: p.Property<SpatialUnits>
    dimension: p.Property<Dimension>
    for_hover: p.Property<boolean>
    computed_location: p.Property<number | null>
  }

  export type Visuals = Annotation.Visuals & {line: Line}
}

export interface Span extends Span.Attrs {}

export class Span extends Annotation {
  properties: Span.Props

  constructor(attrs?: Partial<Span.Attrs>) {
    super(attrs)
  }

  static init_Span(): void {
    this.prototype.default_view = SpanView

    this.mixins(['line'])

    this.define<Span.Props>({
      render_mode:    [ p.RenderMode,   'canvas'  ],
      x_range_name:   [ p.String,       'default' ],
      y_range_name:   [ p.String,       'default' ],
      location:       [ p.Number,       null      ],
      location_units: [ p.SpatialUnits, 'data'    ],
      dimension:      [ p.Dimension,    'width'   ],
    })

    this.override({
      line_color: 'black',
    })

    this.internal({
      for_hover: [ p.Boolean, false ],
      computed_location: [ p.Number, null ], // absolute screen coordinate
    })
  }
}
