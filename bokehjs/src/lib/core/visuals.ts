import * as mixins from "./property_mixins"
import * as p from "./properties"
import {color2css} from "./util/color"
import {Context2d} from "./util/canvas"
import {Class} from "./class"
import {Arrayable} from "./types"
import {isString} from "./util/types"
import {subselect} from "./util/arrayable"
import {LineJoin, LineCap, FontStyle, TextAlign, TextBaseline} from "./enums"

import {HasProps} from "./has_props"
import {ColumnarDataSource} from "models/sources/columnar_data_source"

function _horz(ctx: Context2d, h: number, h2: number): void {
  ctx.moveTo(0, h2+0.5)
  ctx.lineTo(h, h2+0.5)
  ctx.stroke()
}

function _vert(ctx: Context2d, h: number, h2: number): void {
  ctx.moveTo(h2+0.5, 0)
  ctx.lineTo(h2+0.5, h)
  ctx.stroke()
}

function _x(ctx: Context2d, h: number): void {
  ctx.moveTo(0, h)
  ctx.lineTo(h, 0)
  ctx.stroke()
  ctx.moveTo(0, 0)
  ctx.lineTo(h, h)
  ctx.stroke()
}

function _get_canvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

export type Color = string
function create_hatch_canvas(hatch_pattern: mixins.HatchPattern, hatch_color: Color, hatch_scale: number, hatch_weight: number): HTMLCanvasElement {
  const h = hatch_scale
  const h2 = h / 2
  const h4 = h2 / 2

  const canvas = _get_canvas(hatch_scale)

  const ctx = canvas.getContext("2d")! as Context2d
  ctx.strokeStyle = hatch_color
  ctx.lineCap="square"
  ctx.fillStyle = hatch_color
  ctx.lineWidth = hatch_weight

  switch (hatch_pattern) {
    // we should not need these if code conditions on hatch.doit, but
    // include them here just for completeness
    case " ":
    case "blank":
      break

    case ".":
    case "dot":
      ctx.arc(h2, h2, h2/2, 0, 2 * Math.PI, true)
      ctx.fill()
      break

    case "o":
    case "ring":
      ctx.arc(h2, h2, h2/2, 0, 2 * Math.PI, true)
      ctx.stroke()
      break

    case "-":
    case "horizontal_line":
      _horz(ctx, h, h2)
      break

    case "|":
    case "vertical_line":
      _vert(ctx, h, h2)
      break

    case "+":
    case "cross":
      _horz(ctx, h, h2)
      _vert(ctx, h, h2)
      break

    case "\"":
    case "horizontal_dash":
      _horz(ctx, h2, h2)
      break

    case ":":
    case "vertical_dash":
      _vert(ctx, h2, h2)
      break

    case "@":
    case "spiral":
      const h30 = h/30
      ctx.moveTo(h2, h2)
      for (let i = 0; i < 360; i++) {
        const angle = 0.1 * i
        const x = h2 + (h30 * angle) * Math.cos(angle)
        const y = h2 + (h30 * angle) * Math.sin(angle)
        ctx.lineTo(x, y)
      }
      ctx.stroke()
      break

    case "/":
    case "right_diagonal_line":
      ctx.moveTo(-h4+0.5, h)
      ctx.lineTo(h4+0.5, 0)
      ctx.stroke()
      ctx.moveTo(h4+0.5, h)
      ctx.lineTo(3*h4+0.5, 0)
      ctx.stroke()
      ctx.moveTo(3*h4+0.5, h)
      ctx.lineTo(5*h4+0.5, 0)
      ctx.stroke()
      ctx.stroke()
      break

    case "\\":
    case "left_diagonal_line":
      ctx.moveTo(h4+0.5, h)
      ctx.lineTo(-h4+0.5, 0)
      ctx.stroke()
      ctx.moveTo(3*h4+0.5, h)
      ctx.lineTo(h4+0.5, 0)
      ctx.stroke()
      ctx.moveTo(5*h4+0.5, h)
      ctx.lineTo(3*h4+0.5, 0)
      ctx.stroke()
      ctx.stroke()
      break

    case "x":
    case "diagonal_cross":
      _x(ctx, h)
      break

    case ",":
    case "right_diagonal_dash":
      ctx.moveTo(h4+0.5, 3*h4+0.5)
      ctx.lineTo(3*h4+0.5, h4+0.5)
      ctx.stroke()
      break

    case "`":
    case "left_diagonal_dash":
      ctx.moveTo(h4+0.5, h4+0.5)
      ctx.lineTo(3*h4+0.5, 3*h4+0.5)
      ctx.stroke()
      break

    case "v":
    case "horizontal_wave":
      ctx.moveTo(0, h4)
      ctx.lineTo(h2, 3*h4)
      ctx.lineTo(h, h4)
      ctx.stroke()
      break

    case ">":
    case "vertical_wave":
      ctx.moveTo(h4, 0)
      ctx.lineTo(3*h4, h2)
      ctx.lineTo(h4, h)
      ctx.stroke()
      break

    case "*":
    case "criss_cross":
      _x(ctx, h)
      _horz(ctx, h, h2)
      _vert(ctx, h, h2)
      break
  }

  return canvas
}

