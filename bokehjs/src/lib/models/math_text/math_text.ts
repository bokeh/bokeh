import * as p from "core/properties"
import * as visuals from "core/visuals"
import {Signal0} from "core/signaling"
import {isNumber} from "core/util/types"
import {Context2d} from "core/util/canvas"
import {ImageLoader} from "core/util/image"
import {CanvasImage} from "models/glyphs/image_url"
import {Model} from "../../model"
import {color2css} from "core/util/color"
import {Size} from "core/types"
import {View} from "core/view"
import {RendererView} from "models/renderers/renderer"
import {GraphicsBox, TextHeightMetric, text_width} from "core/graphics"
import {font_metrics, parse_css_font_size} from "core/util/text"
import {AffineTransform, Rect} from "core/util/affine"
import {BBox} from "core/util/bbox"

type Position = {
  sx: number
  sy: number
  x_anchor?: number | "left" | "center" | "right"
  y_anchor?: number | "top"  | "center" | "baseline" | "bottom"
}

const mathjax_ready = new Signal0({}, "mathjax_ready")

let mathjax_status: "not_started" | "loaded" | "loading" | "failed" = "not_started"

/**
 * Helper class to rendering MathText into Canvas
 */
export class MathTextView extends View implements GraphicsBox {
  override model: MathText
  override parent: RendererView

  angle?: number
  _position: Position = {sx: 0, sy: 0}
  has_image_loaded = false
  // Align does nothing, needed to maintain compatibility with TextBox,
  // to align you need to use TeX Macros.
  // http://docs.mathjax.org/en/latest/input/tex/macros/index.html?highlight=align
  align: "left" | "center" | "right" | "justify" = "left"
  // Same for infer_text_height
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
  private font: string
  private color: string
  private svg_image: CanvasImage
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

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (mathjax_status == "not_started")
      this.load_math_jax_script()

    if (mathjax_status == "not_started" || mathjax_status == "loading") {
      mathjax_ready.connect(async () => {
        await this.load_image()
        this.parent.request_paint()
      })
    }

    if (mathjax_status == "loaded")
      await this.load_image()
  }

  set visuals(v: visuals.Text) {
    const color = v.text_color.get_value()
    const alpha = v.text_alpha.get_value()
    const style = v.text_font_style.get_value()
    let size = v.text_font_size.get_value()
    const face = v.text_font.get_value()

    const {font_size_scale, _base_font_size} = this
    const res = parse_css_font_size(size)
    if (res != null) {
      let {value, unit} = res
      value *= font_size_scale
      if (unit == "em" && _base_font_size) {
        value *= _base_font_size
        unit = "px"
      }
      size = `${value}${unit}`
    }

    const font = `${style} ${size} ${face}`
    this.font = font
    this.color = color2css(color, alpha)
  }

  /**
   * Calculates position of element after considering
   * anchor and dimensions
   */
  protected _computed_position(): {x: number, y: number} {
    const {width, height} = this._size()
    const {sx, sy, x_anchor="left", y_anchor="center"} = this.position

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

    return {x, y}
  }

  /**
   * Uses the width, height and given angle to calculate the size
  */
  size(): Size {
    const {width, height} = this._size()
    const {angle} = this

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

  private get_text_dimensions(): Size {
    return {
      width: text_width(this.model.text, this.font),
      height: font_metrics(this.font).height,
    }
  }

  private get_image_dimensions(): Size {
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

    return {
      width: font_metrics(this.font).x_height * widthEx,
      height: font_metrics(this.font).x_height * heightEx,
    }
  }

  _size(): Size {
    return this.has_image_loaded
      ? this.get_image_dimensions()
      : this.get_text_dimensions()
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

  private load_math_jax_script(): void {
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
    script.onload = () => {
      mathjax_status = "loaded"
      mathjax_ready.emit()
    }
    script.onerror = () => {
      mathjax_status = "failed"
    }
    mathjax_status = "loading"
    document.head.appendChild(script)
  }

  private get_math_jax(): typeof MathJax | null {
    return typeof MathJax === "undefined" ? null : MathJax
  }

  /**
   * Render text into a SVG with MathJax and load it into memory.
   */
  private async load_image(): Promise<HTMLImageElement | null> {
    const MathJax = this.get_math_jax()
    if (MathJax == null)
      return null

    const mathjax_element = MathJax.tex2svg(this.model.text)
    const svg_element = mathjax_element.children[0] as SVGElement
    svg_element.setAttribute("font", this.font)
    svg_element.setAttribute("stroke", this.color)

    this.svg_element = svg_element

    const outer_HTML = svg_element.outerHTML
    const blob = new Blob([outer_HTML], {type: "image/svg+xml"})
    const url = URL.createObjectURL(blob)

    const image_loader = new ImageLoader(url, {
      loaded: (image) => {
        this.svg_image = image
        this.has_image_loaded = true

        URL.revokeObjectURL(url)

        this.parent.request_paint()
      },
    })

    return image_loader.promise
  }

  /**
   * Takes a Canvas' Context2d and if the image has already
   * been loaded draws the image in it otherwise draws the model's text.
  */
  paint(ctx: Context2d): void {
    ctx.save()
    const {sx, sy} = this.position

    if (this.angle) {
      ctx.translate(sx, sy)
      ctx.rotate(this.angle)
      ctx.translate(-sx, -sy)
    }

    const {x, y} = this._computed_position()

    if (this.has_image_loaded) {
      const {width, height} = this.get_image_dimensions()
      ctx.drawImage(this.svg_image, x, y, width, height)
    } else {
      ctx.fillStyle = this.color
      ctx.font = this.font
      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"
      ctx.fillText(this.model.text, x, y + font_metrics(this.font).ascent)
    }
    ctx.restore()

    if (mathjax_status == "loaded" && !this.has_image_loaded)
      this.load_image()

    if (mathjax_status == "failed" || this.has_image_loaded) {
      this._has_finished = true
      this.notify_finished()
    }
  }
}

export namespace MathText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    text: p.Property<string>
  }
}

export interface MathText extends MathText.Attrs {}

export class MathText extends Model {
  override properties: MathText.Props
  override __view_type__: MathTextView

  constructor(attrs?: Partial<MathText.Attrs>) {
    super(attrs)
  }

  static init_MathText(): void {
    this.prototype.default_view = MathTextView

    this.define<MathText.Props>(({String}) => ({
      text: [ String ],
    }))
  }
}
