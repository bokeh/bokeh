import {Program, VertexBuffer, IndexBuffer} from "./utils"
import {BaseGLGlyph, Transform} from "./base"
import vertex_shader from "./markers.vert"
import fragment_shader from "./markers.frag"
import {ScatterView} from "../scatter"
import {CircleView} from "../circle"
import {map} from "core/util/arrayable"
import {logger} from "core/logging"
import {MarkerType} from "core/enums"
import {ColorArray, RGBAArray} from "core/types"
import {color2rgba} from "core/util/color"
import * as visuals from "core/visuals"
import * as p from "core/properties"

type MarkerLikeView = ScatterView | CircleView

function attach_float(prog: Program, vbo: VertexBuffer & {used?: boolean}, att_name: string, n: number,
    visual: visuals.LineVector | visuals.FillVector, prop: p.NumberSpec): void {
  // Attach a float attribute to the program. Use singleton value if we can,
  // otherwise use VBO to apply array.
  if (!visual.doit) {
    vbo.used = false
    prog.set_attribute(att_name, 'float', [0])
  } else if (prop.is_value) {
    vbo.used = false
    prog.set_attribute(att_name, 'float', [prop.value()])
  } else {
    vbo.used = true
    const a = new Float32Array(visual.get_array(prop))
    vbo.set_size(n*4)
    vbo.set_data(0, a)
    prog.set_attribute(att_name, 'float', vbo)
  }
}

function attach_color(prog: Program, vbo: VertexBuffer & {used?: boolean}, att_name: string, n: number,
    visual: visuals.LineVector | visuals.FillVector, color_prop: p.ColorSpec, alpha_prop: p.NumberSpec): void {
  // Attach the color attribute to the program. If there's just one color,
  // then use this single color for all vertices (no VBO). Otherwise we
  // create an array and upload that to the VBO, which we attahce to the prog.
  if (!visual.doit) {
    // Don't draw (draw transparent)
    vbo.used = false
    prog.set_attribute(att_name, 'vec4', [0, 0, 0, 0])
  } else if (color_prop.is_value && alpha_prop.is_value) {
    vbo.used = false
    const [r, g, b, a] = color2rgba(color_prop.value(), alpha_prop.value())
    prog.set_attribute(att_name, 'vec4', [r/255, g/255, b/255, a/255])
  } else {
    // Use vbo; we need an array for both the color and the alpha
    vbo.used = true

    // TODO: compose alpha in visuals or earlier to avoid this copy
    const array = new ColorArray(visual.get_array(color_prop))
    const colors = new RGBAArray(array.buffer)
    const alphas = visual.get_array(alpha_prop)

    for (let i = 0; i < n; i++) {
      const k = 4*i + 3
      const a = colors[k]
      if (a == 255) {
        colors[k] = alphas[i]*255
      }
    }

    // Attach vbo
    vbo.set_size(4*n)
    vbo.set_data(0, colors)
    prog.set_attribute(att_name, 'vec4_uint8', vbo, 0, 0, true)
  }
}

// Base class for markers. All markers share the same GLSL, except for one
// function that defines the marker geometry.
export class MarkerGL extends BaseGLGlyph {
  protected prog: Program
  protected vbo_sx: VertexBuffer
  protected vbo_sy: VertexBuffer
  protected vbo_s: VertexBuffer
  protected vbo_a: VertexBuffer
  protected vbo_linewidth: VertexBuffer & {used?: boolean}
  protected vbo_fg_color: VertexBuffer & {used?: boolean}
  protected vbo_bg_color: VertexBuffer & {used?: boolean}
  protected index_buffer: IndexBuffer

  static is_supported(marker_type: MarkerType): boolean {
    switch (marker_type) {
      case "asterisk":
      case "circle":
      case "circle_cross":
      case "circle_x":
      case "cross":
      case "diamond":
      case "diamond_cross":
      case "hex":
      case "inverted_triangle":
      case "square":
      case "square_cross":
      case "square_x":
      case "triangle":
      case "x":
        return true
      default:
        return false
    }
  }

  constructor(gl: WebGLRenderingContext, readonly glyph: MarkerLikeView, readonly marker_type: MarkerType) {
    super(gl, glyph)

    const defs = [`#define USE_${marker_type.toUpperCase()}`]
    const vert = vertex_shader
    const frag = `${defs.join("\n")}\n\n${fragment_shader}`

    // The program
    this.prog = new Program(gl)
    this.prog.set_shaders(vert, frag)
    // Real attributes
    this.vbo_sx = new VertexBuffer(gl)
    this.prog.set_attribute('a_sx', 'float', this.vbo_sx)
    this.vbo_sy = new VertexBuffer(gl)
    this.prog.set_attribute('a_sy', 'float', this.vbo_sy)
    this.vbo_s = new VertexBuffer(gl)
    this.prog.set_attribute('a_size', 'float', this.vbo_s)
    this.vbo_a = new VertexBuffer(gl)
    this.prog.set_attribute('a_angle', 'float', this.vbo_a)
    // VBO's for attributes (they may not be used if value is singleton)
    this.vbo_linewidth = new VertexBuffer(gl)
    this.vbo_fg_color = new VertexBuffer(gl)
    this.vbo_bg_color = new VertexBuffer(gl)
    this.index_buffer = new IndexBuffer(gl)
  }

