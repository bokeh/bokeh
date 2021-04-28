import numpy as np
from scipy.special import jv

from bokeh.models import Label
from bokeh.palettes import Spectral4
from bokeh.plotting import figure, show
from bokeh.util.compiler import TypeScript


class LatexLabel(Label):
    """A subclass of `Label` with additional class attributes 'width' and 'height',
    canvas mode isn't supported and DOM manipulation happens in the TypeScript
    superclass implementation that requires setting `render_mode='css'`).

    Only the render method of LabelView is overwritten to perform the
    text -> latex (via MathJax) conversion
    """

    __javascript__ = ["https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"]
    __implementation__ = TypeScript("""
import {Label, LabelView} from "models/annotations/label"
import * as p from "core/properties"
import {ImageLoader} from "core/util/image"

declare namespace MathJax {
  function tex2svg(input: string): HTMLElement
}

export class LatexLabelView extends LabelView {
  model: LatexLabel
  image: HTMLImageElement | undefined
  width: number
  height: number

  initialize(): void {
    super.initialize()
    const mathjax_element = MathJax.tex2svg(this.model.text)

    mathjax_element.setAttribute('style', 'visibility: hidden;')
    document.body.appendChild(mathjax_element)

    const svg_element = mathjax_element.children[0] as SVGElement
    const outer_HTML = svg_element.outerHTML
    const blob = new Blob([outer_HTML],{type:'image/svg+xml;charset=utf-8'})
    const url = URL.createObjectURL(blob)

    this.height = parseFloat(getComputedStyle(svg_element, null).getPropertyValue('height'))
    this.width = parseFloat(getComputedStyle(svg_element, null).getPropertyValue('width'))

    document.getElementsByClassName('MathJax')[0].remove()

    new ImageLoader(url, {
      loaded: (image) => {
        this.image = image
        this.request_render()
        URL.revokeObjectURL(url)
      },
    })
  }

  protected _render(): void {
    if(this.image) {
      const panel = this.layout != null ? this.layout : this.plot_view.frame

      const xscale = this.coordinates.x_scale
      const yscale = this.coordinates.y_scale

      let sx = this.model.x_units == "data" ? xscale.compute(this.model.x) : panel.bbox.xview.compute(this.model.x)
      let sy = this.model.y_units == "data" ? yscale.compute(this.model.y) : panel.bbox.yview.compute(this.model.y)

      sx += this.model.x_offset
      sy -= this.model.y_offset
      this.layer.ctx.drawImage(this.image, sx, sy, this.width, this.height)

      this.notify_finished()
    }
  }
}

export namespace LatexLabel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Label.Props
}

export interface LatexLabel extends LatexLabel.Attrs {}

export class LatexLabel extends Label {
  properties: LatexLabel.Props
  __view_type__: LatexLabelView

  static init_LatexLabel(): void {
    this.prototype.default_view = LatexLabelView
  }
}
""")

p = figure(title="LaTex Extension Demonstration", width=800, height=350,
           background_fill_color="#fafafa")
p.x_range.range_padding = 0

x = np.arange(0.0, 20.0, 0.02)

for i, n in enumerate([0, 1, 4, 7]):
    p.line(x, jv(n, x), line_width=3, color=Spectral4[i], alpha=0.8, legend_label="𝜈=%d" % n)

text = ("x = {-b \pm \sqrt{b^2-4ac} \over 2a}")

latex = LatexLabel(text=text, x=4.5, y=250, x_units='data', y_units='screen',
                   render_mode='css', text_font_size='11px',
                   background_fill_color="white", border_line_color="lightgrey")

p.add_layout(latex)

show(p)
