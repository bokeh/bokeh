import {expect, expect_element} from "assertions"
import {compare_on_dom} from "../../../framework"
import {SVGRenderingContext2D} from "@bokehjs/core/util/svg"
import {Random} from "@bokehjs/core/util/random"
import {load_image} from "@bokehjs/core/util/image"
import * as _DOM from "@bokehjs/core/dom" // used by jsxFactory in tsconfig.json

declare global {
  namespace JSX {
    interface IntrinsicElements {
      svg: {version?: string, xmlns?: string, width?: string, height?: string, children?: SVGElement | SVGElement[]} // SVGSVGElement
      defs: any // SVGDefsElement
      text: any // SVGTextElement
      path: any // SVGPathElement
      image: any // SVGImageElement
      pattern: any // SVGPatternElement
      linearGradient: any // SVGLinearGradientElement
      radialGradient: any // SVGRadialGradientElement
      stop: any // SVGStopElement
    }
  }
}

type AnyContext2D = SVGRenderingContext2D | CanvasRenderingContext2D

describe("SVGRenderingContext2d", () => {
  before_each(() => {
    SVGRenderingContext2D.__random = new Random(1)
  })

  it("should fill text correctly", async () => {
    const test = (ctx: AnyContext2D) => {
      ctx.font = "normal 16px Times"
      ctx.fillText("TEST", 0, 16)
    }

    const size = {width: 50, height: 50}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="50" height="50">
        <defs/>
        <text
          fill="#000000"
          stroke="none"
          font-family="Times"
          font-size="16px"
          font-style="normal"
          font-weight="normal"
          text-decoration="normal"
          x="0"
          y="16"
          text-anchor="start"
          dominant-baseline="alphabetic"
        >
          TEST
        </text>
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("should stroke text correctly", async () => {
    const test = (ctx: AnyContext2D) => {
      ctx.font = "16px serif"
      ctx.strokeText("TEST", 0, 16)
    }

    const size = {width: 50, height: 50}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="50" height="50">
        <defs/>
        <text
          fill="none"
          stroke="#000000"
          font-family="serif"
          font-size="16px"
          font-style="normal"
          font-weight="normal"
          text-decoration="normal"
          x="0"
          y="16"
          text-anchor="start"
          dominant-baseline="alphabetic"
          stroke-miterlimit="10"
          stroke-dasharray=""
        >
          TEST
        </text>
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("should draw arcs correctly", async () => {
    const test = (ctx: AnyContext2D) => {
      for (let i = 0; i <= 3; i++) {
        for (let j = 0; j <= 2; j++) {
          ctx.beginPath()
          const x                = 25 + j * 50
          const y                = 25 + i * 50
          const radius           = 20
          const start_angle      = 0
          const end_angle        = Math.PI + (Math.PI * j) / 2
          const counterclockwise = i % 2 == 1

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
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="150" height="200">
        <defs/>
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 45 25 A 20 20 0 0 1 5 25.000000000000004"
          stroke-miterlimit="10"
          stroke-dasharray=""
        />
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 95 25 A 20 20 0 1 1 75 5"
          stroke-miterlimit="10"
          stroke-dasharray=""
        />
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 145 25 A 20 20 0 0 1 105 25.000000000000004 A 20 20 0 0 1 145 25"
          stroke-miterlimit="10"
          stroke-dasharray=""
        />
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 45 75 A 20 20 0 1 0 5 75"
          stroke-miterlimit="10"
          stroke-dasharray=""
        />
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 95 75 A 20 20 0 0 0 75 55"
          stroke-miterlimit="10"
          stroke-dasharray=""
        />
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 145 75 A 20 20 0 0 0 105 75 A 20 20 0 0 0 145 75"
          stroke-miterlimit="10"
          stroke-dasharray=""
        />
        <path
          fill="#000000"
          stroke="none"
          paint-order="stroke"
          d="M 45 125 A 20 20 0 0 1 5 125"
        />
        <path
          fill="#000000"
          stroke="none"
          paint-order="stroke"
          d="M 95 125 A 20 20 0 1 1 75 105"
        />
        <path
          fill="#000000"
          stroke="none"
          paint-order="stroke"
          d="M 145 125 A 20 20 0 0 1 105 125 A 20 20 0 0 1 145 125"
        />
        <path
          fill="#000000"
          stroke="none"
          paint-order="stroke"
          d="M 45 175 A 20 20 0 1 0 5 175"
        />
        <path
          fill="#000000"
          stroke="none"
          paint-order="stroke"
          d="M 95 175 A 20 20 0 0 0 75 155"
        />
        <path
          fill="#000000"
          stroke="none"
          paint-order="stroke"
          d="M 145 175 A 20 20 0 0 0 105 175 A 20 20 0 0 0 145 175"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("should fill a red rectangle correctly", async () => {
    const test = (ctx: AnyContext2D) => {
      ctx.fillStyle="red"
      ctx.fillRect(10, 10, 10, 10)
    }

    const size = {width: 50, height: 50}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="50" height="50">
        <defs/>
        <path
          fill="red"
          stroke="none"
          paint-order="stroke"
          d="M 10 10 L 20 10 L 20 20 L 10 20 L 10 10 Z"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("should rotate a shape", async () => {
    const test = (ctx: AnyContext2D) => {
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
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="300" height="150">
        <defs/>
        <path
          fill="blue"
          stroke="none"
          paint-order="stroke"
          d="M 5 0 A 5 5 0 0 1 -5 6.123233995736766e-16 A 5 5 0 0 1 5 0"
        />
        <path
          fill="gray"
          stroke="none"
          paint-order="stroke"
          d="M 100 0 L 180 0 L 180 20 L 100 20 L 100 0 Z"
        />
        <path
          fill="red"
          stroke="none"
          paint-order="stroke"
          d="M 70.71067811865476 70.71067811865474 L 127.27922061357856 127.27922061357854 L 113.13708498984761 141.4213562373095 L 56.568542494923804 84.85281374238569 L 70.71067811865476 70.71067811865474 Z"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("support multiple transforms", async () => {
    const test = (ctx: AnyContext2D) => {
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
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const first_group = svg.querySelectorAll("path")[0]
    expect(first_group.getAttribute("d")?.startsWith("M 0 20")).to.be.true

    const second_group = svg.querySelectorAll("path")[1]
    expect(second_group.getAttribute("d")?.startsWith("M 10 40")).to.be.true

    const third_group = svg.querySelectorAll("path")[2]
    expect(third_group.getAttribute("d")?.startsWith("M 30 60")).to.be.true
  })

  it("save and restore to work", async () => {
    const test = (ctx: AnyContext2D) => {
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
    const first_group = svg.querySelectorAll("path")[0]
    expect(first_group.getAttribute("d")?.startsWith("M 0 10")).to.be.true

    const second_group = svg.querySelectorAll("path")[1]
    expect(second_group.getAttribute("d")?.startsWith("M 40 50")).to.be.true

    const third_group = svg.querySelectorAll("path")[2]
    expect(third_group.getAttribute("d")?.startsWith("M 0 20")).to.be.true
  })

  it("support clip", async () => {
    const test = (ctx: AnyContext2D) => {
      ctx.rect(200, 200, 400, 400)
      ctx.clip()
      ctx.fillStyle = "red"
      ctx.rect(100, 100, 300, 300)
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    expect(svg.querySelector("clipPath > path")!.getAttribute("d")).to.be.equal("M 200 200 L 600 200 L 600 600 L 200 600 L 200 200 Z")
  })

  it("generate ids", async () => {
    const test = (ctx: AnyContext2D) => {
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
    const test = (ctx: AnyContext2D) => {
      ctx.moveTo(0, 0)
      ctx.lineTo(100, 100)
      ctx.stroke()
    }

    const size = {width: 110, height: 110}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="110" height="110">
        <defs/>
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 0 0 L 100 100"
          stroke-miterlimit="10"
          stroke-dasharray=""
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("correctly implement bezierCurveTo", async () => {
    const test = (ctx: AnyContext2D) => {
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
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="300" height="150">
        <defs/>
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 50 20 C 230 30 150 80 250 100"
          stroke-miterlimit="10"
          stroke-dasharray=""
        />
        <path
          fill="blue"
          stroke="none"
          paint-order="stroke"
          d="M 55 20 A 5 5 0 0 1 45 20 A 5 5 0 0 1 55 20 L 255 100 A 5 5 0 0 1 245 100 A 5 5 0 0 1 255 100"
        />
        <path
          fill="red"
          stroke="none"
          paint-order="stroke"
          d="M 235 30 A 5 5 0 0 1 225 30 A 5 5 0 0 1 235 30 L 155 80 A 5 5 0 0 1 145 80 A 5 5 0 0 1 155 80"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("quadraticCurveTo may be called without beginPath", async () => {
    const test = (ctx: AnyContext2D) => {
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
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="300" height="150">
        <defs/>
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 50 20 Q 230 30 50 100"
          stroke-miterlimit="10"
          stroke-dasharray=""
        />
        <path
          fill="blue"
          stroke="none"
          paint-order="stroke"
          d="M 55 20 A 5 5 0 0 1 45 20 A 5 5 0 0 1 55 20 L 55 100 A 5 5 0 0 1 45 100 A 5 5 0 0 1 55 100"
        />
        <path
          fill="red"
          stroke="none"
          paint-order="stroke"
          d="M 235 30 A 5 5 0 0 1 225 30 A 5 5 0 0 1 235 30"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("arcTo may be called without beginPath", async () => {
    const test = (ctx: AnyContext2D) => {
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
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="300" height="150">
        <defs/>
        <path
          fill="none"
          stroke="gray"
          paint-order="fill"
          d="M 200 20 L 200 130 L 50 20"
          stroke-miterlimit="10"
          stroke-dasharray=""
        />
        <path
          fill="none"
          stroke="black"
          paint-order="fill"
          d="M 200 20 L 200 51.063799366031276 L 200 51.063799366031276 A 40 40 0 0 1 136.3454534548993 83.3199992002595"
          stroke-miterlimit="10"
          stroke-width="5"
          stroke-dasharray=""
        />
        <path
          fill="blue"
          stroke="none"
          paint-order="stroke"
          d="M 205 20 A 5 5 0 0 1 195 20 A 5 5 0 0 1 205 20"
        />
        <path
          fill="red"
          stroke="none"
          paint-order="stroke"
          d="M 205 130 A 5 5 0 0 1 195 130 A 5 5 0 0 1 205 130 L 55 20 A 5 5 0 0 1 45 20 A 5 5 0 0 1 55 20"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("Create a linear gradient", async () => {
    const test = (ctx: AnyContext2D) => {
      // The start gradient point is at x=20, y=0
      // The end gradient point is at x=220, y=0
      const gradient = ctx.createLinearGradient(20, 0, 220, 0)

      // Add three color stops
      gradient.addColorStop(0, "green")
      gradient.addColorStop(0.5, "cyan")
      gradient.addColorStop(1, "green")

      // Set the fill style and draw a rectangle
      ctx.fillStyle = gradient
      ctx.fillRect(20, 20, 200, 100)
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="300" height="150">
        <defs>
          <linearGradient
            id="ZoSvZRFIOOma"
            x1="20px"
            x2="220px"
            y1="0px"
            y2="0px"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="green" />
            <stop offset="0.5" stop-color="cyan" />
            <stop offset="1" stop-color="green" />
          </linearGradient>
        </defs>
        <path
          fill="url(#ZoSvZRFIOOma)"
          stroke="none"
          paint-order="stroke"
          d="M 20 20 L 220 20 L 220 120 L 20 120 L 20 20 Z"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("Linear gradient shouldn't paint if x0=x1 and y0=y1", async () => {
    const test = (ctx: AnyContext2D) => {
      const gradient = ctx.createLinearGradient(20, 0, 20, 0)

      // Add three color stops
      gradient.addColorStop(0, "green")
      gradient.addColorStop(0.5, "cyan")
      gradient.addColorStop(1, "green")

      // Set the fill style and draw a rectangle
      ctx.fillStyle = gradient
      ctx.fillRect(20, 20, 200, 100)
    }

    const size = {width: 300, height: 150}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="300" height="150">
        <defs>
          <linearGradient
            id="ZoSvZRFIOOma"
            x1="20px"
            x2="20px"
            y1="0px"
            y2="0px"
            gradientUnits="userSpaceOnUse"
          />
        </defs>
        <path
          fill="url(#ZoSvZRFIOOma)"
          stroke="none"
          paint-order="stroke"
          d="M 20 20 L 220 20 L 220 120 L 20 120 L 20 20 Z"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("Create a radial gradient", async () => {
    const test = (ctx: AnyContext2D) => {
      // The inner circle is at x=110, y=90, with radius=30
      // The outer circle is at x=100, y=100, with radius=70
      const gradient = ctx.createRadialGradient(110, 90, 30, 100, 100, 70)

      // Add three color stops
      gradient.addColorStop(0, "pink")
      gradient.addColorStop(0.9, "white")
      gradient.addColorStop(1, "green")

      // Set the fill style and draw a rectangle
      ctx.fillStyle = gradient
      ctx.fillRect(20, 20, 160, 160)
    }

    const size = {width: 200, height: 200}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <defs>
          <radialGradient
            id="ZoSvZRFIOOma"
            cx="100px"
            cy="100px"
            r="70px"
            r0="30px"
            fx="110px"
            fy="90px"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="pink" />
            <stop offset="0.9" stop-color="white" />
            <stop offset="1" stop-color="green" />
          </radialGradient>
        </defs>
        <path
          fill="url(#ZoSvZRFIOOma)"
          stroke="none"
          paint-order="stroke"
          d="M 20 20 L 180 20 L 180 180 L 20 180 L 20 20 Z"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("Radial gradient shouldn't paint if x0=x1, y0=y1 and r0=r1", async () => {
    const test = (ctx: AnyContext2D) => {
      const gradient = ctx.createRadialGradient(110, 90, 30, 110, 90, 30)

      // Add three color stops
      gradient.addColorStop(0, "pink")
      gradient.addColorStop(0.9, "white")
      gradient.addColorStop(1, "green")

      // Set the fill style and draw a rectangle
      ctx.fillStyle = gradient
      ctx.fillRect(20, 20, 160, 160)
    }

    const size = {width: 200, height: 200}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <defs>
          <radialGradient
            id="ZoSvZRFIOOma"
            cx="110px"
            cy="90px"
            r="30px"
            r0="30px"
            fx="110px"
            fy="90px"
            gradientUnits="userSpaceOnUse"
          />
        </defs>
        <path
          fill="url(#ZoSvZRFIOOma)"
          stroke="none"
          paint-order="stroke"
          d="M 20 20 L 180 20 L 180 180 L 20 180 L 20 20 Z"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("Create a pattern from a canvas", async () => {
    const size = {width: 200, height: 200}

    const test = (ctx: AnyContext2D) => {
      const canvas = document.createElement("canvas")
      const pattern_ctx = canvas.getContext("2d")!

      canvas.width = 10
      canvas.height = 10

      pattern_ctx.fillStyle = "#fec"
      pattern_ctx.fillRect(0, 0, canvas.width, canvas.height)
      pattern_ctx.arc(0, 0, 10, 0, 0.5*Math.PI)
      pattern_ctx.stroke()

      const pattern = ctx.createPattern(canvas, "repeat")!
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, size.width, size.height)
    }

    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <defs>
          <pattern id="ZoSvZRFIOOma" width="10" height="10" patternUnits="userSpaceOnUse">
            <image href="^data:image/png;base64,.*$"/>
          </pattern>
        </defs>
        <path
          fill="url(#ZoSvZRFIOOma)"
          stroke="none"
          paint-order="stroke"
          d="M 0 0 L 200 0 L 200 200 L 0 200 L 0 0 Z"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("Create a pattern from an image", async () => {
    const test = async (ctx: AnyContext2D) => {
      const img = await load_image("/assets/images/pattern_small.png")
      const pattern = ctx.createPattern(img, "repeat")!
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, 300, 300)
    }

    const size = {width: 200, height: 200}
    const ctx = new SVGRenderingContext2D(size)

    await test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <defs>
          <pattern id="ZoSvZRFIOOma" width="10" height="20" patternUnits="userSpaceOnUse">
            <image href="/assets/images/pattern_small.png" />
          </pattern>
        </defs>
        <path
          fill="url(#ZoSvZRFIOOma)"
          stroke="none"
          paint-order="stroke"
          d="M 0 0 L 300 0 L 300 300 L 0 300 L 0 0 Z"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("Support dashed lines", async () => {
    const test = (ctx: AnyContext2D) => {
      // Dashed line
      ctx.beginPath()
      ctx.setLineDash([5, 15])
      ctx.moveTo(0, 10)
      ctx.lineTo(150, 10)
      ctx.stroke()

      // Solid line
      ctx.beginPath()
      ctx.setLineDash([])
      ctx.moveTo(0, 20)
      ctx.lineTo(150, 20)
      ctx.stroke()
    }

    const size = {width: 150, height: 30}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="150" height="30">
        <defs/>
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 0 10 L 150 10"
          stroke-miterlimit="10"
          stroke-dasharray="5,15"
        />
        <path
          fill="none"
          stroke="#000000"
          paint-order="fill"
          d="M 0 20 L 150 20"
          stroke-miterlimit="10"
        />
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("Support drawImage with HTMLImageElement", async () => {
    const test = async (ctx: AnyContext2D) => {
      const img = await load_image("/assets/images/pattern_small.png")
      ctx.drawImage(img, 0, 0)
      ctx.drawImage(img, 11, 17)
      ctx.drawImage(img, 11, 17, 15, 25)
      ctx.drawImage(img, 5, 5, 5, 10, 11, 17, 10, 15)
    }

    const size = {width: 100, height: 100}
    const ctx = new SVGRenderingContext2D(size)

    await test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <defs/>
        <image
          width="10"
          height="20"
          preserveAspectRatio="none"
          href="/assets/images/pattern_small.png"
        ></image>
        <image
          width="10"
          height="20"
          preserveAspectRatio="none"
          transform="matrix(1, 0, 0, 1, 11, 17)"
          href="/assets/images/pattern_small.png"
        ></image>
        <image
          width="15"
          height="25"
          preserveAspectRatio="none"
          transform="matrix(1, 0, 0, 1, 11, 17)"
          href="/assets/images/pattern_small.png"
        ></image>
        <image
          width="10"
          height="15"
          preserveAspectRatio="none"
          transform="matrix(1, 0, 0, 1, 11, 17)"
          href="^data:image/png;base64,.*$"
        ></image>
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })

  it("Support drawImage() with canvas", async () => {
    const test = (ctx: AnyContext2D) => {
      const canvas = document.createElement("canvas")
      const pattern_ctx = canvas.getContext("2d")!

      canvas.width = 10
      canvas.height = 20

      pattern_ctx.fillStyle = "#fec"
      pattern_ctx.fillRect(0, 0, canvas.width, canvas.height)
      pattern_ctx.arc(0, 0, 10, 0, 0.5*Math.PI)
      pattern_ctx.stroke()

      ctx.drawImage(canvas, 0, 0)
      ctx.drawImage(canvas, 11, 17)
      ctx.drawImage(canvas, 11, 17, 20, 30)
      ctx.drawImage(canvas, 5, 5, 5, 10, 11, 17, 20, 30)
    }

    const size = {width: 100, height: 100}
    const ctx = new SVGRenderingContext2D(size)

    test(ctx)
    const svg = ctx.get_svg()
    await compare_on_dom(test, svg, size)

    const expected =
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <defs/>
        <image
          width="10"
          height="20"
          preserveAspectRatio="none"
          href="^data:image/png;base64,.*$"
        ></image>
        <image
          width="10"
          height="20"
          preserveAspectRatio="none"
          transform="matrix(1, 0, 0, 1, 11, 17)"
          href="^data:image/png;base64,.*$"
        ></image>
        <image
          width="20"
          height="30"
          preserveAspectRatio="none"
          transform="matrix(1, 0, 0, 1, 11, 17)"
          href="^data:image/png;base64,.*$"
        ></image>
        <image
          width="20"
          height="30"
          preserveAspectRatio="none"
          transform="matrix(1, 0, 0, 1, 11, 17)"
          href="^data:image/png;base64,.*$"
        ></image>
      </svg>

    expect_element(svg).to.have.equal_attributes(expected)
  })
})
