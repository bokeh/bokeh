import type * as p from "core/properties"
import type * as visuals from "core/visuals"
import {to_object} from "core/util/object"
import {isNumber} from "core/util/types"
import type {Context2d} from "core/util/canvas"
import {load_image} from "core/util/image"
import type {CanvasImage} from "models/glyphs/image_url"
import {color2css, color2hexrgb, color2rgba} from "core/util/color"
import type {Size, Dict} from "core/types"
import type {GraphicsBox, TextHeightMetric, Position} from "core/graphics"
import {text_width} from "core/graphics"
import {font_metrics, parse_css_font_size, parse_css_length} from "core/util/text"
import {insert_text_on_position} from "core/util/string"
import type {Rect} from "core/util/affine"
import {AffineTransform} from "core/util/affine"
import {BBox} from "core/util/bbox"
import {BaseText, BaseTextView} from "./base_text"
import type {MathJaxProvider} from "./providers"
import {default_provider} from "./providers"

/**
 * Helper class for rendering MathText into Canvas
 */
export abstract class MathTextView extends BaseTextView implements GraphicsBox {
  declare model: MathText

  graphics(): GraphicsBox {
    return this
  }

  valign: number

  angle?: number
  _position: Position = {sx: 0, sy: 0}
  // Align does nothing, needed to maintain compatibility with TextBox,
  // to align you need to use TeX Macros.
  // http://docs.mathjax.org/en/latest/input/tex/macros/index.html?highlight=align
  align: "auto" | "left" | "center" | "right" | "justify" = "left"
  // Same for infer_text_height
  infer_text_height(): TextHeightMetric {
    return "ascent_descent"
  }

  _x_anchor: "left" | "center" | "right" = "left"
  _y_anchor: "top"  | "center" | "baseline" | "bottom" = "center"

  _base_font_size: number = 13 // the same as :host's font-size (13px)

  set base_font_size(v: number | null | undefined) {
    if (v != null) {
      this._base_font_size = v
    }
  }

  get base_font_size(): number {
    return this._base_font_size
  }

  font_size_scale: number = 1.0
  font: string
  color: string

  private svg_image: CanvasImage | null = null
  private svg_element: SVGElement

  _rect(): Rect {
    const {width, height} = this._size()
    const {x, y} = this._computed_position()

    const bbox = new BBox({x, y, width, height})

    return bbox.rect
  }

  set position(p: Position) {
    this._position = p
  }

  get position(): Position {
    return this._position
  }

  get text(): string {
    return this.model.text
  }

  abstract get styled_text(): string

