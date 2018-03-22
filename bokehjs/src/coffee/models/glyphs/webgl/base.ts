// This module implements the Base GL Glyph and some utilities
import {Program, VertexBuffer} from "gloo2"
import {Arrayable} from "core/types"
import {color2rgba} from "core/util/color"
import {Context2d} from "core/util/canvas"
import {GlyphView} from "../glyph"

export abstract class BaseGLGlyph {

  protected nvertices: number = 0
  protected size_changed: boolean = false
  protected data_changed: boolean = false
  protected visuals_changed: boolean = false

  constructor(readonly gl: WebGLRenderingContext, readonly glyph: GlyphView) {
    this.init()
  }

  protected abstract init(): void

  set_data_changed(n: number): void {
    if (n != this.nvertices) {
      this.nvertices = n
      this.size_changed = true
    }

    this.data_changed = true
  }

  set_visuals_changed(): void {
    this.visuals_changed = true
  }

  render(_ctx: Context2d, indices: number[], mainglyph: GlyphView): boolean {
    // Get transform
    let wx = 1;  // Weights to scale our vectors
    let wy = 1
    let [dx, dy] = this.glyph.renderer.map_to_screen([0*wx, 1*wx, 2*wx], [0*wy, 1*wy, 2*wy])
    // Try again, but with weighs so we're looking at ~100 in screen coordinates
    wx = 100 / Math.min(Math.max(Math.abs(dx[1] - dx[0]), 1e-12), 1e12)
    wy = 100 / Math.min(Math.max(Math.abs(dy[1] - dy[0]), 1e-12), 1e12)
    ;[dx, dy] = this.glyph.renderer.map_to_screen([0*wx, 1*wx, 2*wx], [0*wy, 1*wy, 2*wy])
    // Test how linear it is
    if ((Math.abs((dx[1] - dx[0]) - (dx[2] - dx[1])) > 1e-6) ||
        (Math.abs((dy[1] - dy[0]) - (dy[2] - dy[1])) > 1e-6)) {
      return false
    }
    const [sx, sy] = [(dx[1]-dx[0]) / wx, (dy[1]-dy[0]) / wy]
    const {width, height} = this.glyph.renderer.plot_view.gl!.canvas
    const trans = {
      pixel_ratio: this.glyph.renderer.plot_view.canvas.pixel_ratio,  // pass pixel_ratio to webgl
      width: width, height: height,
      dx: dx[0]/sx, dy: dy[0]/sy, sx, sy,
    }
    this.draw(indices, mainglyph, trans)
    return true
  }

  abstract draw(indices: number[], mainglyph: any, trans: Transform): void
}

export type Transform = {
  pixel_ratio: number
  width: number
  height: number
  dx: number
  dy: number
  sx: number
  sy: number
}

export function line_width(width: number): number {
  // Increase small values to make it more similar to canvas
  if (width < 2) {
    width = Math.sqrt(width*2)
  }
  return width
}

export function fill_array_with_float(n: number, val: number): Float32Array {
  const a = new Float32Array(n)
  for (let i = 0, end = n; i < end; i++) {
    a[i] = val
  }
  return a
}

export function fill_array_with_vec(n: number, m: number, val: Arrayable<number>): Float32Array {
  const a = new Float32Array(n*m)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      a[i*m + j] = val[j]
    }
  }
  return a
}

export function visual_prop_is_singular(visual: any, propname: string): boolean {
  // This touches the internals of the visual, so we limit use in this function
  // See renderer.coffee:cache_select() for similar code
  return visual[propname].spec.value !== undefined
}

export function attach_float(prog: Program, vbo: VertexBuffer & {used?: boolean}, att_name: string, n: number, visual: any, name: string): void {
  // Attach a float attribute to the program. Use singleton value if we can,
  // otherwise use VBO to apply array.
  if (!visual.doit) {
    vbo.used = false
    prog.set_attribute(att_name, 'float', [0])
  } else if (visual_prop_is_singular(visual, name)) {
    vbo.used = false
    prog.set_attribute(att_name, 'float', visual[name].value())
  } else {
    vbo.used = true
    const a = new Float32Array(visual.cache[name + '_array'])
    vbo.set_size(n*4)
    vbo.set_data(0, a)
    prog.set_attribute(att_name, 'float', vbo)
  }
}

export function attach_color(prog: Program, vbo: VertexBuffer & {used?: boolean}, att_name: string, n: number, visual: any, prefix: string): void {
  // Attach the color attribute to the program. If there's just one color,
  // then use this single color for all vertices (no VBO). Otherwise we
  // create an array and upload that to the VBO, which we attahce to the prog.
  let rgba
  const m = 4
  const colorname = prefix + '_color'
  const alphaname = prefix + '_alpha'

  if (!visual.doit) {
    // Don't draw (draw transparent)
    vbo.used = false
    prog.set_attribute(att_name, 'vec4', [0,0,0,0])
  } else if (visual_prop_is_singular(visual, colorname) && visual_prop_is_singular(visual, alphaname)) {
    // Nice and simple; both color and alpha are singular
    vbo.used = false
    rgba = color2rgba(visual[colorname].value(), visual[alphaname].value())
    prog.set_attribute(att_name, 'vec4', rgba)
  } else {
    // Use vbo; we need an array for both the color and the alpha
    let alphas, colors
    vbo.used = true
    // Get array of colors
    if (visual_prop_is_singular(visual, colorname)) {
      colors = ((() => {
        const result = []
        for (let i = 0, end = n; i < end; i++) {
          result.push(visual[colorname].value())
        }
        return result
      })())
    } else {
      colors = visual.cache[colorname+'_array']
    }
    // Get array of alphas
    if (visual_prop_is_singular(visual, alphaname)) {
      alphas = fill_array_with_float(n, visual[alphaname].value())
    } else {
      alphas = visual.cache[alphaname+'_array']
    }
    // Create array of rgbs
    const a = new Float32Array(n*m)
    for (let i = 0, end = n; i < end; i++) {
      rgba = color2rgba(colors[i], alphas[i])
      for (let j = 0, endj = m; j < endj; j++) {
        a[(i*m)+j] = rgba[j]
      }
    }
    // Attach vbo
    vbo.set_size(n*m*4)
    vbo.set_data(0, a)
    prog.set_attribute(att_name, 'vec4', vbo)
  }
}
