import * as p from "core/properties"
import * as visuals from "core/visuals"
import {isNumber} from "core/util/types"
import {Context2d} from "core/util/canvas"
import {ImageLoader} from "core/util/image"
import {CanvasImage} from "models/glyphs/image_url"
import {Model} from "../../model"
import {color2css} from "core/util/color"
import {Size} from "core/types"
import {View} from "core/view"
import {RendererView} from "models/renderers/renderer"
import {text_width} from "core/graphics"
import {font_metrics} from "core/util/text"

type Position = {
  sx: number
  sy: number
  x_anchor?: number | "left" | "center" | "right"
  y_anchor?: number | "top"  | "center" | "baseline" | "bottom"
}

/**
 * Helper class to rendering MathText into Canvas
 */
export class MathTextView extends View {
  override model: MathText
  override parent: RendererView

  angle?: number
  position: Position = {sx: 0, sy: 0}
  has_image_loaded = false
  // Align does nothing, needed to maintain compatibility with TextBox,
  // to align you need to use TeX Macros.
  // http://docs.mathjax.org/en/latest/input/tex/macros/index.html?highlight=align
  align: "left" | "center" | "right" | "justify" = "left"

  private font_size_scale: number = 1.0
  private font: string
  private height: number
  private width: number
  private color: string
  private svg_image: CanvasImage
  private svg_element: SVGElement

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (!this.get_math_jax())
      this.load_math_jax_script()
  }

  set visuals(v: visuals.Text) {
    const color = v.text_color.get_value()
    const alpha = v.text_alpha.get_value()
    const style = v.text_font_style.get_value()
    let size = v.text_font_size.get_value()
    const face = v.text_font.get_value()

    const {font_size_scale} = this
    if (font_size_scale != 1.0) {
      const match = size.match(/^\s*(\d+(\.\d+)?)(\w+)\s*$/)
      if (match != null) {
        const [, value,, unit] = match
        const number = Number(value)
        if (!isNaN(number))
          size = `${number*font_size_scale}${unit}`
      }
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
    const {width, height} = this.get_dimensions()
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
    const {width, height} = this.get_dimensions()
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

  private get_dimensions(): Size {
    return this.has_image_loaded
      ? this.get_image_dimensions()
      : this.get_text_dimensions()
  }

  private load_math_jax_script(): void {
    // Check for a script with the id set below
    if (!document.getElementById("bokeh_mathjax_script")) {
      const script = document.createElement("script")
      script.id = "bokeh_mathjax_script"
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
      script.onload = () => this.parent.request_paint()
      document.head.appendChild(script)
    }
  }

  private get_math_jax(): typeof MathJax | null {
    return typeof MathJax === "undefined" ? null : MathJax
  }

  /**
   * Render text into a SVG with MathJax and load it into memory.
   */
  private load_image(): Promise<HTMLImageElement> {
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
      ctx.drawImage(this.svg_image, x, y, this.width, this.height)

      this.notify_finished()
    } else {
      ctx.fillStyle = this.color
      ctx.font = this.font
      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"
      ctx.fillText(this.model.text, x, y + font_metrics(this.font).ascent)
    }
    ctx.restore()

    if (this.get_math_jax() && !this.has_image_loaded)
      this.load_image()
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