  get provider(): MathJaxProvider {
    return default_provider
  }

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started") {
      await this.provider.fetch()
    }
  }

  override connect_signals(): void {
    super.connect_signals()
    this.on_change(this.model.properties.text, () => this.load_image())
  }

  set visuals(v: visuals.Text["Values"]) {
    const color = v.color
    const alpha = v.alpha
    const style = v.font_style
    let size = v.font_size
    const face = v.font

    const {font_size_scale, _base_font_size} = this
    const res = parse_css_font_size(size)
    if (res != null) {
      let {value, unit} = res
      value *= font_size_scale
      if (unit == "em" && _base_font_size != 0) {
        value *= _base_font_size
        unit = "px"
      }
      size = `${value}${unit}`
    }

    const font = `${style} ${size} ${face}`
    this.font = font
    this.color = color2css(color, alpha)

    const align = v.align
    //this._visual_align = align
    this._x_anchor = align

    const baseline = v.baseline
    this._y_anchor = (() => {
      switch (baseline) {
        case "top": return "top"
        case "middle": return "center"
        case "bottom": return "bottom"
        default: return "baseline"
      }
    })()
  }

  /**
   * Calculates position of element after considering
   * anchor and dimensions
   */
  protected _computed_position(): {x: number, y: number} {
    const {width, height} = this._size()
    const {sx, sy, x_anchor=this._x_anchor, y_anchor=this._y_anchor} = this.position
    const metrics = font_metrics(this.font)

    const x = sx - (() => {
      if (isNumber(x_anchor)) {
        return x_anchor*width
      } else {
        switch (x_anchor) {
          case "left": return 0
          case "center": return 0.5*width
          case "right": return width
        }
      }
    })()

    const y = sy - (() => {
      if (isNumber(y_anchor)) {
        return y_anchor*height
      } else {
        switch (y_anchor) {
          case "top":
            if (metrics.height > height) {
              return (height - (-this.valign - metrics.descent) - metrics.height)
            } else {
              return 0
            }
          case "center": return 0.5*height
          case "bottom":
            if (metrics.height > height) {
              return (
                height + metrics.descent + this.valign
              )
            } else {
              return height
            }
          case "baseline": return 0.5*height
        }
      }
    })()

    return {x, y}
  }

  /**
   * Uses the width, height and given angle to calculate the size
  */
  size(): Size {
    const {width, height} = this._size()
    const {angle} = this

    if (angle == null || angle == 0) {
      return {width, height}
    } else {
      const c = Math.cos(Math.abs(angle))
      const s = Math.sin(Math.abs(angle))

      return {
        width: Math.abs(width*c + height*s),
        height: Math.abs(width*s + height*c),
      }
    }
  }

  private get_image_dimensions(): Size {
    const fmetrics = font_metrics(this.font)

    // XXX: perhaps use getComputedStyle()?
    const svg_styles = this.svg_element.getAttribute("style")?.split(";")
    if (svg_styles != null) {
      const rules_map = new Map()
      svg_styles.forEach(property => {
        const [rule, value] = property.split(":")
        if (rule.trim() != "") {
          rules_map.set(rule.trim(), value.trim())
        }
      })
      const v_align = parse_css_length(rules_map.get("vertical-align"))

      if (v_align?.unit == "ex") {
        this.valign = v_align.value * fmetrics.x_height
      } else if (v_align?.unit == "px") {
        this.valign = v_align.value
      }
    }

    const ex = (() => {
      const width = this.svg_element.getAttribute("width")
      const height = this.svg_element.getAttribute("height")

      return {
        width: width != null && width.endsWith("ex") ? parseFloat(width) : 1,
        height: height != null && height.endsWith("ex") ? parseFloat(height) : 1,
      }
    })()

    return {
      width: fmetrics.x_height*ex.width,
      height: fmetrics.x_height*ex.height,
    }
  }

  get truncated_text() {
    return this.model.text.length > 6
      ? `${this.model.text.substring(0, 6)}...`
      : this.model.text
  }

  width?: {value: number, unit: "%"}
  height?: {value: number, unit: "%"}

  _size(): Size {
    if (this.svg_image == null) {
      if (this.provider.status == "failed" || this.provider.status == "not_started") {
        return {
          width: text_width(this.truncated_text, this.font),
          height: font_metrics(this.font).height,
        }
      } else {
        return {width: this._base_font_size, height: this._base_font_size}
      }
    }

    const fmetrics = font_metrics(this.font)
    let {width, height} = this.get_image_dimensions()
    height = Math.max(height, fmetrics.height)

    const w_scale = this.width?.unit == "%" ? this.width.value : 1
    const h_scale = this.height?.unit == "%" ? this.height.value : 1

    return {width: width*w_scale, height: height*h_scale}
  }

  bbox(): BBox {
    const {p0, p1, p2, p3} = this.rect()

    const left = Math.min(p0.x, p1.x, p2.x, p3.x)
    const top = Math.min(p0.y, p1.y, p2.y, p3.y)
    const right = Math.max(p0.x, p1.x, p2.x, p3.x)
    const bottom = Math.max(p0.y, p1.y, p2.y, p3.y)

    return new BBox({left, right, top, bottom})
  }

  rect(): Rect {
    const rect = this._rect()
    const {angle} = this
    if (angle == null || angle == 0) {
      return rect
    } else {
      const {sx, sy} = this.position
      const tr = new AffineTransform()
      tr.translate(sx, sy)
      tr.rotate(angle)
      tr.translate(-sx, -sy)
      return tr.apply_rect(rect)
    }
  }

  paint_rect(ctx: Context2d): void {
    const {p0, p1, p2, p3} = this.rect()
    ctx.save()
    ctx.strokeStyle = "red"
    ctx.lineWidth = 1
    ctx.beginPath()
    const {round} = Math
    ctx.moveTo(round(p0.x), round(p0.y))
    ctx.lineTo(round(p1.x), round(p1.y))
    ctx.lineTo(round(p2.x), round(p2.y))
    ctx.lineTo(round(p3.x), round(p3.y))
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }

  paint_bbox(ctx: Context2d): void {
    const {x, y, width, height} = this.bbox()
    ctx.save()
    ctx.strokeStyle = "blue"
    ctx.lineWidth = 1
    ctx.beginPath()
    const {round} = Math
    ctx.moveTo(round(x), round(y))
    ctx.lineTo(round(x), round(y + height))
    ctx.lineTo(round(x + width), round(y + height))
    ctx.lineTo(round(x + width), round(y))
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }

  protected abstract _process_text(): HTMLElement | undefined

  async request_image(): Promise<void> {
    if (this.provider.MathJax == null) {
      return
    }

    const mathjax_element = this._process_text()
    if (mathjax_element == null) {
      this._has_finished = true
      return
    }

    const svg_element = mathjax_element.children[0] as SVGElement
    this.svg_element = svg_element

    svg_element.setAttribute("font", this.font)
    svg_element.setAttribute("stroke", this.color)

    const svg = svg_element.outerHTML
    const src = `data:image/svg+xml;utf-8,${encodeURIComponent(svg)}`
    this.svg_image = await load_image(src)
  }

  private async load_image(): Promise<void> {
    await this.request_image()
    this.parent.request_layout()
  }

  /**
   * Takes a Canvas' Context2d and if the image has already
   * been loaded draws the image in it otherwise draws the model's text.
  */
  paint(ctx: Context2d): void {
    if (this.svg_image == null) {
      if (this.provider.status == "not_started" || this.provider.status == "loading") {
        this.provider.ready.connect(() => this.load_image())
      }

      if (this.provider.status == "loaded") {
        void this.load_image()
      }
    }

    ctx.save()
    const {sx, sy} = this.position

    const {angle} = this
    if (angle != null && angle != 0) {
      ctx.translate(sx, sy)
      ctx.rotate(angle)
      ctx.translate(-sx, -sy)
    }

    const {x, y} = this._computed_position()

    if (this.svg_image != null) {
      const {width, height} = this.get_image_dimensions()
      ctx.drawImage(this.svg_image, x, y, width, height)
    } else if (this.provider.status == "failed" || this.provider.status == "not_started") {
      ctx.fillStyle = this.color
      ctx.font = this.font
      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"
      ctx.fillText(this.truncated_text, x, y + font_metrics(this.font).ascent)
    }

    ctx.restore()

    if (!this._has_finished && (this.provider.status == "failed" || this.svg_image != null)) {
      this._has_finished = true
      this.parent.notify_finished_after_paint()
    }
  }
}

