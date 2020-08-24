import * as mixins from "./property_mixins"
import * as p from "./properties"
import {color2rgba, decode_rgba} from "./util/color"
import {Context2d} from "./util/canvas"
import {Class} from "./class"
import {Arrayable, Color, Indices} from "./types"
import {isString} from "./util/types"
import {LineJoin, LineCap, FontStyle, TextAlign, TextBaseline} from "./enums"

import {HasProps} from "./has_props"
import {ColumnarDataSource} from "models/sources/columnar_data_source"
import {Texture} from "models/textures/texture"
import {SVGRenderingContext2D} from "core/util/svg"
import {CanvasLayer} from "models/canvas/canvas"

function color2css(color: Color | number, alpha: number): string {
  const [r, g, b, a] = isString(color) ? color2rgba(color) : decode_rgba(color)
  return `rgba(${r*255}, ${g*255}, ${b*255}, ${a == 1.0 ? alpha : a})`
}

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

export const hatch_aliases: {[key: string]: mixins.HatchPattern} = {
  " ": "blank",
  ".": "dot",
  o: "ring",
  "-": "horizontal_line",
  "|": "vertical_line",
  "+": "cross",
  "\"": "horizontal_dash",
  ":": "vertical_dash",
  "@": "spiral",
  "/": "right_diagonal_line",
  "\\": "left_diagonal_line",
  x: "diagonal_cross",
  ",": "right_diagonal_dash",
  "`": "left_diagonal_dash",
  v: "horizontal_wave",
  ">": "vertical_wave",
  "*": "criss_cross",
}

function create_hatch_canvas(ctx: Context2d,
    hatch_pattern: mixins.HatchPattern, hatch_color: Color, hatch_alpha: number, hatch_scale: number, hatch_weight: number): void {
  const h = hatch_scale
  const h2 = h / 2
  const h4 = h2 / 2

  ctx.strokeStyle = color2css(hatch_color, hatch_alpha)
  ctx.lineCap = "square"
  ctx.fillStyle = hatch_color
  ctx.lineWidth = hatch_weight

  switch (hatch_aliases[hatch_pattern] ?? hatch_pattern) {
    // we should not need these if code conditions on hatch.doit, but
    // include them here just for completeness
    case "blank":
      break
    case "dot":
      ctx.arc(h2, h2, h2/2, 0, 2 * Math.PI, true)
      ctx.fill()
      break
    case "ring":
      ctx.arc(h2, h2, h2/2, 0, 2 * Math.PI, true)
      ctx.stroke()
      break
    case "horizontal_line":
      _horz(ctx, h, h2)
      break
    case "vertical_line":
      _vert(ctx, h, h2)
      break
    case "cross":
      _horz(ctx, h, h2)
      _vert(ctx, h, h2)
      break
    case "horizontal_dash":
      _horz(ctx, h2, h2)
      break
    case "vertical_dash":
      _vert(ctx, h2, h2)
      break
    case "spiral": {
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
    }
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
    case "diagonal_cross":
      _x(ctx, h)
      break
    case "right_diagonal_dash":
      ctx.moveTo(h4+0.5, 3*h4+0.5)
      ctx.lineTo(3*h4+0.5, h4+0.5)
      ctx.stroke()
      break
    case "left_diagonal_dash":
      ctx.moveTo(h4+0.5, h4+0.5)
      ctx.lineTo(3*h4+0.5, 3*h4+0.5)
      ctx.stroke()
      break
    case "horizontal_wave":
      ctx.moveTo(0, h4)
      ctx.lineTo(h2, 3*h4)
      ctx.lineTo(h, h4)
      ctx.stroke()
      break
    case "vertical_wave":
      ctx.moveTo(h4, 0)
      ctx.lineTo(3*h4, h2)
      ctx.lineTo(h4, h)
      ctx.stroke()
      break
    case "criss_cross":
      _x(ctx, h)
      _horz(ctx, h, h2)
      _vert(ctx, h, h2)
      break
  }
}

export abstract class ContextProperties {

  /** @prototype */
  attrs: string[]

  readonly cache: {[key: string]: any} = {}

  abstract get doit(): boolean

  constructor(readonly obj: HasProps, readonly prefix: string = "") {
    for (const attr of this.attrs)
      (this as any)[attr] = obj.properties[prefix + attr]
  }