export abstract class ContextProperties {

  /** @prototype */
  attrs: string[]

  readonly cache: {[key: string]: any} = {}

  abstract get doit(): boolean

  all_indices?: number[]

  constructor(readonly obj: HasProps, readonly prefix: string = "") {
    for (const attr of this.attrs)
      (this as any)[attr] = obj.properties[prefix + attr]
  }

  warm_cache(source?: ColumnarDataSource): void {
    for (const attr of this.attrs) {
      const prop = this.obj.properties[this.prefix + attr]
      if (prop.spec.value !== undefined) // TODO (bev) better test?
        this.cache[attr] = prop.spec.value
      else if (source != null && prop instanceof p.VectorSpec)
        this.cache[attr + "_array"] = prop.array(source)
      else
        throw new Error("source is required with a vectorized visual property")
    }
  }

  cache_select(attr: string, i: number): any {
    const prop = this.obj.properties[this.prefix + attr]
    let value: any
    if (prop.spec.value !== undefined) // TODO (bev) better test?
      this.cache[attr] = value = prop.spec.value
    else
      this.cache[attr] = value = this.cache[attr + "_array"][i]
    return value
  }

  get_array(attr: string): Arrayable {
    const array = this.cache[attr + "_array"] as Arrayable
    if (this.all_indices != null) {
      return subselect(array, this.all_indices)
    } else {
      return array
    }
  }

  set_vectorize(ctx: Context2d, i: number): void {
    if (this.all_indices != null) // all_indices is set by a Visuals instance associated with a CDSView
      this._set_vectorize(ctx, this.all_indices[i])
    else                          // all_indices is not set for annotations which may have vectorized visual props
      this._set_vectorize(ctx, i)
  }

  protected abstract _set_vectorize(ctx: Context2d, i: number): void
}

export class Line extends ContextProperties {

  readonly line_color:       p.ColorSpec
  readonly line_width:       p.NumberSpec
  readonly line_alpha:       p.NumberSpec
  readonly line_join:        p.Property<LineJoin>
  readonly line_cap:         p.Property<LineCap>
  readonly line_dash:        p.Array
  readonly line_dash_offset: p.Number

  set_value(ctx: Context2d): void {
    ctx.strokeStyle = this.line_color.value()
    ctx.globalAlpha = this.line_alpha.value()
    ctx.lineWidth   = this.line_width.value()
    ctx.lineJoin    = this.line_join.value()
    ctx.lineCap     = this.line_cap.value()
    ctx.setLineDash(this.line_dash.value())
    ctx.setLineDashOffset(this.line_dash_offset.value())
  }