export namespace MathText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseText.Props & {
    text: p.Property<string>
  }
}

export interface MathText extends MathText.Attrs {}

export class MathText extends BaseText {
  declare properties: MathText.Props
  declare __view_type__: MathTextView

  constructor(attrs?: Partial<MathText.Attrs>) {
    super(attrs)
  }
}

export class AsciiView extends MathTextView {
  declare model: Ascii

  // TODO: Color ascii
  override get styled_text(): string {
    return this.text
  }

  protected _process_text(): HTMLElement | undefined {
    return undefined // TODO: this.provider.MathJax?.ascii2svg(text)
  }

  override _size(): Size {
    return {
      width: text_width(this.text, this.font),
      height: font_metrics(this.font).height,
    }
  }

  override paint(ctx: Context2d) {
    ctx.save()
    const {sx, sy} = this.position

    const {angle} = this
    if (angle != null && angle != 0) {
      ctx.translate(sx, sy)
      ctx.rotate(angle)
      ctx.translate(-sx, -sy)
    }

    const {x, y} = this._computed_position()
    ctx.fillStyle = this.color
    ctx.font = this.font
    ctx.textAlign = "left"
    ctx.textBaseline = "alphabetic"
    ctx.fillText(this.text, x, y + font_metrics(this.font).ascent)

    ctx.restore()
    this._has_finished = true
    this.parent.notify_finished_after_paint()
  }
}

export namespace Ascii {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MathText.Props
}

export interface Ascii extends Ascii.Attrs {}

export class Ascii extends MathText {
  declare properties: Ascii.Props
  declare __view_type__: AsciiView

  constructor(attrs?: Partial<Ascii.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AsciiView
  }
}

export class MathMLView extends MathTextView {
  declare model: MathML

  override get styled_text(): string {
    let styled = this.text.trim()
    let matches = styled.match(/<math(.*?[^?])?>/s)
    if (matches == null) {
      return this.text.trim()
    }

    styled = insert_text_on_position(
      styled,
      styled.indexOf(matches[0]) + matches[0].length,
      `<mstyle displaystyle="true" mathcolor="${color2hexrgb(this.color)}" ${this.font.includes("bold") ? 'mathvariant="bold"' : "" }>`,
    )

    matches = styled.match(/<\/[^>]*?math.*?>/s)
    if (matches == null) {
      return this.text.trim()
    }

    return insert_text_on_position(styled, styled.indexOf(matches[0]), "</mstyle>")
  }

  protected _process_text(): HTMLElement | undefined {
    const fmetrics = font_metrics(this.font)

    return this.provider.MathJax?.mathml2svg(this.styled_text, {
      em: this.base_font_size,
      ex: fmetrics.x_height,
    })
  }
}

export namespace MathML {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MathText.Props
}

export interface MathML extends MathML.Attrs {}

export class MathML extends MathText {
  declare properties: MathML.Props
  declare __view_type__: MathMLView

  constructor(attrs?: Partial<MathML.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MathMLView
  }
}

export class TeXView extends MathTextView {
  declare model: TeX

  override get styled_text(): string {
    const [r, g, b] = color2rgba(this.color)

    return `\\color[RGB]{${r}, ${g}, ${b}} ${this.font.includes("bold") ? `\\pmb{${this.text}}` : this.text}`
  }

  protected _process_text(): HTMLElement | undefined {
    // TODO: allow plot/document level configuration of macros
    const fmetrics = font_metrics(this.font)

    return this.provider.MathJax?.tex2svg(this.styled_text, {
      display: !this.model.inline,
      em: this.base_font_size,
      ex: fmetrics.x_height,
    }, to_object(this.model.macros))
  }
}

export namespace TeX {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MathText.Props & {
    macros: p.Property<Dict<string | [string, number]>>
    inline: p.Property<boolean>
  }
}

export interface TeX extends TeX.Attrs {}

export class TeX extends MathText {
  declare properties: TeX.Props
  declare __view_type__: TeXView

  constructor(attrs?: Partial<TeX.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TeXView

    this.define<TeX.Props>(({Bool, Float, Str, Dict, Tuple, Or}) => ({
      macros: [ Dict(Or(Str, Tuple(Str, Float))), {} ],
      inline: [ Bool, false ],
    }))
  }
}
