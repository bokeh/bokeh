import { Context2d } from "./canvas";

declare namespace MathJax {
  function tex2svg(input: string): HTMLElement
}

export function draw_mathjax_svg(
    text: string,
    x: number,
    y: number,
    angle: number | undefined,
    sx: number,
    sy: number,
    ctx: Context2d
  ) {
  const draw = () => {
    const mathjax_element = MathJax.tex2svg(text)
    mathjax_element.setAttribute('style', 'visibility: hidden;')

    const svg_element = mathjax_element.children[0] as SVGElement

    document.body.appendChild(mathjax_element);

    const outer_html = svg_element.outerHTML,
      blob = new Blob([outer_html], { type: "image/svg+xml;charset=utf-8" })

    const blob_url = URL.createObjectURL(blob)
    const image = new Image()

    const height = parseFloat(getComputedStyle(svg_element, null).getPropertyValue('height'))
    const width = parseFloat(getComputedStyle(svg_element, null).getPropertyValue('width'))

    image.onload = () => {
      if (angle) {
        // known error: everything gets scaled down at half for some reason.
        // Maybe because the canvas is set to 1200x1200 and the div above it to 600x600
        ctx.translate(sx * 2, sy * 2)
        ctx.rotate(angle)
        ctx.translate(-sx * 2, -sy * 2)
      }

      ctx.drawImage(image, x * 2, y * 2, width * 2, height * 2)

      ctx.restore()

      document.getElementsByClassName('MathJax')[0].remove()
    }

    image.src = blob_url
  }

  // known error: this will try to load mathjax scripts many times
  if (typeof MathJax === 'undefined') {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js'
    script.async = false
    document.head.appendChild(script)
    script.onload = draw
  } else {
    draw();
  }
}
