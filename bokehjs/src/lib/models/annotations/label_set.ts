import {DataAnnotation, DataAnnotationView} from "./data_annotation"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits, RenderMode} from "core/enums"
import {div, display} from "core/dom"
import {TextBox} from "core/graphics"
import * as p from "core/properties"
import {FloatArray, ScreenArray} from "core/types"
import {Context2d} from "core/util/canvas"
import {assert} from "core/util/assert"

export class LabelSetView extends DataAnnotationView {
  override model: LabelSet
  override visuals: LabelSet.Visuals

  protected _x: FloatArray
  protected _y: FloatArray
  protected sx: ScreenArray
  protected sy: ScreenArray
  protected text: p.Uniform<string>
  protected angle: p.Uniform<number>
  protected x_offset: p.Uniform<number>
  protected y_offset: p.Uniform<number>
  protected els?: HTMLElement[]

  override set_data(source: ColumnarDataSource): void {
    super.set_data(source)

    if (this.model.render_mode == "css")
      this.els = [...this.text].map(() => div({style: {display: "none"}}))
    else
      delete this.els
  }

  protected override _rerender(): void {
    if (this.model.render_mode == "css")
      this.render()
    else
      this.request_render()
  }

  map_data(): void {
    const {x_scale, y_scale} = this.coordinates
    const panel = this.layout != null ? this.layout : this.plot_view.frame

    this.sx = this.model.x_units == "data" ? x_scale.v_compute(this._x) : panel.bbox.xview.v_compute(this._x)
    this.sy = this.model.y_units == "data" ? y_scale.v_compute(this._y) : panel.bbox.yview.v_compute(this._y)
  }

  paint(): void {
    const draw = this.model.render_mode == "canvas" ? this._v_canvas_text.bind(this) : this._v_css_text.bind(this)
    const {ctx} = this.layer

    for (let i = 0, end = this.text.length; i < end; i++) {
      const x_offset_i = this.x_offset.get(i)
      const y_offset_i = this.y_offset.get(i)
      const sx_i = this.sx[i] + x_offset_i
      const sy_i = this.sy[i] - y_offset_i
      const angle_i = this.angle.get(i)
      const text_i = this.text.get(i)
      draw(ctx, i, text_i, sx_i, sy_i, angle_i)
    }
  }

  protected _v_canvas_text(ctx: Context2d, i: number, text: string, sx: number, sy: number, angle: number): void {
    const graphics = new TextBox({text})
    graphics.angle = angle
    graphics.position = {sx, sy}
    graphics.visuals = this.visuals.text.values(i)

    const {background_fill, border_line} = this.visuals
    if (background_fill.doit || border_line.doit) {
      const {p0, p1, p2, p3} = graphics.rect()
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.lineTo(p3.x, p3.y)
      ctx.closePath()

      this.visuals.background_fill.apply(ctx, i)
      this.visuals.border_line.apply(ctx, i)
    }

    if (this.visuals.text.doit)
      graphics.paint(ctx)
  }

  protected _v_css_text(ctx: Context2d, i: number, text: string, sx: number, sy: number, angle: number): void {
    assert(this.els != null)
    const el = this.els[i]

    el.textContent = text
    this.visuals.text.set_vectorize(ctx, i)

    el.style.position = "absolute"
    el.style.left = `${sx}px`
    el.style.top = `${sy}px`
    el.style.color = ctx.fillStyle as string
    el.style.font = ctx.font
    el.style.lineHeight = "normal" // needed to prevent ipynb css override
    el.style.whiteSpace = "pre"

    const [x_anchor, x_t] = (() => {
      switch (this.visuals.text.text_align.get(i)) {
        case "left": return ["left", "0%"]
        case "center": return ["center", "-50%"]
        case "right": return ["right", "-100%"]
      }
    })()
    const [y_anchor, y_t] = (() => {
      switch (this.visuals.text.text_baseline.get(i)) {
        case "top": return ["top", "0%"]
        case "middle": return ["center", "-50%"]
        case "bottom": return ["bottom", "-100%"]
        default: return ["center", "-50%"] // "baseline"
      }
    })()

    let transform = `translate(${x_t}, ${y_t})`
    if (angle) {
      transform += `rotate(${angle}rad)`
    }

    el.style.transformOrigin = `${x_anchor} ${y_anchor}`
    el.style.transform = transform

    if (this.layout == null) {
      // const {bbox} = this.plot_view.frame
      // const {left, right, top, bottom} = bbox
      // el.style.clipPath = ???
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

  export type Props = DataAnnotation.Props & {
    x: p.XCoordinateSpec
    y: p.YCoordinateSpec
    x_units: p.Property<SpatialUnits>
    y_units: p.Property<SpatialUnits>
    text: p.StringSpec
    angle: p.AngleSpec
    x_offset: p.NumberSpec
    y_offset: p.NumberSpec
    /** @deprecated */
    render_mode: p.Property<RenderMode>
  } & Mixins

  export type Mixins =
    mixins.TextVector &
    mixins.Prefixed<"border", mixins.LineVector> &
    mixins.Prefixed<"background", mixins.FillVector>

  export type Visuals = DataAnnotation.Visuals & {
    text: visuals.TextVector
    border_line: visuals.LineVector
    background_fill: visuals.FillVector
  }
}

export interface LabelSet extends LabelSet.Attrs {}

export class LabelSet extends DataAnnotation {
  override properties: LabelSet.Props
  override __view_type__: LabelSetView

  constructor(attrs?: Partial<LabelSet.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LabelSetView

    this.mixins<LabelSet.Mixins>([
      mixins.TextVector,
      ["border_",     mixins.LineVector],
      ["background_", mixins.FillVector],
    ])

    this.define<LabelSet.Props>(() => ({
      x:            [ p.XCoordinateSpec, {field: "x"} ],
      y:            [ p.YCoordinateSpec, {field: "y"} ],
      x_units:      [ SpatialUnits, "data" ],
      y_units:      [ SpatialUnits, "data" ],
      text:         [ p.StringSpec, {field: "text"} ],
      angle:        [ p.AngleSpec, 0 ],
      x_offset:     [ p.NumberSpec, {value: 0} ],
      y_offset:     [ p.NumberSpec, {value: 0} ],
      /** @deprecated */
      render_mode:  [ RenderMode, "canvas" ],
    }))

    this.override<LabelSet.Props>({
      background_fill_color: null,
      border_line_color: null,
    })
  }
}
