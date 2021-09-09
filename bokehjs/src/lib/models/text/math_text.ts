import * as p from "core/properties"
import * as visuals from "core/visuals"
import {isNumber, isString, isArray} from "core/util/types"
import {Context2d} from "core/util/canvas"
import {load_image} from "core/util/image"
import {CanvasImage} from "models/glyphs/image_url"
import {color2css, color2rgba} from "core/util/color"
import {Size} from "core/types"
import {View} from "core/view"
import {RendererView} from "models/renderers/renderer"
import {TextBox, TextHeightMetric, text_width, Position, Padding, TextAlign, isGraphicsExtents} from "core/graphics"
import {font_metrics, parse_css_font_size, FontMetrics} from "core/util/text"
import {AffineTransform, Rect} from "core/util/affine"
import {BBox} from "core/util/bbox"
import {BaseText} from "./base_text"
import {PlainText} from "./plain_text"
import {MathJaxProvider, BundleProvider} from "./providers"

const default_provider: MathJaxProvider = new BundleProvider()

// TODO: MathTextView should have a property of MathTextBox that
// extends TextBox this got too big trying to implement it
/**
 * Helper class to rendering MathText into Canvas
 */
export abstract class MathTextView extends View implements TextBox {
  override model: MathText
  override parent: RendererView

  calc_padding([top, right, bottom, left]: [number, number, number, number]): {x: number, y: number} {
    return {x: left - right, y: top - bottom}
  }

  compute_padding(): {x: number, y: number} {
    if (!this.padding) return {x: 0, y: 0}
    const {padding} = this

    if (isNumber(padding)) return {x: 0, y: 0}

    if (isArray(padding)) {
      if (padding.length === 2)
        return {x: 0, y: 0}
      if (padding.length === 4) {
        let top = 0, right = 0, bottom = 0, left = 0

        if (isNumber(padding[0])) top = padding[0]
        else {
          if (padding[0].unit === "px") top = padding[0].value
          else top = padding[0].value * this.dimensions().height
        }
        if (isNumber(padding[2])) bottom = padding[2]
        else {
          if (padding[2].unit === "px") bottom = padding[2].value
          else bottom = padding[2].value * this.dimensions().height
        }

        if (isNumber(padding[1])) right = padding[1]
        else {
          if (padding[1].unit === "px") right = padding[1].value
          else right = padding[1].value * this.dimensions().width
        }
        if (isNumber(padding[2])) left = padding[2]
        else {
          if (padding[2].unit === "px") left = padding[2].value
          else left = padding[2].value * this.dimensions().width
        }

        return this.calc_padding([top, right, bottom, left])
      }
    }

    if (isGraphicsExtents(padding)) {
      let top=0, right=0, bottom=0, left=0

      if (isNumber(padding.top)) top = padding.top
      else {
        if (padding.top.unit === "px") top = padding.top.value
        else top = padding.top.value * this.dimensions().height
      }
      if (isNumber(padding.bottom)) bottom = padding.bottom
      else {
        if (padding.bottom.unit === "px") bottom = padding.bottom.value
        else bottom = padding.bottom.value * this.dimensions().height
      }

      if (isNumber(padding.right)) right = padding.right
      else {
        if (padding.right.unit === "px") right = padding.right.value
        else right = padding.right.value * this.dimensions().width
      }
      if (isNumber(padding.left)) left = padding.left
      else {
        if (padding.left.unit === "px") left = padding.left.value
        else left = padding.left.value * this.dimensions().width
      }

      return this.calc_padding([top, right, bottom, left])
    } else {
      return {x: 0, y: 0}
    }
  }

  _align: TextAlign = "left"