  get doit(): boolean {
    return !(this.line_color.spec.value === null ||
             this.line_alpha.spec.value == 0     ||
             this.line_width.spec.value == 0)
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    this.cache_select("line_color", i)
    ctx.strokeStyle = this.cache.line_color

    this.cache_select("line_alpha", i)
    ctx.globalAlpha = this.cache.line_alpha

    this.cache_select("line_width", i)
    ctx.lineWidth = this.cache.line_width

    this.cache_select("line_join", i)
    ctx.lineJoin = this.cache.line_join

    this.cache_select("line_cap", i)
    ctx.lineCap = this.cache.line_cap

    this.cache_select("line_dash", i)
    ctx.setLineDash(this.cache.line_dash)

    this.cache_select("line_dash_offset", i)
    ctx.setLineDashOffset(this.cache.line_dash_offset)
  }

  color_value(): string {
    return color2css(this.line_color.value(), this.line_alpha.value())
  }
}

Line.prototype.attrs = Object.keys(mixins.LineVector)

export class Fill extends ContextProperties {

  readonly fill_color: p.ColorSpec
  readonly fill_alpha: p.NumberSpec

  set_value(ctx: Context2d): void {
    ctx.fillStyle = this.fill_color.value()
    ctx.globalAlpha = this.fill_alpha.value()
  }

  get doit(): boolean {
    return !(this.fill_color.spec.value === null ||
             this.fill_alpha.spec.value == 0)
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    const color = this.cache_select("fill_color", i)
    function rgba2css(color: number): string {
      const r = (color >> 24) & 0xff
      const g = (color >> 16) & 0xff
      const b = (color >>  8) & 0xff
      const a = (color >>  0) & 0xff
      return `rgba(${r}, ${g}, ${b}, ${a/255})`
    }
    ctx.fillStyle = isString(color) ? color : rgba2css(color)

    this.cache_select("fill_alpha", i)
    ctx.globalAlpha = this.cache.fill_alpha
  }

  color_value(): string {
    return color2css(this.fill_color.value(), this.fill_alpha.value())
  }
}

Fill.prototype.attrs = Object.keys(mixins.FillVector)

export class Hatch extends ContextProperties {

  readonly hatch_color: p.ColorSpec
  readonly hatch_alpha: p.NumberSpec
  readonly hatch_scale: p.NumberSpec
  readonly hatch_pattern: p.StringSpec
  readonly hatch_weight: p.NumberSpec

  cache_select(name: string, i: number): any {
    let value: any
    if (name == "pattern") {
      this.cache_select("hatch_color", i)
      this.cache_select("hatch_scale", i)
      this.cache_select("hatch_pattern", i)
      this.cache_select("hatch_weight", i)
      const {hatch_color, hatch_scale, hatch_pattern, hatch_weight, hatch_extra} = this.cache
      if (hatch_extra != null && hatch_extra.hasOwnProperty(hatch_pattern)) {
        const custom = hatch_extra[hatch_pattern]
        this.cache.pattern = custom.get_pattern(hatch_color, hatch_scale, hatch_weight)
      } else {
        this.cache.pattern = (ctx: Context2d) => {
          const canvas = create_hatch_canvas(hatch_pattern, hatch_color, hatch_scale, hatch_weight)
          return ctx.createPattern(canvas, 'repeat')!
        }
      }
    } else
      value = super.cache_select(name, i)

    return value
  }

  private _try_defer(defer_func: () => void): void {
    const {hatch_pattern, hatch_extra} = this.cache
    if (hatch_extra != null && hatch_extra.hasOwnProperty(hatch_pattern)) {
      const custom = hatch_extra[hatch_pattern]
      custom.onload(defer_func)
    }
  }

  get doit(): boolean {
    return !(this.hatch_color.spec.value === null ||
             this.hatch_alpha.spec.value == 0 ||
             this.hatch_pattern.spec.value == " " ||
             this.hatch_pattern.spec.value == "blank" ||
             this.hatch_pattern.spec.value === null)
  }

