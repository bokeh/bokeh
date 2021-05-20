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

declare global {
  interface Window {
    _bokeh_mathjax_instantiated: boolean
  }
}

type Position = {
  sx: number
  sy: number
  x_anchor?: number | "left" | "center" | "right"
  y_anchor?: number | "top"  | "center" | "baseline" | "bottom"
}

export class MathTextView extends View {
  override model: MathText

  angle?: number
  font_size_scale: number = 1.0
  font: string
  height: number
  position: Position = {sx: 0, sy: 0}
  width: number
  color: string
  svg_image: CanvasImage

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


  protected _computed_position(): {x: number, y: number} {
    const {width, height} = this
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

  draw_image(ctx: Context2d): void {
    if (this.svg_image) {
      ctx.save()
      const {sx, sy} = this.position

      if (this.angle) {
        ctx.translate(sx, sy)
        ctx.rotate(this.angle)
        ctx.translate(-sx, -sy)
      }

      const {x, y} = this._computed_position()

      ctx.drawImage(this.svg_image, x, y, this.width, this.height)
      ctx.restore()
    }
  }

  /**
   * Uses the width, height and given angle to calculate the size
  */
  size(): Size {
    const {width, height} = this.getDimensions()
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

  /**
   * Get width and height from SVGElement
   */
  private getDimensions(): Size {
    if (typeof MathJax === 'undefined') return {width: 0, height: 0}

    const mathjax_element = MathJax.tex2svg(this.model.text)

    document.body.appendChild(mathjax_element)

    const svg_element = mathjax_element.children[0] as SVGElement
    svg_element.setAttribute('font', this.font)

    const {width, height} = svg_element.getBoundingClientRect()

    mathjax_element.remove()

    return {width, height}
  }

  /**
   * Calls ImageLoader after rendering the text into a SVG with MathJax.
   * Starts Mathjax script loading if its not present in the global context.
   */
  load_image(): void {
    if (!document.getElementById('bokeh_mathjax_script') && typeof MathJax === 'undefined') {
      const script = document.createElement('script')
      script.id = "bokeh_mathjax_script"
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js'
      document.head.appendChild(script)
    }

    if (typeof MathJax === 'undefined') return

    const mathjax_element = MathJax.tex2svg(this.model.text)

    document.body.appendChild(mathjax_element)

    const svg_element = mathjax_element.children[0] as SVGElement
    svg_element.setAttribute('font', this.font)
    svg_element.setAttribute('stroke', this.color)

    const outer_HTML = svg_element.outerHTML
    const blob = new Blob([outer_HTML], {type: 'image/svg+xml;charset=utf-8'})
    const url = URL.createObjectURL(blob)

    const {width, height} = svg_element.getBoundingClientRect()
    this.width = width
    this.height = height

    mathjax_element.remove()

    new ImageLoader(url, {
      loaded: (image) => {
        this.svg_image = image
      },
    })
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