  set_text_visuals(v: visuals.Text): void {
    const color = v.text_color.get_value()
    const alpha = v.text_alpha.get_value()
    const style = v.text_font_style.get_value()
    let size = v.text_font_size.get_value()
    const face = v.text_font.get_value()

    const {font_size_scale, base_font_size} = this
    const res = parse_css_font_size(size)
    if (res != null) {
      let {value, unit} = res
      value *= font_size_scale
      if (unit == "em" && base_font_size) {
        value *= base_font_size
        unit = "px"
      }
      size = `${value}${unit}`
    }

    const font = `${style} ${size} ${face}`
    this.font = font
    this.color = color2css(color, alpha)
    this.line_height = v.text_line_height.get_value()
  }

  get_baseline_anchor(): number {
    const {height} = this.dimensions()
    return 0.5*height
  }

  _angle?: number | undefined

  line_height: number
  _text_line(_fmetrics: FontMetrics): { height: number, ascent: number, descent: number } {
    throw new Error("Method not implemented.")
  }
  get nlines(): number {
    throw new Error("Method not implemented.")
  }
  padding?: Padding
  text_height_metric?: TextHeightMetric | undefined

  angle: number
  width?: {value: number, unit: "%"}
  height?: {value: number, unit: "%"}

  _position: Position = {sx: 0, sy: 0}
  // TODO: implement align macro
  // http://docs.mathjax.org/en/latest/input/tex/macros/index.html?highlight=align
  align: "left" | "center" | "right" | "justify" = "left"
  // Just to be compatible with textbox
  infer_text_height(): TextHeightMetric {
    return "ascent_descent"
  }

  _base_font_size: number = 13 // the same as .bk-root's font-size (13px)

  set base_font_size(v: number | null | undefined) {
    if (v != null)
      this._base_font_size = v
  }

  get base_font_size(): number {
    return this._base_font_size
  }

  font_size_scale: number = 1.0
  color: string
  font: string
  private svg_image: CanvasImage | null = null
  private svg_element: SVGElement

  get has_loaded(): boolean {
    return this.has_image_loaded || this._has_finished
  }

  get has_image_loaded(): boolean {
    return this.svg_image != null
  }

  _rect(): Rect {
    const {width, height} = this.dimensions()
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

  get provider(): MathJaxProvider {
    return default_provider
  }

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started")
      await this.provider.fetch()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.on_change(this.model.properties.text, () => this.load_image())
  }

  set visuals(v: visuals.Text) {
    this.set_text_visuals(v)
  }

  /**
   * Calculates position of element after considering
   * anchor and dimensions
   */
  _computed_position(): {x: number, y: number} {
    const {width, height, metrics} = this.dimensions()
    const {sx, sy, x_anchor="left", y_anchor="center"} = this.position

    const y = sy - (() => {
      if (isNumber(y_anchor))
        return y_anchor*height
      else {
        switch (y_anchor) {
          case "top": return 0
          case "center": return 0.5*height
          case "bottom": return height
          case "baseline": return 0.5*height
        }
      }
    })()

    const x = sx - (() => {
      if (isNumber(x_anchor))
        return x_anchor*width
      else {
        switch (x_anchor) {
          case "left": return 0
          case "center": return 0.5*width
          case "right": return width
        }
      }
    })()

    if (height < metrics.height) {
      if (y_anchor == "bottom")
        return {x, y: y - metrics.descent}
      if (y_anchor == "top")
        return {x, y: y + this.compute_padding().y}
    }

    return {x, y}
  }

  /**
   * Uses the width, height and given angle to calculate the size
  */
  size(): Size {
    let {width, height, metrics} = this.dimensions()
    const {angle} = this

    if (height < metrics.height) {
      height = metrics.height
    }

    if (!angle)
      return {width, height}
    else {
      const c = Math.cos(Math.abs(angle))
      const s = Math.sin(Math.abs(angle))

      return {
        width: Math.abs(width*c + height*s),
        height: Math.abs(width*s + height*c),
      }
    }
  }

  private get_text_dimensions(fmetrics: FontMetrics): Size {
    return {
      width: text_width(this.model.text, this.font),
      height: fmetrics.height,
    }
  }

