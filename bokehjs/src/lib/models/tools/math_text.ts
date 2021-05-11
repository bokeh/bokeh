import * as p from "core/properties"
import {isNumber} from "core/util/types"
import {Context2d} from "core/util/canvas"
import {ImageLoader} from "core/util/image"
import {CanvasImage} from "models/glyphs/image_url"
import {Model} from "../../model"


declare namespace MathJax {
  function tex2svg(input: string): HTMLElement
}

export namespace MathText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    text: p.Property<string>
  }
}

export interface MathText extends MathText.Attrs {}

type Position = {
  sx: number
  sy: number
  x_anchor?: number | "left" | "center" | "right"
  y_anchor?: number | "top"  | "center" | "baseline" | "bottom"
}

export class MathText extends Model {
  override properties: MathText.Props

  image: CanvasImage
  height: number
  width: number
  mathjax_instantiated = false

  constructor(attrs?: Partial<MathText.Attrs>) {
    super(attrs)
  }

  static init_MathText(): void {
    this.define<MathText.Props>(({String}) => ({
      text: [ String ],
    }))
  }

  protected _computed_position(position: Position): {x: number, y: number} {
    const {width, height} = this
    const {sx, sy, x_anchor="left", y_anchor="center"} = position

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

  draw_image(ctx: Context2d, position: Position, angle: number): void {
    if (this.image) {
      ctx.save()
      const {sx, sy} = position

      if (angle) {
        ctx.translate(sx, sy)
        ctx.rotate(angle)
        ctx.translate(-sx, -sy)
      }

      const {x, y} = this._computed_position(position)

      ctx.drawImage(this.image, x, y, this.width, this.height)
      ctx.restore()
    }
  }

  load_image(color: string) {
    if (!this.mathjax_instantiated) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js'
      script.async = false
      document.head.appendChild(script)
      this.mathjax_instantiated = true
    }
    if (typeof MathJax === 'undefined') return

    const mathjax_element = MathJax.tex2svg(this.text)

    document.body.appendChild(mathjax_element)

    const svg_element = mathjax_element.children[0] as SVGElement
    svg_element.setAttribute('stroke', color)

    const outer_HTML = svg_element.outerHTML
    const blob = new Blob([outer_HTML], {type: 'image/svg+xml;charset=utf-8'})
    const url = URL.createObjectURL(blob)

    this.height = parseFloat(getComputedStyle(svg_element, null).getPropertyValue('height'))
    this.width = parseFloat(getComputedStyle(svg_element, null).getPropertyValue('width'))

    mathjax_element.remove()

    new ImageLoader(url, {
      loaded: (image) => {
        this.image = image
      },
    })
  }
}