  doit2(ctx: Context2d, i: number, ready_func: () => void, defer_func: () => void): void {
    if (!this.doit) {
      return
    }

    this.cache_select("pattern", i)
    const pattern = this.cache.pattern(ctx)
    if (pattern == null) {
      this._try_defer(defer_func)
    } else {
      this.set_vectorize(ctx, i)
      ready_func()
    }
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    this.cache_select("pattern", i)
    ctx.fillStyle = this.cache.pattern(ctx)

    this.cache_select("hatch_alpha", i)
    ctx.globalAlpha = this.cache.hatch_alpha
  }

  color_value(): string {
    return color2css(this.hatch_color.value(), this.hatch_alpha.value())
  }
}

Hatch.prototype.attrs = Object.keys(mixins.HatchVector)

export class Text extends ContextProperties {

  readonly text_font:        p.Font
  readonly text_font_size:   p.StringSpec
  readonly text_font_style:  p.Property<FontStyle>
  readonly text_color:       p.ColorSpec
  readonly text_alpha:       p.NumberSpec
  readonly text_align:       p.Property<TextAlign>
  readonly text_baseline:    p.Property<TextBaseline>
  readonly text_line_height: p.Number

  color_value(): string {
    return color2css(this.text_color.value(), this.text_alpha.value())
  }

  font_value(): string {
    const text_font       = this.text_font.value()
    const text_font_size  = this.text_font_size.value()
    const text_font_style = this.text_font_style.value()
    return `${text_font_style} ${text_font_size} ${text_font}`
  }

  v_font_value(i: number): string {
    super.cache_select("text_font_style", i)
    super.cache_select("text_font_size",  i)
    super.cache_select("text_font",       i)

    const {text_font_style, text_font_size, text_font} = this.cache
    return `${text_font_style} ${text_font_size} ${text_font}`
  }

  cache_select(name: string, i: number): any {
    let value: any
    if (name == "font") {
      this.cache.font = value = this.v_font_value(i)
    } else
      value = super.cache_select(name, i)

    return value
  }

  set_value(ctx: Context2d): void {
    ctx.font         = this.font_value()
    ctx.fillStyle    = this.text_color.value()
    ctx.globalAlpha  = this.text_alpha.value()
    ctx.textAlign    = this.text_align.value()
    ctx.textBaseline = this.text_baseline.value()
  }

  get doit(): boolean {
    return !(this.text_color.spec.value === null ||
             this.text_alpha.spec.value == 0)
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    this.cache_select("font", i)
    ctx.font = this.cache.font

    this.cache_select("text_color", i)
    ctx.fillStyle = this.cache.text_color

    this.cache_select("text_alpha", i)
    ctx.globalAlpha = this.cache.text_alpha

    this.cache_select("text_align", i)
    ctx.textAlign = this.cache.text_align

    this.cache_select("text_baseline", i)
    ctx.textBaseline = this.cache.text_baseline
  }
}

Text.prototype.attrs = Object.keys(mixins.TextVector)

export class Visuals {

  constructor(model: HasProps) {
    for (const mixin of model._mixins) {
      const [name, prefix=""] = mixin.split(":")
      let cls: Class<ContextProperties>
      switch (name) {
        case "line":  cls = Line;  break
        case "fill":  cls = Fill;  break
        case "hatch": cls = Hatch; break
        case "text":  cls = Text;  break
        default:
          throw new Error(`unknown visual: ${name}`)
      }
      (this as any)[prefix + name] = new cls(model, prefix)
    }
  }

  warm_cache(source?: ColumnarDataSource): void {
    for (const name in this) {
      if (this.hasOwnProperty(name)) {
        const prop: any = this[name]
        if (prop instanceof ContextProperties)
          prop.warm_cache(source)
      }
    }
  }

  set_all_indices(all_indices: number[]): void {
    for (const name in this) {
      if (this.hasOwnProperty(name)) {
        const prop: any = this[name]
        if (prop instanceof ContextProperties)
          prop.all_indices = all_indices
      }
    }
  }
}
