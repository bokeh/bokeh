import { Annotation, AnnotationView } from "./annotation"
import { ColumnarDataSource } from "../sources/columnar_data_source"
import { ColumnDataSource } from "../sources/column_data_source"
import { Scale } from "../scales/scale"
import { LineScalar } from "core/property_mixins"
import { Line } from "core/visuals"
import { SpatialUnits, RenderMode, Dimension } from "core/enums"
import { display, undisplay, div } from "core/dom"
import * as p from "core/properties"
import { CoordinateTransform } from "core/util/bbox"
import { Arrayable } from "core/types"
import { bk_annotation_child } from "styles/annotations"

export class SpanSetView extends AnnotationView {
  model: SpanSet
  visuals: SpanSet.Visuals

  protected _location: Arrayable<number>

  initialize(): void {
    super.initialize()

    this.set_data(this.model.source)

    this.plot_view.canvas_view.add_overlay(this.el)
    this.el.style.position = "absolute"
    undisplay(this.el)

    if (this.model.render_mode == 'css') {
      for (let i = 0, end = this._location.length; i < end; i++) {
        const el = div({ class: bk_annotation_child })
        this.el.appendChild(el)
      }
    }
  }

  connect_signals(): void {
    super.connect_signals()
    if (this.model.render_mode == 'css') {
      // dispatch CSS update immediately
      this.connect(this.model.change, () => {
        this.set_data(this.model.source)
        this.render()
      })
      this.connect(this.model.source.streaming, () => {
        this.set_data(this.model.source)
        this.render()
      })
      this.connect(this.model.source.patching, () => {
        this.set_data(this.model.source)
        this.render()
      })
      this.connect(this.model.source.change, () => {
        this.set_data(this.model.source)
        this.render()
      })
    } else {
      this.connect(this.model.change, () => {
        this.set_data(this.model.source)
        this.plot_view.request_render()
      })
      this.connect(this.model.source.streaming, () => {
        this.set_data(this.model.source)
        this.plot_view.request_render()
      })
      this.connect(this.model.source.patching, () => {
        this.set_data(this.model.source)
        this.plot_view.request_render()
      })
      this.connect(this.model.source.change, () => {
        this.set_data(this.model.source)
        this.plot_view.request_render()
      })
    }
  }

  set_data(source: ColumnarDataSource): void {
    super.set_data(source)
    this.visuals.warm_cache(source)
  }

  render(): void {
    if (this.model.render_mode == 'css') {
      if (this.model.visible)
        display(this.el)
      else
        undisplay(this.el)
    }

    if (!this.model.visible)
      return

    for (let i = 0, end = this._location.length; i < end; i++) {
      this._draw_span_set(i, this._location[i])
    }
  }

  protected _draw_span_set(i: number, loc: number): void {
    const { frame } = this.plot_view

    const xscale = frame.xscales[this.model.x_range_name]
    const yscale = frame.yscales[this.model.y_range_name]

    const _calc_dim = (scale: Scale, view: CoordinateTransform): number => {
      if (this.model.location_units == 'data')
        return scale.compute(loc)
      else
        return view.compute(loc)
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
      const el = this.el.children[i] as HTMLElement
      el.style.position = 'absolute'
      el.style.top = `${stop}px`
      el.style.left = `${sleft}px`
      el.style.width = `${width}px`
      el.style.height = `${height}px`
      el.style.backgroundColor = this.model.properties.line_color.value()
      el.style.opacity = this.model.properties.line_alpha.value()
    } else if (this.model.render_mode == "canvas") {
      const { ctx } = this.plot_view.canvas_view
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

export namespace SpanSet {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & LineScalar & {
    render_mode: p.Property<RenderMode>
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
    location: p.NumberSpec
    location_units: p.Property<SpatialUnits>
    dimension: p.Property<Dimension>
    source: p.Property<ColumnarDataSource>
  }

  export type Visuals = Annotation.Visuals & { line: Line }
}

export interface SpanSet extends SpanSet.Attrs { }

export class SpanSet extends Annotation {
  properties: SpanSet.Props

  constructor(attrs?: Partial<SpanSet.Attrs>) {
    super(attrs)
  }

  static init_SpanSet(): void {
    this.prototype.default_view = SpanSetView

    this.mixins(['line'])

    this.define<SpanSet.Props>({
      render_mode: [p.RenderMode, 'canvas'],
      x_range_name: [p.String, 'default'],
      y_range_name: [p.String, 'default'],
      location: [p.NumberSpec],
      location_units: [p.SpatialUnits, 'data'],
      dimension: [p.Dimension, 'width'],
      source: [p.Instance, () => new ColumnDataSource()],
    })

    this.override({
      line_color: 'black',
    })
  }
}
