import {Program, VertexBuffer, IndexBuffer} from "gloo2"
import {BaseGLGlyph, Transform, attach_float, attach_color} from "./base"
import {vertex_shader} from "./markers.vert"
import {fragment_shader} from "./markers.frag"
import {MarkerView} from "../../markers/marker"
import {CircleView} from "../circle"
import {Class} from "core/class"
import {map} from "core/util/arrayable"
import {logger} from "core/logging"

// Base class for markers. All markers share the same GLSL, except for one
// function that defines the marker geometry.
export abstract class MarkerGLGlyph extends BaseGLGlyph {
  readonly glyph: MarkerView | CircleView

  protected abstract get _marker_code(): string

  protected prog: Program
  protected vbo_x: VertexBuffer
  protected vbo_y: VertexBuffer
  protected vbo_s: VertexBuffer
  protected vbo_a: VertexBuffer
  protected vbo_linewidth: VertexBuffer & {used?: boolean}
  protected vbo_fg_color: VertexBuffer & {used?: boolean}
  protected vbo_bg_color: VertexBuffer & {used?: boolean}
  protected index_buffer: IndexBuffer

  protected last_trans: Transform

  protected _baked_offset: [number, number]

  protected init(): void {
    const {gl} = this

    const vert = vertex_shader
    const frag = fragment_shader(this._marker_code)

    // The program
    this.prog = new Program(gl)
    this.prog.set_shaders(vert, frag)
    // Real attributes
    this.vbo_x = new VertexBuffer(gl)
    this.prog.set_attribute('a_x', 'float', this.vbo_x)
    this.vbo_y = new VertexBuffer(gl)
    this.prog.set_attribute('a_y', 'float', this.vbo_y)
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

  draw(indices: number[], mainGlyph: MarkerView | CircleView, trans: Transform): void {
    // The main glyph has the data, *this* glyph has the visuals.
    const mainGlGlyph = mainGlyph.glglyph
    const {nvertices} = mainGlGlyph

    // Upload data if we must. Only happens for main glyph.
    if (mainGlGlyph.data_changed) {
      if (!(isFinite(trans.dx) && isFinite(trans.dy))) {
        return;  // not sure why, but it happens on init sometimes (#4367)
      }
      mainGlGlyph._baked_offset = [trans.dx, trans.dy];  // float32 precision workaround; used in _set_data() and below
      mainGlGlyph._set_data(nvertices)
      mainGlGlyph.data_changed = false
    } else if (this.glyph instanceof CircleView && this.glyph._radius != null &&
               (this.last_trans == null || trans.sx != this.last_trans.sx || trans.sy != this.last_trans.sy)) {
      // Keep screen radius up-to-date for circle glyph. Only happens when a radius is given
      this.last_trans = trans
      this.vbo_s.set_data(0, new Float32Array(map(this.glyph.sradius, (s) => s*2)))
    }

    // Update visuals if we must. Can happen for all glyphs.
    if (this.visuals_changed) {
      this._set_visuals(nvertices)
      this.visuals_changed = false
    }

    // Handle transformation to device coordinates
    // Note the baked-in offset to avoid float32 precision problems
    const baked_offset = mainGlGlyph._baked_offset
    this.prog.set_uniform('u_pixel_ratio', 'float', [trans.pixel_ratio])
    this.prog.set_uniform('u_canvas_size', 'vec2', [trans.width, trans.height])
    this.prog.set_uniform('u_offset', 'vec2', [trans.dx - baked_offset[0], trans.dy - baked_offset[1]])
    this.prog.set_uniform('u_scale', 'vec2', [trans.sx, trans.sy])

    // Select buffers from main glyph
    // (which may be this glyph but maybe not if this is a (non)selection glyph)
    this.prog.set_attribute('a_x', 'float', mainGlGlyph.vbo_x)
    this.prog.set_attribute('a_y', 'float', mainGlGlyph.vbo_y)
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
      const chunksize = 64000;  // 65536
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
        this.prog.set_attribute('a_x', 'float', mainGlGlyph.vbo_x, 0, offset)
        this.prog.set_attribute('a_y', 'float', mainGlGlyph.vbo_y, 0, offset)
        this.prog.set_attribute('a_size', 'float', mainGlGlyph.vbo_s, 0, offset)
        this.prog.set_attribute('a_angle', 'float', mainGlGlyph.vbo_a, 0, offset)
        if (this.vbo_linewidth.used) {
          this.prog.set_attribute('a_linewidth', 'float', this.vbo_linewidth, 0, offset)
        }
        if (this.vbo_fg_color.used) {
          this.prog.set_attribute('a_fg_color', 'vec4', this.vbo_fg_color, 0, offset * 4)
        }
        if (this.vbo_bg_color.used) {
          this.prog.set_attribute('a_bg_color', 'vec4', this.vbo_bg_color, 0, offset * 4)
        }
        // The actual drawing
        this.index_buffer.set_size(these_indices.length*2)
        this.index_buffer.set_data(0, these_indices)
        this.prog.draw(this.gl.POINTS, this.index_buffer)
      }
    }
  }

  protected _set_data(nvertices: number): void {
    const n = nvertices * 4;  // in bytes
    // Set buffer size
    this.vbo_x.set_size(n)
    this.vbo_y.set_size(n)
    this.vbo_a.set_size(n)
    this.vbo_s.set_size(n)
    // Upload data for x and y, apply a baked-in offset for float32 precision (issue #3795)
    // The exact value for the baked_offset does not matter, as long as it brings the data to less extreme values
    const xx = new Float64Array(this.glyph._x)
    const yy = new Float64Array(this.glyph._y)
    for (let i = 0, end = nvertices; i < end; i++) {
       xx[i] += this._baked_offset[0]
       yy[i] += this._baked_offset[1]
    }
    this.vbo_x.set_data(0, new Float32Array(xx))
    this.vbo_y.set_data(0, new Float32Array(yy))
    // Angle if available; circle does not have angle. If we don't set data, angle is default 0 in glsl
    if (this.glyph._angle != null) {
      this.vbo_a.set_data(0, new Float32Array(this.glyph._angle))
    }
    // Radius is special; some markes allow radius in data-coords instead of screen coords
    // @radius tells us that radius is in units, sradius is the pre-calculated screen radius
    if (this.glyph instanceof CircleView && this.glyph._radius != null)
      this.vbo_s.set_data(0, new Float32Array(map(this.glyph.sradius, (s) => s*2)))
    else
      this.vbo_s.set_data(0, new Float32Array(this.glyph._size))
  }

  protected _set_visuals(nvertices: number): void {
    attach_float(this.prog, this.vbo_linewidth, 'a_linewidth', nvertices, this.glyph.visuals.line, 'line_width')
    attach_color(this.prog, this.vbo_fg_color, 'a_fg_color', nvertices, this.glyph.visuals.line, 'line')
    attach_color(this.prog, this.vbo_bg_color, 'a_bg_color', nvertices, this.glyph.visuals.fill, 'fill')
    // Static value for antialias. Smaller aa-region to obtain crisper images
    this.prog.set_uniform('u_antialias', 'float', [0.8])
  }
}

function mk_marker(code: string): Class<MarkerGLGlyph> {
  return class extends MarkerGLGlyph {
    protected get _marker_code(): string {
      return code
    }
  }
}

import * as glsl from "./markers.frag"

export const CircleGLGlyph           = mk_marker(glsl.circle)
export const SquareGLGlyph           = mk_marker(glsl.square)
export const DiamondGLGlyph          = mk_marker(glsl.diamond)
export const TriangleGLGlyph         = mk_marker(glsl.triangle)
export const InvertedTriangleGLGlyph = mk_marker(glsl.invertedtriangle)
export const HexGLGlyph              = mk_marker(glsl.hex)
export const CrossGLGlyph            = mk_marker(glsl.cross)
export const CircleCrossGLGlyph      = mk_marker(glsl.circlecross)
export const SquareCrossGLGlyph      = mk_marker(glsl.squarecross)
export const DiamondCrossGLGlyph     = mk_marker(glsl.diamondcross)
export const XGLGlyph                = mk_marker(glsl.x)
export const CircleXGLGlyph          = mk_marker(glsl.circlex)
export const SquareXGLGlyph          = mk_marker(glsl.squarex)
export const AsteriskGLGlyph         = mk_marker(glsl.asterisk)
