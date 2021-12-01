import {DataAnnotation, DataAnnotationView} from "../data_annotation"
import {ColumnarDataSource} from "../../sources/columnar_data_source"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits} from "core/enums"
import {div, display, remove} from "core/dom"
import * as p from "core/properties"
import {FloatArray, ScreenArray} from "core/types"
import {Context2d} from "core/util/canvas"
import {assert} from "core/util/assert"

export class HTMLLabelSetView extends DataAnnotationView {
  override model: HTMLLabelSet
  override visuals: HTMLLabelSet.Visuals

  protected _x: FloatArray
  protected _y: FloatArray
  protected sx: ScreenArray
  protected sy: ScreenArray
  protected text: p.Uniform<string | null>
  protected angle: p.Uniform<number>
  protected x_offset: p.Uniform<number>
  protected y_offset: p.Uniform<number>
  protected els: HTMLElement[] = []

  override set_data(source: ColumnarDataSource): void {
    super.set_data(source)

    this.els.forEach((el) => remove(el))
    this.els = []

    for (const _ of this.text) {
      const el = div({style: {display: "none"}})
      this.plot_view.canvas_view.add_overlay(el)
      this.els.push(el)
    }
  }

  override remove(): void {
    this.els.forEach((el) => remove(el))
    this.els = []
    super.remove()
  }

  protected override _rerender(): void {
    this.render()
  }

  map_data(): void {
    const {x_scale, y_scale} = this.coordinates
    const panel = this.layout != null ? this.layout : this.plot_view.frame

    this.sx = this.model.x_units == "data" ? x_scale.v_compute(this._x) : panel.bbox.xview.v_compute(this._x)
    this.sy = this.model.y_units == "data" ? y_scale.v_compute(this._y) : panel.bbox.yview.v_compute(this._y)
  }

  paint(): void {
    const {ctx} = this.layer

    for (let i = 0, end = this.text.length; i < end; i++) {
      const x_offset_i = this.x_offset.get(i)
      const y_offset_i = this.y_offset.get(i)
      const sx_i = this.sx[i] + x_offset_i
      const sy_i = this.sy[i] - y_offset_i
      const angle_i = this.angle.get(i)
      const text_i = this.text.get(i)

      if (!isFinite(sx_i + sy_i + angle_i) || text_i == null)
        continue

      this._paint(ctx, i, text_i, sx_i, sy_i, angle_i)
    }
  }

  protected _paint(ctx: Context2d, i: number, text: string, sx: number, sy: number, angle: number): void {
    assert(i in this.els)
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

export namespace HTMLLabelSet {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataAnnotation.Props & {
    x: p.XCoordinateSpec
    y: p.YCoordinateSpec
    x_units: p.Property<SpatialUnits>
    y_units: p.Property<SpatialUnits>
    text: p.NullStringSpec
    angle: p.AngleSpec
    x_offset: p.NumberSpec
    y_offset: p.NumberSpec
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

export interface HTMLLabelSet extends HTMLLabelSet.Attrs {}

export class HTMLLabelSet extends DataAnnotation {
  override properties: HTMLLabelSet.Props
  override __view_type__: HTMLLabelSetView

  constructor(attrs?: Partial<HTMLLabelSet.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HTMLLabelSetView

    this.mixins<HTMLLabelSet.Mixins>([
      mixins.TextVector,
      ["border_",     mixins.LineVector],
      ["background_", mixins.FillVector],
    ])

    this.define<HTMLLabelSet.Props>(() => ({
      x:            [ p.XCoordinateSpec, {field: "x"} ],
      y:            [ p.YCoordinateSpec, {field: "y"} ],
      x_units:      [ SpatialUnits, "data" ],
      y_units:      [ SpatialUnits, "data" ],
      text:         [ p.NullStringSpec, {field: "text"} ],
      angle:        [ p.AngleSpec, 0 ],
      x_offset:     [ p.NumberSpec, {value: 0} ],
      y_offset:     [ p.NumberSpec, {value: 0} ],
    }))

    this.override<HTMLLabelSet.Props>({
      background_fill_color: null,
      border_line_color: null,
    })
  }
}