  private get_image_dimensions(fmetrics: FontMetrics): Size {
    const heightEx = parseFloat(
      this.svg_element
        .getAttribute("height")
        ?.replace(/([A-z])/g, "") ?? "0"
    )

    const widthEx = parseFloat(
      this.svg_element
        .getAttribute("width")
        ?.replace(/([A-z])/g, "") ?? "0"
    )

    let v_align = parseFloat(
      this.svg_element
        ?.getAttribute("style")
        ?.replace(/\-?[A-z\: ;]/g, "") ?? "0"
    ) * fmetrics.x_height

    const width = fmetrics.x_height * widthEx
    const height = fmetrics.x_height * heightEx

    if (height < fmetrics.height) {
      v_align -=  fmetrics.height - height
    }

    this.padding = {
      top: 0,
      right: 0,
      bottom: font_metrics(this.font).descent + v_align,
      left: 0,
    }

    return {width, height}
  }

  dimensions(): Size & {metrics: FontMetrics} {
    const fmetrics = font_metrics(this.font)
    const {width, height} = this.has_image_loaded ? this.get_image_dimensions(fmetrics) : this.get_text_dimensions(fmetrics)
    const w_scale = this.width?.unit == "%" ? this.width.value : 1
    const h_scale = this.height?.unit == "%" ? this.height.value : 1

    return {width: width*w_scale, height: height*h_scale, metrics: fmetrics}
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
    if (!angle)
      return rect
    else {
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

  protected abstract _process_text(text: string): HTMLElement | undefined

  private async load_image(): Promise<HTMLImageElement | null> {
    if (this.provider.MathJax == null)
      return null

    const mathjax_element = this._process_text(this.model.text)
    if (mathjax_element == null) {
      this._has_finished = true
      return null
    }

    const svg_element = mathjax_element.children[0] as SVGElement
    this.svg_element = svg_element

    svg_element.setAttribute("font", this.font)
    svg_element.setAttribute("stroke", this.color)

    const outer_HTML = svg_element.outerHTML
    const blob = new Blob([outer_HTML], {type: "image/svg+xml"})
    const url = URL.createObjectURL(blob)

    try {
      this.svg_image = await load_image(url)
    } finally {
      URL.revokeObjectURL(url)
    }

    this.parent.request_layout()
    return this.svg_image
  }

  /**
   * Takes a Canvas' Context2d and if the image has already
   * been loaded draws the image in it otherwise draws the model's text.
  */
  paint(ctx: Context2d): void {
    if (!this.svg_image) {
      if (this.provider.status == "not_started" || this.provider.status == "loading")
        this.provider.ready.connect(() => this.load_image())

      if (this.provider.status == "loaded")
        this.load_image()
    }

    ctx.save()
    const {sx, sy} = this.position

    if (this.angle) {
      ctx.translate(sx, sy)
      ctx.rotate(this.angle)
      ctx.translate(-sx, -sy)
    }

    const {x, y} = this._computed_position()
    const {width, height, metrics} = this.dimensions()

    if (this.svg_image) {
      ctx.drawImage(this.svg_image, x, y, width, height)
    } else {
      ctx.fillStyle = this.color
      ctx.font = this.font
      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"
      ctx.fillText(this.model.text, x, y + metrics.ascent)
    }
    ctx.restore()

    if (!this._has_finished && (this.provider.status == "failed" || this.has_image_loaded)) {
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
  override properties: MathText.Props
  override __view_type__: MathTextView

  constructor(attrs?: Partial<MathText.Attrs>) {
    super(attrs)
  }
}

export class AsciiView extends MathTextView {
  override model: Ascii

  protected _process_text(_text: string): HTMLElement | undefined {
    return undefined // TODO: this.provider.MathJax?.ascii2svg(text)
  }
}

export namespace Ascii {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MathText.Props
}

export interface Ascii extends Ascii.Attrs {}

export class Ascii extends MathText {
  override properties: Ascii.Props
  override __view_type__: AsciiView

  constructor(attrs?: Partial<Ascii.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AsciiView
  }
}

export class MathMLView extends MathTextView {
  override model: MathML

  protected _process_text(text: string): HTMLElement | undefined {
    return this.provider.MathJax?.mathml2svg(text.trim())
  }
}

export namespace MathML {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MathText.Props
}

export interface MathML extends MathML.Attrs {}

export class MathML extends MathText {
  override properties: MathML.Props
  override __view_type__: MathMLView

  constructor(attrs?: Partial<MathML.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MathMLView
  }
}

export class TeXView extends MathTextView {
  override model: TeX

  protected _process_text(text: string): HTMLElement | undefined {
    const fmetrics = font_metrics(this.font)
    const [r, g, b] = color2rgba(this.color)
    // TODO: allow plot/document level configuration of macros
    return this.provider.MathJax?.tex2svg(
      `\\color[RGB]{${r}, ${g}, ${b}} ${text}`,
      {
        display: !this.model.inline,
        em: this.base_font_size,
        ex: fmetrics.x_height,
      },
      this.model.macros
    )
  }
}

export namespace TeX {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MathText.Props & {
    macros: p.Property<{[key: string]: string | [string, number]}>
    inline: p.Property<boolean>
  }
}

export interface TeX extends TeX.Attrs {}

export class TeX extends MathText {
  override properties: TeX.Props
  override __view_type__: TeXView

  constructor(attrs?: Partial<TeX.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TeXView

    this.define<TeX.Props>(({Number, String, Dict, Tuple, Or, Boolean}) => ({
      macros: [ Dict(Or(String, Tuple(String, Number))), {} ],
      inline: [ Boolean, false ],
    }))
  }

  static find_math_parts(text: string): (PlainText | TeX)[] {
    type Delimiter = {
      start: string
      end: string
      inline: boolean
      nextIndex?: number
    }

    const delimiters: Delimiter[] = [
      {start: "$$", end: "$$", inline: false},
      {start: "\\[", end: "\\]", inline: false},
      {start: "\\(", end: "\\)", inline: true},
    ]

    const result: (PlainText | TeX)[] = []
    let remaining_text = text

    const find_end = (delimiter?: Delimiter) => {
      if (!delimiter) {
        result.push(new PlainText({text: remaining_text}))
        remaining_text = ""
        return
      }

      if (remaining_text.includes(delimiter.start)) {
        const index = remaining_text.indexOf(delimiter.start)

        if (remaining_text.slice(index + 2).includes(delimiter.end)) {
          result.push(new PlainText({text: remaining_text.slice(0, index)}))
          remaining_text = remaining_text.slice(index + 2)

          const closing_index = remaining_text.indexOf(delimiter.end)
          result.push(new TeX({text: remaining_text.slice(0, closing_index), inline: delimiter.inline}))
          remaining_text = remaining_text.slice(closing_index + 2)
        }
      }
    }

    const find_next_delimiter = () => delimiters
      .map(delimiter => ({...delimiter, nextIndex: remaining_text.indexOf(delimiter.start)}))
      .sort((a, b) => a.nextIndex - b.nextIndex)
      .filter(delimiter => delimiter.nextIndex >= 0)[0]

    while (remaining_text) {
      find_end(find_next_delimiter())
    }

    return result.filter(Boolean)
  }

  static includes_math(text: unknown): text is string {
    if (!isString(text)) return false

    if (text.includes("$$")) {
      const index = text.indexOf("$$")
      if (text.slice(index + 2).includes("$$"))
        return true
    }

    if (text.includes("\\[")) {
      const index = text.indexOf("\\[")
      if (text.slice(index + 2).includes("\\]"))
        return true
    }

    if (text.includes("\\(")) {
      const index = text.indexOf("\\(")
      if (text.slice(index + 2).includes("\\)"))
        return true
    }

    return false
  };

  static from_text_like(text: string | BaseText): TeX | null {
    let math_text: TeX = new TeX()

    if (text instanceof TeX)
      math_text = text
    else if (TeX.includes_math(text))
      math_text.text = text
    else
      return null

    return math_text
  }
}
