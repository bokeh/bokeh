import {logger} from "../logging"
import {Context2d, CanvasLayer} from "../util/canvas"
import {color2css} from "../util/color"
import {Color} from "../types"
import {HatchPattern} from "../property_mixins"

export type PatternSource = CanvasImageSource

function _horz(ctx: Context2d, h: number, h2: number): void {
  ctx.moveTo(0, h2+0.5)
  ctx.lineTo(h, h2+0.5)
  ctx.stroke()
}

function _vert(ctx: Context2d, h: number, h2: number): void {
  ctx.moveTo(h2+0.5, 0)
  ctx.lineTo(h2+0.5, h)
  ctx.stroke()
}

function _x(ctx: Context2d, h: number): void {
  ctx.moveTo(0, h)
  ctx.lineTo(h, 0)
  ctx.stroke()
  ctx.moveTo(0, 0)
  ctx.lineTo(h, h)
  ctx.stroke()
}

export const hatch_aliases: {[key: string]: HatchPattern | undefined} = {
  " ": "blank",
  ".": "dot",
  o: "ring",
  "-": "horizontal_line",
  "|": "vertical_line",
  "+": "cross",
  "\"": "horizontal_dash",
  ":": "vertical_dash",
  "@": "spiral",
  "/": "right_diagonal_line",
  "\\": "left_diagonal_line",
  x: "diagonal_cross",
  ",": "right_diagonal_dash",
  "`": "left_diagonal_dash",
  v: "horizontal_wave",
  ">": "vertical_wave",
  "*": "criss_cross",
}

export function get_pattern(layer: CanvasLayer,
    pattern: HatchPattern, color: Color, alpha: number, scale: number, weight: number): PatternSource {
  layer.resize(scale, scale)
  layer.prepare()
  create_hatch_canvas(layer.ctx, pattern, color, alpha, scale, weight)
  return layer.canvas
}

function create_hatch_canvas(ctx: Context2d,
    hatch_pattern: HatchPattern, hatch_color: Color, hatch_alpha: number, hatch_scale: number, hatch_weight: number): void {
  const h = hatch_scale
  const h2 = h / 2
  const h4 = h2 / 2

  const color = color2css(hatch_color, hatch_alpha)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineCap = "square"
  ctx.lineWidth = hatch_weight

  switch (hatch_aliases[hatch_pattern] ?? hatch_pattern) {
    // we should not need these if code conditions on hatch.doit, but
    // include them here just for completeness
    case "blank":
      break
    case "dot":
      ctx.arc(h2, h2, h2/2, 0, 2 * Math.PI, true)
      ctx.fill()
      break
    case "ring":
      ctx.arc(h2, h2, h2/2, 0, 2 * Math.PI, true)
      ctx.stroke()
      break
    case "horizontal_line":
      _horz(ctx, h, h2)
      break
    case "vertical_line":
      _vert(ctx, h, h2)
      break
    case "cross":
      _horz(ctx, h, h2)
      _vert(ctx, h, h2)
      break
    case "horizontal_dash":
      _horz(ctx, h2, h2)
      break
    case "vertical_dash":
      _vert(ctx, h2, h2)
      break
    case "spiral": {
      const h30 = h/30
      ctx.moveTo(h2, h2)
      for (let i = 0; i < 360; i++) {
        const angle = 0.1 * i
        const x = h2 + (h30 * angle) * Math.cos(angle)
        const y = h2 + (h30 * angle) * Math.sin(angle)
        ctx.lineTo(x, y)
      }
      ctx.stroke()
      break
    }
    case "right_diagonal_line":
      ctx.moveTo(-h4+0.5, h)
      ctx.lineTo(h4+0.5, 0)
      ctx.stroke()
      ctx.moveTo(h4+0.5, h)
      ctx.lineTo(3*h4+0.5, 0)
      ctx.stroke()
      ctx.moveTo(3*h4+0.5, h)
      ctx.lineTo(5*h4+0.5, 0)
      ctx.stroke()
      ctx.stroke()
      break
    case "left_diagonal_line":
      ctx.moveTo(h4+0.5, h)
      ctx.lineTo(-h4+0.5, 0)
      ctx.stroke()
      ctx.moveTo(3*h4+0.5, h)
      ctx.lineTo(h4+0.5, 0)
      ctx.stroke()
      ctx.moveTo(5*h4+0.5, h)
      ctx.lineTo(3*h4+0.5, 0)
      ctx.stroke()
      ctx.stroke()
      break
    case "diagonal_cross":
      _x(ctx, h)
      break
    case "right_diagonal_dash":
      ctx.moveTo(h4+0.5, 3*h4+0.5)
      ctx.lineTo(3*h4+0.5, h4+0.5)
      ctx.stroke()
      break
    case "left_diagonal_dash":
      ctx.moveTo(h4+0.5, h4+0.5)
      ctx.lineTo(3*h4+0.5, 3*h4+0.5)
      ctx.stroke()
      break
    case "horizontal_wave":
      ctx.moveTo(0, h4)
      ctx.lineTo(h2, 3*h4)
      ctx.lineTo(h, h4)
      ctx.stroke()
      break
    case "vertical_wave":
      ctx.moveTo(h4, 0)
      ctx.lineTo(3*h4, h2)
      ctx.lineTo(h4, h)
      ctx.stroke()
      break
    case "criss_cross":
      _x(ctx, h)
      _horz(ctx, h, h2)
      _vert(ctx, h, h2)
      break
    default:
      logger.warn(`unknown hatch pattern: ${hatch_pattern}`)
  }
}
