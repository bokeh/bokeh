import * as mixins from "./property_mixins"
import * as p from "./properties"
import {color2rgba} from "./util/color"
import {Context2d} from "./util/canvas"
import {Class} from "./class"

import {HasProps} from "./has_props"
import {ColumnarDataSource} from "models/sources/columnar_data_source"

export abstract class ContextProperties {

  // prototype {
  attrs: string[]
  do_attr: string
  // }

  readonly cache: {[key: string]: any} = {}
  readonly doit: boolean

  all_indices: number[]

  constructor(readonly obj: HasProps, readonly prefix: string = "") {
    const do_spec = obj.properties[prefix + this.do_attr].spec
    this.doit = do_spec.value !== null // XXX: can't be `undefined`, see TODOs below.

    for (const attr of this.attrs)
      (this as any)[attr] = obj.properties[prefix + attr]
  }

  warm_cache(source?: ColumnarDataSource): void {
    for (const attr of this.attrs) {
      const prop = this.obj.properties[this.prefix + attr]
      if (prop.spec.value !== undefined) // TODO (bev) better test?
        this.cache[attr] = prop.spec.value
      else if (source != null)
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
  readonly line_join:        p.LineJoin
  readonly line_cap:         p.LineCap
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

  protected _set_vectorize(ctx: Context2d, i: number): void {
    this.cache_select("line_color", i)
    if (ctx.strokeStyle !== this.cache.line_color)
      ctx.strokeStyle = this.cache.line_color

    this.cache_select("line_alpha", i)
    if (ctx.globalAlpha !== this.cache.line_alpha)
      ctx.globalAlpha = this.cache.line_alpha

    this.cache_select("line_width", i)
    if (ctx.lineWidth !== this.cache.line_width)
      ctx.lineWidth = this.cache.line_width

    this.cache_select("line_join", i)
    if (ctx.lineJoin !== this.cache.line_join)
      ctx.lineJoin = this.cache.line_join

    this.cache_select("line_cap", i)
    if (ctx.lineCap !== this.cache.line_cap)
      ctx.lineCap = this.cache.line_cap

    this.cache_select("line_dash", i)
    if (ctx.getLineDash() !== this.cache.line_dash)
      ctx.setLineDash(this.cache.line_dash)

    this.cache_select("line_dash_offset", i)
    if (ctx.getLineDashOffset() !== this.cache.line_dash_offset)
      ctx.setLineDashOffset(this.cache.line_dash_offset)
  }

  color_value(): string {
    const [r, g, b, a] = color2rgba(this.line_color.value(), this.line_alpha.value())
    return `rgba(${r*255},${g*255},${b*255},${a})`
  }
}

Line.prototype.attrs = Object.keys(mixins.line())
Line.prototype.do_attr = "line_color"

export class Fill extends ContextProperties {

  readonly fill_color: p.ColorSpec
  readonly fill_alpha: p.NumberSpec

  set_value(ctx: Context2d): void {
    ctx.fillStyle   = this.fill_color.value()
    ctx.globalAlpha = this.fill_alpha.value()
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    this.cache_select("fill_color", i)
    if (ctx.fillStyle !== this.cache.fill_color)
      ctx.fillStyle = this.cache.fill_color

    this.cache_select("fill_alpha", i)
    if (ctx.globalAlpha !== this.cache.fill_alpha)
      ctx.globalAlpha = this.cache.fill_alpha
  }

  color_value(): string {
    const [r, g, b, a] = color2rgba(this.fill_color.value(), this.fill_alpha.value())
    return `rgba(${r*255},${g*255},${b*255},${a})`
  }
}

Fill.prototype.attrs = Object.keys(mixins.fill())
Fill.prototype.do_attr =  "fill_color"

export class Text extends ContextProperties {

  readonly text_font:        p.Font
  readonly text_font_size:   p.FontSizeSpec
  readonly text_font_style:  p.FontStyle
  readonly text_color:       p.ColorSpec
  readonly text_alpha:       p.NumberSpec
  readonly text_align:       p.TextAlign
  readonly text_baseline:    p.TextBaseline
  readonly text_line_height: p.Number

  cache_select(name: string, i: number): any {
    let value: any
    if (name == "font") {
      super.cache_select("text_font_style", i)
      super.cache_select("text_font_size",  i)
      super.cache_select("text_font",       i)

      const {text_font_style, text_font_size, text_font} = this.cache
      this.cache.font = value = `${text_font_style} ${text_font_size} ${text_font}`
    } else
      value = super.cache_select(name, i)

    return value
  }

  font_value(): string {
    const font       = this.text_font.value()
    const font_size  = this.text_font_size.value()
    const font_style = this.text_font_style.value()
    return font_style + " " + font_size + " " + font
  }

  color_value(): string {
    const [r, g, b, a] = color2rgba(this.text_color.value(), this.text_alpha.value())
    return `rgba(${r*255},${g*255},${b*255},${a})`
  }

  set_value(ctx: Context2d): void {
    ctx.font         = this.font_value()
    ctx.fillStyle    = this.text_color.value()
    ctx.globalAlpha  = this.text_alpha.value()
    ctx.textAlign    = this.text_align.value()
    ctx.textBaseline = this.text_baseline.value()
  }

  protected _set_vectorize(ctx: Context2d, i: number): void {
    this.cache_select("font", i)
    if (ctx.font !== this.cache.font)
      ctx.font = this.cache.font

    this.cache_select("text_color", i)
    if (ctx.fillStyle !== this.cache.text_color)
      ctx.fillStyle = this.cache.text_color

    this.cache_select("text_alpha", i)
    if (ctx.globalAlpha !== this.cache.text_alpha)
      ctx.globalAlpha = this.cache.text_alpha

    this.cache_select("text_align", i)
    if (ctx.textAlign !== this.cache.text_align)
      ctx.textAlign = this.cache.text_align

    this.cache_select("text_baseline", i)
    if (ctx.textBaseline !== this.cache.text_baseline)
      ctx.textBaseline = this.cache.text_baseline
  }
}

Text.prototype.attrs = Object.keys(mixins.text())
Text.prototype.do_attr = "text_color"

export class Visuals {

  constructor(model: HasProps) {
    for (const mixin of model.mixins) {
      const [name, prefix=""] = mixin.split(":")
      let cls: Class<ContextProperties>
      switch (name) {
        case "line": cls = Line; break
        case "fill": cls = Fill; break
        case "text": cls = Text; break
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
