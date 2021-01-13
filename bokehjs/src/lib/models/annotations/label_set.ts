import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {DataAnnotationView} from "./data_annotation"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits} from "core/enums"
import {div, display} from "core/dom"
import * as p from "core/properties"
import {Size} from "core/layout"
import {Arrayable, FloatArray} from "core/types"
import {Context2d} from "core/util/canvas"
import {font_metrics} from "core/util/text"

export class LabelSetView extends TextAnnotationView {
  model: LabelSet
  visuals: LabelSet.Visuals

  protected _x: FloatArray
  protected _y: FloatArray
  protected text: p.Uniform<string>
  protected angle: p.Uniform<number>
  protected x_offset: p.Uniform<number>
  protected y_offset: p.Uniform<number>

  // XXX: can't inherit DataAnnotation currently
  set_data(source: ColumnarDataSource): void {
    DataAnnotationView.prototype.set_data.call(this, source)
  }

  initialize(): void {
    super.initialize()
    this.set_data(this.model.source)

    if (this.model.render_mode == 'css') {
      for (let i = 0, end = this.text.length; i < end; i++) {
        const el = div({style: {display: "none"}})
        this.el!.appendChild(el)
      }
    }
  }

  connect_signals(): void {
    super.connect_signals()

    const render = () => {
      this.set_data(this.model.source)

      if (this.model.render_mode == "css")
        this.render()
      else
        this.request_render()
    }

    this.connect(this.model.change, render)
    this.connect(this.model.source.streaming, render)
    this.connect(this.model.source.patching, render)
    this.connect(this.model.source.change, render)
  }

  protected _calculate_text_dimensions(ctx: Context2d, text: string): [number, number] {
    const {width} = ctx.measureText(text)
    const {height} = font_metrics(this.visuals.text.font_value(0))
    return [width, height]
  }

  protected _map_data(): [Arrayable<number>, Arrayable<number>] {
    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    const panel = this.layout != null ? this.layout : this.plot_view.frame

    const sx = this.model.x_units == "data" ? xscale.v_compute(this._x) : panel.bbox.xview.v_compute(this._x)
    const sy = this.model.y_units == "data" ? yscale.v_compute(this._y) : panel.bbox.yview.v_compute(this._y)

    return [sx, sy]
  }

  protected _render(): void {
    const draw = this.model.render_mode == 'canvas' ? this._v_canvas_text.bind(this) : this._v_css_text.bind(this)
    const {ctx} = this.layer

    const [sx, sy] = this._map_data()

    for (let i = 0, end = this.text.length; i < end; i++) {
      draw(ctx, i, this.text.get(i), sx[i] + this.x_offset.get(i), sy[i] - this.y_offset.get(i), this.angle.get(i))
    }
  }

  protected _get_size(): Size {
    const {ctx} = this.layer
    this.visuals.text.set_vectorize(ctx, 0)

    const {width} = ctx.measureText(this.text.get(0))
    const {height} = font_metrics(ctx.font)

    return {width, height}
  }

  protected _v_canvas_text(ctx: Context2d, i: number, text: string, sx: number, sy: number, angle: number): void {
    this.visuals.text.set_vectorize(ctx, i)
    const bbox_dims = this._calculate_bounding_box_dimensions(ctx, text)

    ctx.save()

    ctx.beginPath()
    ctx.translate(sx, sy)
    ctx.rotate(angle)

    ctx.rect(bbox_dims[0], bbox_dims[1], bbox_dims[2], bbox_dims[3])

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_vectorize(ctx, i)
      ctx.fill()
    }

    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_vectorize(ctx, i)
      ctx.stroke()
    }

    if (this.visuals.text.doit) {
      this.visuals.text.set_vectorize(ctx, i)
      ctx.fillText(text, 0, 0)
    }

    ctx.restore()
  }

  protected _v_css_text(ctx: Context2d, i: number, text: string, sx: number, sy: number, angle: number): void {
    const el = this.el!.children[i] as HTMLElement
    el.textContent = text

    this.visuals.text.set_vectorize(ctx, i)
    const [x, y] = this._calculate_bounding_box_dimensions(ctx, text)

    el.style.position = "absolute"
    el.style.left = `${sx + x}px`
    el.style.top = `${sy + y}px`
    el.style.color = ctx.fillStyle as string
    el.style.font = ctx.font
    el.style.lineHeight = "normal" // needed to prevent ipynb css override

    if (angle) {
      el.style.transform = `rotate(${angle}rad)`
    }

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_vectorize(ctx, i)
      el.style.backgroundColor = ctx.fillStyle as string
    }

    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_vectorize(ctx, i)

      // attempt to support vector-style ("8 4 8") line dashing for css mode
      el.style.borderStyle = ctx.lineDash.length < 2 ? "solid" : "dashed"
      el.style.borderWidth = `${ctx.lineWidth}px`
      el.style.borderColor = ctx.strokeStyle as string
    }

    display(el)
  }
}

export namespace LabelSet {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextAnnotation.Props & {
    x: p.XCoordinateSpec
    y: p.YCoordinateSpec
    x_units: p.Property<SpatialUnits>
    y_units: p.Property<SpatialUnits>
    text: p.StringSpec
    angle: p.AngleSpec
    x_offset: p.NumberSpec
    y_offset: p.NumberSpec
    source: p.Property<ColumnarDataSource>
  } & Mixins

  export type Mixins =
    mixins.TextVector &
    mixins.Prefixed<"border", mixins.LineVector> &
    mixins.Prefixed<"background", mixins.FillVector>

  export type Visuals = TextAnnotation.Visuals & {
    text: visuals.TextVector
    border_line: visuals.LineVector
    background_fill: visuals.FillVector
  }
}

export interface LabelSet extends LabelSet.Attrs {}

export class LabelSet extends TextAnnotation {
  properties: LabelSet.Props
  __view_type__: LabelSetView

  constructor(attrs?: Partial<LabelSet.Attrs>) {
    super(attrs)
  }

  static init_LabelSet(): void {
    this.prototype.default_view = LabelSetView

    this.mixins<LabelSet.Mixins>([
      mixins.TextVector,
      ["border_",     mixins.LineVector],
      ["background_", mixins.FillVector],
    ])

    this.define<LabelSet.Props>(({Ref}) => ({
      x:            [ p.XCoordinateSpec, {field: "x"} ],
      y:            [ p.YCoordinateSpec, {field: "y"} ],
      x_units:      [ SpatialUnits, "data" ],
      y_units:      [ SpatialUnits, "data" ],
      text:         [ p.StringSpec, {field: "text"} ],
      angle:        [ p.AngleSpec, 0 ],
      x_offset:     [ p.NumberSpec, {value: 0} ],
      y_offset:     [ p.NumberSpec, {value: 0} ],
      source:       [ Ref(ColumnDataSource), () => new ColumnDataSource() ],
    }))

    this.override<LabelSet.Props>({
      background_fill_color: null,
      border_line_color: null,
    })
  }
}
