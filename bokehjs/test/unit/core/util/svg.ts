import {expect} from "assertions"

import {SVGRenderingContext2D} from "@bokehjs/core/util/svg"

function stringToHTML(str: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(str, "text/html")
  return doc.body
}

function compare_on_dom(fn: (ctx: CanvasRenderingContext2D) => void, svg: string, {width, height}: {width: number, height: number}) {
  const canvas = document.createElement("canvas")
  canvas.height = height
  canvas.width = width

  document.body.appendChild(canvas)

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

  fn(ctx)
  document.body.appendChild(stringToHTML(svg))
}

describe("SVGRenderingContext2d", () => {
  it("should fill text correctly", () => {
    const size = {width: 50, height: 50}
    const ctx = new SVGRenderingContext2D(size)

    const test = (_ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      _ctx.font = "normal 16px Times"
      _ctx.fillText("TEST", 0, 16)
    }
    test(ctx)

    const svg = ctx.get_serialized_svg()

    compare_on_dom(test, svg, size)

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><defs/><text fill="#000000" stroke="none" font-family="Times" font-size="16px" font-style="normal" font-weight="normal" text-decoration="normal" x="0" y="16" text-anchor="start" dominant-baseline="alphabetic">TEST</text></svg>`)
  })

  it("should stroke text correctly", () => {
    const size = {width: 50, height: 50}
    const ctx = new SVGRenderingContext2D(size)

    const test = (_ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      _ctx.font = "16px serif"
      _ctx.strokeText("TEST", 0, 16)
    }
    test(ctx)

    const svg = ctx.get_serialized_svg()
    compare_on_dom(test, svg, size)

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><defs/><text fill="none" stroke="#000000" font-family="serif" font-size="16px" font-style="normal" font-weight="normal" text-decoration="normal" x="0" y="16" text-anchor="start" dominant-baseline="alphabetic" stroke-miterlimit="10" stroke-dasharray="">TEST</text></svg>`)
  })

  it("should draw arcs correctly", () => {
    const size = {width: 150, height: 200}
    const ctx = new SVGRenderingContext2D(size)

    const test = (_ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Draw shapes
      for (let i = 0; i <= 3; i++) {
        for (let j = 0; j <= 2; j++) {
          _ctx.beginPath()
          let x             = 25 + j * 50                 // x coordinate
          let y             = 25 + i * 50                 // y coordinate
          let radius        = 20                          // Arc radius
          let startAngle    = 0                           // Starting point on circle
          let endAngle      = Math.PI + (Math.PI * j) / 2 // End point on circle
          let counterclockwise = i % 2 == 1               // Draw counterclockwise

          _ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise)

          if (i > 1) {
            _ctx.fill()
          } else {
            _ctx.stroke()
          }
        }
      }
    }

    test(ctx)
    const svg = ctx.get_serialized_svg()
    compare_on_dom(test, svg, size)

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="150" height="200"><defs/><path fill="none" stroke="#000000" paint-order="fill" d="M 45 25 A 20 20 0 0 1 5 25.000000000000004" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 95 25 A 20 20 0 1 1 75 5" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 145 25 A 20 20 0 1 1 144.99999000000082 24.98000000333332" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 45 75 A 20 20 0 1 0 5 75" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 95 75 A 20 20 0 0 0 75 55" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 145 75 A 20 20 0 1 0 144.99999000000082 75.01999999666667" stroke-miterlimit="10" stroke-dasharray=""/><path fill="#000000" stroke="none" paint-order="stroke" d="M 45 125 A 20 20 0 0 1 5 125"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 95 125 A 20 20 0 1 1 75 105"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 145 125 A 20 20 0 1 1 144.99999000000082 124.98000000333332"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 45 175 A 20 20 0 1 0 5 175"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 95 175 A 20 20 0 0 0 75 155"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 145 175 A 20 20 0 1 0 144.99999000000082 175.01999999666668"/></svg>`)
  })


  it("should fill a red rectangle correctly", () => {
    const size = {width: 50, height: 50}
    const ctx = new SVGRenderingContext2D(size)

    const test = (_ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      _ctx.fillStyle="red"
      _ctx.fillRect(10,10,10,10)
    }

    test(ctx)
    const svg = ctx.get_serialized_svg()
    compare_on_dom(test, svg, size)

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><defs/><path fill="red" stroke="none" paint-order="stroke" d="M 10 10 L 20 10 L 20 20 L 10 20 L 10 10"/></svg>`)
  })
})
