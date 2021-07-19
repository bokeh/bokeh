import {expect} from "assertions"
import {compare_on_dom} from "../../../framework"
import {SVGRenderingContext2D} from "@bokehjs/core/util/svg"

describe("SVGRenderingContext2d", () => {
  it("should fill text correctly", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      ctx.font = "normal 16px Times"
      ctx.fillText("TEST", 0, 16)
    }

    const size = {width: 50, height: 50}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><defs/><text fill="#000000" stroke="none" font-family="Times" font-size="16px" font-style="normal" font-weight="normal" text-decoration="normal" x="0" y="16" text-anchor="start" dominant-baseline="alphabetic">TEST</text></svg>')
  })

  it("should stroke text correctly", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      ctx.font = "16px serif"
      ctx.strokeText("TEST", 0, 16)
    }

    const size = {width: 50, height: 50}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><defs/><text fill="none" stroke="#000000" font-family="serif" font-size="16px" font-style="normal" font-weight="normal" text-decoration="normal" x="0" y="16" text-anchor="start" dominant-baseline="alphabetic" stroke-miterlimit="10" stroke-dasharray="">TEST</text></svg>')
  })

  it("should draw arcs correctly", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Draw shapes
      for (let i = 0; i <= 3; i++) {
        for (let j = 0; j <= 2; j++) {
          ctx.beginPath()
          const x             = 25 + j * 50                 // x coordinate
          const y             = 25 + i * 50                 // y coordinate
          const radius        = 20                          // Arc radius
          const start_angle    = 0                           // Starting point on circle
          const end_angle      = Math.PI + (Math.PI * j) / 2 // End point on circle
          const counterclockwise = i % 2 == 1               // Draw counterclockwise

          ctx.arc(x, y, radius, start_angle, end_angle, counterclockwise)

          if (i > 1) {
            ctx.fill()
          } else {
            ctx.stroke()
          }
        }
      }
    }

    const size = {width: 150, height: 200}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="150" height="200"><defs/><path fill="none" stroke="#000000" paint-order="fill" d="M 45 25 A 20 20 0 0 1 5 25.000000000000004" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 95 25 A 20 20 0 1 1 75 5" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 145 25 A 20 20 0 1 1 144.99999000000082 24.98000000333332" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 45 75 A 20 20 0 1 0 5 75" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 95 75 A 20 20 0 0 0 75 55" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 145 75 A 20 20 0 1 0 144.99999000000082 75.01999999666667" stroke-miterlimit="10" stroke-dasharray=""/><path fill="#000000" stroke="none" paint-order="stroke" d="M 45 125 A 20 20 0 0 1 5 125"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 95 125 A 20 20 0 1 1 75 105"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 145 125 A 20 20 0 1 1 144.99999000000082 124.98000000333332"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 45 175 A 20 20 0 1 0 5 175"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 95 175 A 20 20 0 0 0 75 155"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 145 175 A 20 20 0 1 0 144.99999000000082 175.01999999666668"/></svg>')
  })


  it("should fill a red rectangle correctly", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      ctx.fillStyle="red"
      ctx.fillRect(10, 10, 10, 10)
    }

    const size = {width: 50, height: 50}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><defs/><path fill="red" stroke="none" paint-order="stroke" d="M 10 10 L 20 10 L 20 20 L 10 20 L 10 10"/></svg>')
  })

  it("should rotate a shape", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Point of transform origin
      ctx.arc(0, 0, 5, 0, 2 * Math.PI)
      ctx.fillStyle = "blue"
      ctx.fill()

      // Non-rotated rectangle
      ctx.fillStyle = "gray"
      ctx.fillRect(100, 0, 80, 20)

      // Rotated rectangle
      ctx.rotate(45 * Math.PI / 180)
      ctx.fillStyle = "red"
      ctx.fillRect(100, 0, 80, 20)

      // Reset transformation matrix to the identity matrix
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="150"><defs/><path fill="blue" stroke="none" paint-order="stroke" d="M 5 0 A 5 5 0 1 1 4.999997500000209 -0.004999999166669603"/><path fill="gray" stroke="none" paint-order="stroke" d="M 100 0 L 180 0 L 180 20 L 100 20 L 100 0"/><path fill="red" stroke="none" paint-order="stroke" d="M 70.71067811865476 70.71067811865474 L 127.27922061357856 127.27922061357854 L 113.13708498984761 141.4213562373095 L 56.568542494923804 84.85281374238569 L 70.71067811865476 70.71067811865474"/></svg>')
  })

  it("support multiple transforms", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      ctx.translate(0, 20)
      ctx.fillRect(0, 0, 10, 10)

      ctx.translate(10, 20)
      ctx.fillRect(0, 0, 10, 10)

      ctx.translate(20, 20)
      ctx.fillRect(0, 0, 10, 10)
    }

    const size = {width: 50, height: 75}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    await compare_on_dom(test, ctx.get_serialized_svg(), size)

    const svg = ctx.get_svg()
    const firstGroup = svg.querySelectorAll("path")[0]
    expect(firstGroup.getAttribute("d")?.startsWith("M 0 20")).to.be.true

    const secondGroup = svg.querySelectorAll("path")[1]
    expect(secondGroup.getAttribute("d")?.startsWith("M 10 40")).to.be.true

    const thirdGroup = svg.querySelectorAll("path")[2]
    expect(thirdGroup.getAttribute("d")?.startsWith("M 30 60")).to.be.true
  })

  it("save and restore to work", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      ctx.translate(0, 10)
      ctx.fillRect(0, 0, 10, 10)

      ctx.save()
      ctx.translate(40, 40)
      ctx.fillRect(0, 0, 10, 10)

      ctx.restore()

      ctx.translate(0, 10)
      ctx.fillRect(0, 0, 10, 10)
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)

    const svg = ctx.get_svg()
    const firstGroup = svg.querySelectorAll("path")[0]
    expect(firstGroup.getAttribute("d")?.startsWith("M 0 10")).to.be.true

    const secondGroup = svg.querySelectorAll("path")[1]
    expect(secondGroup.getAttribute("d")?.startsWith("M 40 50")).to.be.true

    const thirdGroup = svg.querySelectorAll("path")[2]
    expect(thirdGroup.getAttribute("d")?.startsWith("M 0 20")).to.be.true
  })

  it("support clip", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      ctx.rect(200, 200, 400, 400)
      ctx.clip()
      ctx.fillStyle = "#000000"
      ctx.rect(100, 100, 300, 300)
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)

    const svg = ctx.get_svg()
    expect(svg.querySelector("clipPath > path")!.getAttribute("d")).to.be.equal("M 200 200 L 600 200 L 600 600 L 200 600 L 200 200")
  })

  it("generate ids", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      ctx.createRadialGradient(6E1, 6E1, 0.0, 6E1, 6E1, 5E1)
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)

    const svg = ctx.get_svg()

    const id = svg.children[0].children[0].id
    const regex_test = /^[A-Za-z]/.test(id)
    expect(regex_test).to.be.true
  })

  it("moveTo may be called without beginPath", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      ctx.moveTo(0, 0)
      ctx.lineTo(100, 100)
      ctx.stroke()
    }

    const size = {width: 110, height: 110}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="110" height="110"><defs/><path fill="none" stroke="#000000" paint-order="fill" d="M 0 0 L 100 100" stroke-miterlimit="10" stroke-dasharray=""/></svg>')
  })

  it("correctly implement bezierCurveTo", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Define the points as {x, y}
      const start = {x: 50, y: 20}
      const cp1 = {x: 230, y: 30}
      const cp2 = {x: 150, y: 80}
      const end = {x: 250, y: 100}

      // Cubic Bézier curve
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y)
      ctx.stroke()

      // Start and end points
      ctx.fillStyle = "blue"
      ctx.beginPath()
      ctx.arc(start.x, start.y, 5, 0, 2 * Math.PI)
      ctx.arc(end.x, end.y, 5, 0, 2 * Math.PI)
      ctx.fill()

      // Control points
      ctx.fillStyle = "red"
      ctx.beginPath()
      ctx.arc(cp1.x, cp1.y, 5, 0, 2 * Math.PI)
      ctx.arc(cp2.x, cp2.y, 5, 0, 2 * Math.PI)
      ctx.fill()
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="150"><defs/><path fill="none" stroke="#000000" paint-order="fill" d="M 50 20 C 230 30 150 80 250 100" stroke-miterlimit="10" stroke-dasharray=""/><path fill="blue" stroke="none" paint-order="stroke" d="M 55 20 A 5 5 0 1 1 54.999997500000205 19.99500000083333 L 255 100 A 5 5 0 1 1 254.9999975000002 99.99500000083333"/><path fill="red" stroke="none" paint-order="stroke" d="M 235 30 A 5 5 0 1 1 234.9999975000002 29.99500000083333 L 155 80 A 5 5 0 1 1 154.9999975000002 79.99500000083333"/></svg>')
  })

  it("quadraticCurveTo may be called without beginPath", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Quadratic Bézier curve
      ctx.beginPath()
      ctx.moveTo(50, 20)
      ctx.quadraticCurveTo(230, 30, 50, 100)
      ctx.stroke()

      // Start and end points
      ctx.fillStyle = "blue"
      ctx.beginPath()
      ctx.arc(50, 20, 5, 0, 2 * Math.PI)
      ctx.arc(50, 100, 5, 0, 2 * Math.PI)
      ctx.fill()

      // Control point
      ctx.fillStyle = "red"
      ctx.beginPath()
      ctx.arc(230, 30, 5, 0, 2 * Math.PI)
      ctx.fill()
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="150"><defs/><path fill="none" stroke="#000000" paint-order="fill" d="M 50 20 Q 230 30 50 100" stroke-miterlimit="10" stroke-dasharray=""/><path fill="blue" stroke="none" paint-order="stroke" d="M 55 20 A 5 5 0 1 1 54.999997500000205 19.99500000083333 L 55 100 A 5 5 0 1 1 54.999997500000205 99.99500000083333"/><path fill="red" stroke="none" paint-order="stroke" d="M 235 30 A 5 5 0 1 1 234.9999975000002 29.99500000083333"/></svg>')
  })

  it("arcTo may be called without beginPath", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Tangential lines
      ctx.beginPath()
      ctx.strokeStyle = "gray"
      ctx.moveTo(200, 20)
      ctx.lineTo(200, 130)
      ctx.lineTo(50, 20)
      ctx.stroke()

      // Arc
      ctx.beginPath()
      ctx.strokeStyle = "black"
      ctx.lineWidth = 5
      ctx.moveTo(200, 20)
      ctx.arcTo(200, 130, 50, 20, 40)
      ctx.stroke()

      // Start point
      ctx.beginPath()
      ctx.fillStyle = "blue"
      ctx.arc(200, 20, 5, 0, 2 * Math.PI)
      ctx.fill()

      // Control points
      ctx.beginPath()
      ctx.fillStyle = "red"
      ctx.arc(200, 130, 5, 0, 2 * Math.PI)
      ctx.arc(50, 20, 5, 0, 2 * Math.PI)
      ctx.fill()
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="150"><defs/><path fill="none" stroke="gray" paint-order="fill" d="M 200 20 L 200 130 L 50 20" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="black" paint-order="fill" d="M 200 20 L 200 51.063799366031276 L 200 51.063799366031276 A 40 40 0 0 1 136.3454534548993 83.3199992002595" stroke-miterlimit="10" stroke-width="5" stroke-dasharray=""/><path fill="blue" stroke="none" paint-order="stroke" d="M 205 20 A 5 5 0 1 1 204.9999975000002 19.99500000083333"/><path fill="red" stroke="none" paint-order="stroke" d="M 205 130 A 5 5 0 1 1 204.9999975000002 129.99500000083333 L 55 20 A 5 5 0 1 1 54.999997500000205 19.99500000083333"/></svg>')
  })
})
