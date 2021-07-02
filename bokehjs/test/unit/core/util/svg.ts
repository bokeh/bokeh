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

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><defs/><text fill="#000000" stroke="none" font-family="Times" font-size="16px" font-style="normal" font-weight="normal" text-decoration="normal" x="0" y="16" text-anchor="start" dominant-baseline="alphabetic">TEST</text></svg>`)
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

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><defs/><text fill="none" stroke="#000000" font-family="serif" font-size="16px" font-style="normal" font-weight="normal" text-decoration="normal" x="0" y="16" text-anchor="start" dominant-baseline="alphabetic" stroke-miterlimit="10" stroke-dasharray="">TEST</text></svg>`)
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

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="150" height="200"><defs/><path fill="none" stroke="#000000" paint-order="fill" d="M 45 25 A 20 20 0 0 1 5 25.000000000000004" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 95 25 A 20 20 0 1 1 75 5" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 145 25 A 20 20 0 1 1 144.99999000000082 24.98000000333332" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 45 75 A 20 20 0 1 0 5 75" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 95 75 A 20 20 0 0 0 75 55" stroke-miterlimit="10" stroke-dasharray=""/><path fill="none" stroke="#000000" paint-order="fill" d="M 145 75 A 20 20 0 1 0 144.99999000000082 75.01999999666667" stroke-miterlimit="10" stroke-dasharray=""/><path fill="#000000" stroke="none" paint-order="stroke" d="M 45 125 A 20 20 0 0 1 5 125"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 95 125 A 20 20 0 1 1 75 105"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 145 125 A 20 20 0 1 1 144.99999000000082 124.98000000333332"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 45 175 A 20 20 0 1 0 5 175"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 95 175 A 20 20 0 0 0 75 155"/><path fill="#000000" stroke="none" paint-order="stroke" d="M 145 175 A 20 20 0 1 0 144.99999000000082 175.01999999666668"/></svg>`)
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

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><defs/><path fill="red" stroke="none" paint-order="stroke" d="M 10 10 L 20 10 L 20 20 L 10 20 L 10 10"/></svg>`)
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

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50"><defs/><path fill="red" stroke="none" paint-order="stroke" d="M 10 10 L 20 10 L 20 20 L 10 20 L 10 10"/></svg>`)
  })

  /**
   * The rectangle has a specified width of 8 and a height of 20.
   * The transformation matrix scales it by 9x horizontally and by 3x vertically.
   * Thus, its final size is a width of 72 and a height of 60.
   */
  it("should scale a shape", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Scaled rectangle
      ctx.scale(9, 3)
      ctx.fillStyle = 'red'
      ctx.fillRect(10, 10, 8, 20)

      // Reset current transformation matrix to the identity matrix
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      // Non-scaled rectangle
      ctx.fillStyle = 'gray'
      ctx.fillRect(10, 10, 8, 20)
    }

    const size = {width: 200, height: 100}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="100"><defs/><path fill="red" stroke="none" paint-order="stroke" d="M 90 30 L 162 30 L 162 90 L 90 90 L 90 30"/><path fill="gray" stroke="none" paint-order="stroke" d="M 10 10 L 18 10 L 18 30 L 10 30 L 10 10"/></svg>`)
  })

  it("should flip things horizontally", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      ctx.scale(-1, 1);
      ctx.font = '48px serif';
      ctx.fillText('Hello world!', -280, 90);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="150"><defs/><text fill="#000000" stroke="none" font-family="serif" font-size="48px" font-style="normal" font-weight="normal" text-decoration="normal" x="-280" y="90" text-anchor="start" dominant-baseline="alphabetic" transform="matrix(-1, 0, 0, 1, 0, 0)">Hello world!</text></svg>`)
  })

  it("should rotate a shape", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Point of transform origin
      ctx.arc(0, 0, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();

      // Non-rotated rectangle
      ctx.fillStyle = 'gray';
      ctx.fillRect(100, 0, 80, 20);

      // Rotated rectangle
      ctx.rotate(45 * Math.PI / 180);
      ctx.fillStyle = 'red';
      ctx.fillRect(100, 0, 80, 20);

      // Reset transformation matrix to the identity matrix
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="150"><defs/><path fill="blue" stroke="none" paint-order="stroke" d="M 5 0 A 5 5 0 1 1 4.999997500000209 -0.004999999166669603"/><path fill="gray" stroke="none" paint-order="stroke" d="M 100 0 L 180 0 L 180 20 L 100 20 L 100 0"/><path fill="red" stroke="none" paint-order="stroke" d="M 70.71067811865476 70.71067811865474 L 127.27922061357856 127.27922061357854 L 113.13708498984761 141.4213562373095 L 56.568542494923804 84.85281374238569 L 70.71067811865476 70.71067811865474"/></svg>`)
  })

  it("should rotate a shape around its center", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Non-rotated rectangle
      ctx.fillStyle = 'gray';
      ctx.fillRect(80, 60, 140, 30);

      // Matrix transformation
      ctx.translate(150, 75);
      ctx.rotate(Math.PI / 2);
      ctx.translate(-150, -75);

      // Rotated rectangle
      ctx.fillStyle = 'red';
      ctx.fillRect(80, 60, 140, 30);
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="150"><defs/><path fill="gray" stroke="none" paint-order="stroke" d="M 80 60 L 220 60 L 220 90 L 80 90 L 80 60"/><path fill="red" stroke="none" paint-order="stroke" d="M 165 5 L 165 145 L 135 145 L 135 5 L 165 5"/></svg>`)
  })

  it("should translate a shape", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Moved square
      ctx.translate(110, 30);
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 80, 80);

      // Reset current transformation matrix to the identity matrix
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Unmoved square
      ctx.fillStyle = 'gray';
      ctx.fillRect(0, 0, 80, 80);
    }

    const size = {width: 200, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="150"><defs/><path fill="red" stroke="none" paint-order="stroke" d="M 110 30 L 190 30 L 190 110 L 110 110 L 110 30"/><path fill="gray" stroke="none" paint-order="stroke" d="M 0 0 L 80 0 L 80 80 L 0 80 L 0 0"/></svg>`)
  })

  it("should skew a shape", async () => {
    const test = (ctx: SVGRenderingContext2D | CanvasRenderingContext2D) => {
      // Normal square
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 80, 80);

      // Skewed square
      ctx.transform(1, .2, .8, 1, 0, 0);
      ctx.fillStyle = 'gray';
      ctx.fillRect(0, 0, 80, 80);
    }

    const size = {width: 150, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_serialized_svg()
    await compare_on_dom(test, svg, size)

    expect(svg).to.be.equal(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="150" height="150"><defs/><path fill="red" stroke="none" paint-order="stroke" d="M 0 0 L 80 0 L 80 80 L 0 80 L 0 0"/><path fill="gray" stroke="none" paint-order="stroke" d="M 0 0 L 80 16 L 144 96 L 64 80 L 0 0"/></svg>`)
  })
})