  draw(indices: number[], main_glyph: MarkerLikeView, trans: Transform): void {
    // The main glyph has the data, *this* glyph has the visuals.
    const mainGlGlyph = main_glyph.glglyph!
    const {nvertices} = mainGlGlyph

    // Upload data if we must. Only happens for main glyph.
    if (mainGlGlyph.data_changed) {
      mainGlGlyph._set_data(nvertices)
      if (this.glyph instanceof CircleView && this.glyph._radius != null) {
        // Keep screen radius up-to-date for circle glyph. Only happens when a radius is given
        this.vbo_s.set_data(0, map(this.glyph.sradius, (s) => s*2))
      }
      mainGlGlyph.data_changed = false
    }

    // Update visuals if we must. Can happen for all glyphs.
    if (this.visuals_changed) {
      this._set_visuals(nvertices)
      this.visuals_changed = false
    }

    // Handle transformation to device coordinates
    this.prog.set_uniform('u_pixel_ratio', 'float', [trans.pixel_ratio])
    this.prog.set_uniform('u_canvas_size', 'vec2', [trans.width, trans.height])

    // Select buffers from main glyph
    // (which may be this glyph but maybe not if this is a (non)selection glyph)
    this.prog.set_attribute('a_sx', 'float', mainGlGlyph.vbo_sx)
    this.prog.set_attribute('a_sy', 'float', mainGlGlyph.vbo_sy)
    this.prog.set_attribute('a_size', 'float', mainGlGlyph.vbo_s)
    this.prog.set_attribute('a_angle', 'float', mainGlGlyph.vbo_a)

    // Draw directly or using indices. Do not handle indices if they do not
    // fit in a uint16; WebGL 1.0 does not support uint32.
    if (indices.length == 0)
      return
    else if (indices.length === nvertices)
      this.prog.draw(this.gl.POINTS, [0, nvertices])
    else if (nvertices < 65535) {
      // On IE the marker size is reduced to 1 px when using an index buffer
      // A MS Edge dev on Twitter said on 24-04-2014: "gl_PointSize > 1.0 works
      // in DrawArrays; gl_PointSize > 1.0 in DrawElements is coming soon in the
      // next renderer update.
      const ua = window.navigator.userAgent
      if ((ua.indexOf("MSIE ") + ua.indexOf("Trident/") + ua.indexOf("Edge/")) > 0) {
        logger.warn('WebGL warning: IE is known to produce 1px sprites whith selections.')
      }
      this.index_buffer.set_size(indices.length*2)
      this.index_buffer.set_data(0, new Uint16Array(indices))
      this.prog.draw(this.gl.POINTS, this.index_buffer)
    } else {
      // Work around the limit that the indexbuffer must be uint16. We draw in chunks.
      // First collect indices in chunks
      const chunksize = 64000  // 65536
      const chunks: number[][] = []
      for (let i = 0, end = Math.ceil(nvertices/chunksize); i < end; i++) {
        chunks.push([])
      }
      for (let i = 0, end = indices.length; i < end; i++) {
        const uint16_index = indices[i] % chunksize
        const chunk = Math.floor(indices[i] / chunksize)
        chunks[chunk].push(uint16_index)
      }
      // Then draw each chunk
      for (let chunk = 0, end = chunks.length; chunk < end; chunk++) {
        const these_indices = new Uint16Array(chunks[chunk])
        const offset = chunk * chunksize * 4
        if (these_indices.length === 0) {
          continue
        }
        this.prog.set_attribute('a_sx', 'float', mainGlGlyph.vbo_sx, 0, offset)
        this.prog.set_attribute('a_sy', 'float', mainGlGlyph.vbo_sy, 0, offset)
        this.prog.set_attribute('a_size', 'float', mainGlGlyph.vbo_s, 0, offset)
        this.prog.set_attribute('a_angle', 'float', mainGlGlyph.vbo_a, 0, offset)
        if (this.vbo_linewidth.used) {
          this.prog.set_attribute('a_linewidth', 'float', this.vbo_linewidth, 0, offset)
        }
        if (this.vbo_fg_color.used) {
          this.prog.set_attribute('a_fg_color', 'vec4_uint8', this.vbo_fg_color, 0, offset*4, true)
        }
        if (this.vbo_bg_color.used) {
          this.prog.set_attribute('a_bg_color', 'vec4_uint8', this.vbo_bg_color, 0, offset*4, true)
        }
        // The actual drawing
        this.index_buffer.set_size(these_indices.length*2)
        this.index_buffer.set_data(0, these_indices)
        this.prog.draw(this.gl.POINTS, this.index_buffer)
      }
    }
  }

  protected _set_data(nvertices: number): void {
    const n = nvertices * 4  // in bytes
    // Set buffer size
    this.vbo_sx.set_size(n)
    this.vbo_sy.set_size(n)
    this.vbo_a.set_size(n)
    this.vbo_s.set_size(n)
    this.vbo_sx.set_data(0, this.glyph.sx)
    this.vbo_sy.set_data(0, this.glyph.sy)
    if (this.glyph._angle != null) {
      this.vbo_a.set_data(0, new Float32Array(this.glyph._angle))
    }
    if (this.glyph instanceof CircleView && this.glyph._radius != null)
      this.vbo_s.set_data(0, map(this.glyph.sradius, (s) => s*2))
    else
      this.vbo_s.set_data(0, new Float32Array(this.glyph._size))
  }

  protected _set_visuals(nvertices: number): void {
    const {line, fill} = this.glyph.visuals
    attach_float(this.prog, this.vbo_linewidth, 'a_linewidth', nvertices, line, line.line_width)
    attach_color(this.prog, this.vbo_fg_color, 'a_fg_color', nvertices, line, line.line_color, line.line_alpha)
    attach_color(this.prog, this.vbo_bg_color, 'a_bg_color', nvertices, fill, fill.fill_color, fill.fill_alpha)
    // Static value for antialias. Smaller aa-region to obtain crisper images
    this.prog.set_uniform('u_antialias', 'float', [0.8])
  }
}