  warm_cache(source?: ColumnarDataSource, all_indices?: Indices): void {
    for (const attr of this.attrs) {
      const prop = this.obj.properties[this.prefix + attr]
      if (prop.spec.value !== undefined) // TODO (bev) better test?
        this.cache[attr] = prop.spec.value
      else if (source != null && prop instanceof p.VectorSpec) {
        const array = prop.array(source)
        const subarray = all_indices != null ? all_indices.select(array) : array
        this.cache[attr + "_array"] = subarray
      } else
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
    return this.cache[attr + "_array"] as Arrayable
  }

  set_vectorize(ctx: Context2d, i: number): void {
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
    const color = this.line_color.value()
    const alpha = this.line_alpha.value()

    ctx.strokeStyle    = color2css(color, alpha)
    ctx.lineWidth      = this.line_width.value()
    ctx.lineJoin       = this.line_join.value()
    ctx.lineCap        = this.line_cap.value()
    ctx.lineDash       = this.line_dash.value()
    ctx.lineDashOffset = this.line_dash_offset.value()
  }

  get doit(): boolean {
    return !(this.line_color.spec.value === null ||
             this.line_alpha.spec.value == 0     ||
             this.line_width.spec.value == 0)
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    const color = this.cache_select("line_color", i)
    const alpha = this.cache_select("line_alpha", i)
    const width = this.cache_select("line_width", i)
    const join = this.cache_select("line_join", i)
    const cap = this.cache_select("line_cap", i)
    const dash = this.cache_select("line_dash", i)
    const offset = this.cache_select("line_dash_offset", i)

    ctx.strokeStyle = color2css(color, alpha)
    ctx.lineWidth = width
    ctx.lineJoin = join
    ctx.lineCap = cap
    ctx.lineDash = dash
    ctx.lineDashOffset = offset
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
    const color = this.fill_color.value()
    const alpha = this.fill_alpha.value()

    ctx.fillStyle = color2css(color, alpha)
  }

  get doit(): boolean {
    return !(this.fill_color.spec.value === null ||
             this.fill_alpha.spec.value == 0)
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    const color = this.cache_select("fill_color", i)
    const alpha = this.cache_select("fill_alpha", i)

    ctx.fillStyle = color2css(color, alpha)
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
      const color = this.cache_select("hatch_color", i)
      const alpha = this.cache_select("hatch_alpha", i)
      const scale = this.cache_select("hatch_scale", i)
      const pattern = this.cache_select("hatch_pattern", i)
      const weight = this.cache_select("hatch_weight", i)

      const {hatch_extra} = this.cache
      if (hatch_extra != null && hatch_extra.hasOwnProperty(pattern)) {
        const custom: Texture = hatch_extra[pattern]
        this.cache.pattern = custom.get_pattern(color, alpha, scale, weight)
      } else {
        this.cache.pattern = (ctx: Context2d) => {
          // TODO: this needs a canvas provider instead of trying to guess what to use
          const output_backend = ctx instanceof SVGRenderingContext2D ? "svg" : "canvas"
          const region = new CanvasLayer(output_backend, true)
          region.resize(scale, scale)
          region.prepare()
          create_hatch_canvas(region.ctx, pattern, color, alpha, scale, weight)
          return ctx.createPattern(region.canvas, "repeat")!
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
    const color = this.text_color.value()
    const alpha = this.text_alpha.value()

    ctx.fillStyle    = color2css(color, alpha)
    ctx.font         = this.font_value()
    ctx.textAlign    = this.text_align.value()
    ctx.textBaseline = this.text_baseline.value()
  }

  get doit(): boolean {
    return !(this.text_color.spec.value === null ||
             this.text_alpha.spec.value == 0)
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    const color = this.cache_select("text_color", i)
    const alpha = this.cache_select("text_alpha", i)
    const font = this.cache_select("font", i)
    const align = this.cache_select("text_align", i)
    const baseline = this.cache_select("text_baseline", i)

    ctx.fillStyle = color2css(color, alpha)
    ctx.font = font
    ctx.textAlign = align
    ctx.textBaseline = baseline
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

  warm_cache(source?: ColumnarDataSource, all_indices?: Indices): void {
    for (const name in this) {
      if (this.hasOwnProperty(name)) {
        const prop: any = this[name]
        if (prop instanceof ContextProperties)
          prop.warm_cache(source, all_indices)
      }
    }
  }
}
