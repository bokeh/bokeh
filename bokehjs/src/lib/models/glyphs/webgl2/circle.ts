// WebGL2 implementation for Circle glyph with GPU-side coordinate transforms
import type {Transform} from "./types"
import {BaseGL2Glyph} from "./base"
import type {WebGL2Wrapper} from "./webgl2_wrapper"
import type {CircleView} from "../circle"
import type {GlyphView} from "../glyph"

// Missing data marker value (avoiding NaN/Inf for GPU precision)
const MISSING_POINT = -10000

// Uniform buffer layout (must match shader UBO):
// 0-1: canvas_size (vec2)
// 2: antialias (f32)
// 3: size_hint (f32)
// 4-7: border_radius (vec4)
// 8: x_scale (f32)
// 9: x_offset (f32)
// 10: y_scale (f32)
// 11: y_offset (f32)
// 12: radius_scale (f32)
// 13-15: padding
const UNIFORM_FLOATS = 16

// Attribute locations (must match shader layout)
const LOC_POSITION = 0    // a_position (quad vertex)
const LOC_CENTER = 1      // a_center
const LOC_SIZE = 2        // a_size
const LOC_ANGLE_AUX = 3   // a_angle_aux
const LOC_LINE_PROPS = 4  // a_line_props
const LOC_LINE_COLOR = 5  // a_line_color
const LOC_FILL_COLOR = 6  // a_fill_color

export class CircleGL2 extends BaseGL2Glyph {
  private readonly _antialias: number = 1.5

  // GPU buffers - separate for different update frequencies
  private _position_buffer: WebGLBuffer | null = null    // DATA coords - only changes on data change
  private _size_buffer: WebGLBuffer | null = null        // DATA units - only changes on data change
  private _geometry_buffer: WebGLBuffer | null = null    // Only changes on data change
  private _line_props_buffer: WebGLBuffer | null = null  // Changes on visual/selection
  private _line_color_buffer: WebGLBuffer | null = null  // Changes on visual change
  private _fill_color_buffer: WebGLBuffer | null = null  // Changes on visual change
  private _uniform_buffer: WebGLBuffer | null = null

  // VAO for this glyph instance
  private _vao: WebGLVertexArrayObject | null = null
  private _vao_needs_setup: boolean = true

  // CPU-side arrays - reused to avoid allocations
  private _position_data: Float32Array | null = null   // 2 floats per marker (DATA coords)
  private _size_data: Float32Array | null = null       // 2 floats per marker (DATA units)
  private _geometry_data: Float32Array | null = null   // 2 floats per marker
  private _line_props_data: Float32Array | null = null // 4 floats per marker
  private _line_color_data: Float32Array | null = null // 4 floats per marker
  private _fill_color_data: Float32Array | null = null // 4 floats per marker
  private _uniform_data: Float32Array = new Float32Array(UNIFORM_FLOATS)

  // Track what needs updating (for CPU-side array rebuild)
  private _data_dirty: boolean = true  // True when actual data changes
  private _visuals_dirty: boolean = true
  private _last_nmarkers: number = 0

  // Track what needs uploading to GPU
  private _positions_upload_needed: boolean = true
  private _sizes_upload_needed: boolean = true
  private _geometry_upload_needed: boolean = true
  private _line_color_upload_needed: boolean = true
  private _fill_color_upload_needed: boolean = true

  constructor(wrapper: WebGL2Wrapper, override readonly glyph: CircleView) {
    super(wrapper, glyph)
  }

  draw(indices: number[], main_glyph: GlyphView, transform: Transform): void {
    const main_circle = main_glyph as CircleView
    const main_gl2 = main_circle.gl2glyph

    if (main_gl2 == null) {
      return
    }

    // Only mark data dirty when actual DATA changes, not on pan/zoom
    if (main_gl2.data_changed) {
      main_gl2._data_dirty = true
      main_gl2.data_changed = false
    }

    // Clear data_mapped flag - transform changes handled via uniforms
    if (main_gl2.data_mapped) {
      main_gl2.data_mapped = false
    }

    // Mark THIS glyph's visuals dirty
    if (this.visuals_changed) {
      this._visuals_dirty = true
      this.visuals_changed = false
    }

    this._draw_markers(indices, transform, main_gl2)
  }

  private _draw_markers(indices: number[], transform: Transform, main_gl2: CircleGL2): void {
    const {webgl2_wrapper} = this
    const gl = webgl2_wrapper.gl

    const nmarkers = main_gl2.nvertices
    if (nmarkers === 0) {
      return
    }

    // Ensure we have the data we need before proceeding
    if (main_gl2._position_data == null && !main_gl2._data_dirty) {
      main_gl2._data_dirty = true
    }

    const size_changed = main_gl2._last_nmarkers !== nmarkers
    main_gl2._last_nmarkers = nmarkers

    const this_size_changed = this._last_nmarkers !== nmarkers
    this._last_nmarkers = nmarkers

    // Update GEOMETRY buffers from main_gl2 (shared data)
    if (main_gl2._data_dirty || size_changed) {
      main_gl2._update_data_coords(nmarkers)
      main_gl2._data_dirty = false
      main_gl2._positions_upload_needed = true
      main_gl2._sizes_upload_needed = true
      main_gl2._geometry_upload_needed = true
    }

    // Update VISUAL buffers from THIS glyph
    if (this._visuals_dirty || this_size_changed) {
      this._update_visuals(nmarkers)
      this._visuals_dirty = false
      this._line_color_upload_needed = true
      this._fill_color_upload_needed = true
    }

    // Update show flags based on indices (for selection support)
    this._update_show_flags(indices, nmarkers)

    // Upload GEOMETRY buffers from main_gl2 (shared)
    if (main_gl2._positions_upload_needed) {
      main_gl2._position_buffer = this._upload_buffer(gl, main_gl2._position_data!, main_gl2._position_buffer)
      main_gl2._positions_upload_needed = false
      this._vao_needs_setup = true
    }
    if (main_gl2._sizes_upload_needed) {
      main_gl2._size_buffer = this._upload_buffer(gl, main_gl2._size_data!, main_gl2._size_buffer)
      main_gl2._sizes_upload_needed = false
      this._vao_needs_setup = true
    }
    if (main_gl2._geometry_upload_needed) {
      main_gl2._geometry_buffer = this._upload_buffer(gl, main_gl2._geometry_data!, main_gl2._geometry_buffer)
      main_gl2._geometry_upload_needed = false
      this._vao_needs_setup = true
    }

    // Upload VISUAL buffers from THIS glyph
    // line_props always needs upload since show flags change every draw
    this._line_props_buffer = this._upload_buffer(gl, this._line_props_data!, this._line_props_buffer)
    if (this._line_color_upload_needed) {
      this._line_color_buffer = this._upload_buffer(gl, this._line_color_data!, this._line_color_buffer)
      this._line_color_upload_needed = false
      this._vao_needs_setup = true
    }
    if (this._fill_color_upload_needed) {
      this._fill_color_buffer = this._upload_buffer(gl, this._fill_color_data!, this._fill_color_buffer)
      this._fill_color_upload_needed = false
      this._vao_needs_setup = true
    }

    // Update uniform buffer with canvas size and coordinate transform
    this._update_uniforms(transform)

    if (this._uniform_buffer == null) {
      this._uniform_buffer = webgl2_wrapper.create_uniform_buffer(this._uniform_data.buffer as ArrayBuffer)
    } else {
      webgl2_wrapper.update_uniform_buffer(this._uniform_buffer, this._uniform_data.buffer as ArrayBuffer)
    }

    // Get program
    const program = webgl2_wrapper.get_marker_program("circle")
    if (program == null) {
      return
    }

    // Setup VAO if needed
    if (this._vao == null) {
      this._vao = gl.createVertexArray()
      this._vao_needs_setup = true
    }

    if (this._vao_needs_setup) {
      this._setup_vao(gl, main_gl2)
      this._vao_needs_setup = false
    }

    // Begin rendering
    gl.useProgram(program)

    // Set viewport to match canvas size (in device pixels)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    // Handle clear
    if (webgl2_wrapper.needs_clear) {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      webgl2_wrapper.consume_clear()
    }

    // Set up blending (premultiplied alpha: One + OneMinusSrcAlpha)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // Apply scissor
    const scissor = webgl2_wrapper.scissor
    gl.enable(gl.SCISSOR_TEST)
    // WebGL2 scissor Y is from bottom-left, need to flip
    const canvas_height = gl.canvas.height
    gl.scissor(
      scissor.x,
      canvas_height - scissor.y - scissor.height,
      scissor.width,
      scissor.height,
    )

    // Bind UBO
    webgl2_wrapper.bind_uniform_buffer(this._uniform_buffer)

    // Bind VAO and draw
    gl.bindVertexArray(this._vao)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, nmarkers)
    gl.bindVertexArray(null)

    // Cleanup state
    gl.disable(gl.SCISSOR_TEST)
    gl.disable(gl.BLEND)
    gl.useProgram(null)

    // Mark that we've rendered something this frame
    webgl2_wrapper.mark_rendered()
  }

  private _setup_vao(gl: WebGL2RenderingContext, main_gl2: CircleGL2): void {
    gl.bindVertexArray(this._vao)

    // Buffer 0: Quad geometry (per-vertex)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl2_wrapper.rect_geometry)
    gl.enableVertexAttribArray(LOC_POSITION)
    gl.vertexAttribPointer(LOC_POSITION, 2, gl.FLOAT, false, 0, 0)
    // Per-vertex (divisor = 0, default)

    // Buffer 1: Position/center (per-instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, main_gl2._position_buffer)
    gl.enableVertexAttribArray(LOC_CENTER)
    gl.vertexAttribPointer(LOC_CENTER, 2, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(LOC_CENTER, 1)

    // Buffer 2: Size (per-instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, main_gl2._size_buffer)
    gl.enableVertexAttribArray(LOC_SIZE)
    gl.vertexAttribPointer(LOC_SIZE, 2, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(LOC_SIZE, 1)

    // Buffer 3: Geometry (per-instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, main_gl2._geometry_buffer)
    gl.enableVertexAttribArray(LOC_ANGLE_AUX)
    gl.vertexAttribPointer(LOC_ANGLE_AUX, 2, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(LOC_ANGLE_AUX, 1)

    // Buffer 4: Line properties (per-instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, this._line_props_buffer)
    gl.enableVertexAttribArray(LOC_LINE_PROPS)
    gl.vertexAttribPointer(LOC_LINE_PROPS, 4, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(LOC_LINE_PROPS, 1)

    // Buffer 5: Line color (per-instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, this._line_color_buffer)
    gl.enableVertexAttribArray(LOC_LINE_COLOR)
    gl.vertexAttribPointer(LOC_LINE_COLOR, 4, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(LOC_LINE_COLOR, 1)

    // Buffer 6: Fill color (per-instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, this._fill_color_buffer)
    gl.enableVertexAttribArray(LOC_FILL_COLOR)
    gl.vertexAttribPointer(LOC_FILL_COLOR, 4, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(LOC_FILL_COLOR, 1)

    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindVertexArray(null)
  }

  private _update_uniforms(transform: Transform): void {
    const renderer = this.glyph.renderer
    const frame = renderer.plot_view.frame

    const x_scale = frame.x_scales.get(renderer.model.x_range_name)
    const y_scale = frame.y_scales.get(renderer.model.y_range_name)

    if (x_scale == null || y_scale == null) {
      return
    }

    const x_source = x_scale.source_range
    const x_target = x_scale.target_range
    const y_source = y_scale.source_range
    const y_target = y_scale.target_range

    const x_factor = (x_target.end - x_target.start) / (x_source.end - x_source.start)
    const x_offset = -(x_factor * x_source.start) + x_target.start

    const y_factor = (y_target.end - y_target.start) / (y_source.end - y_source.start)
    const y_offset = -(y_factor * y_source.start) + y_target.start

    const radius_scale = Math.abs(x_factor)

    this._uniform_data[0] = transform.width
    this._uniform_data[1] = transform.height
    this._uniform_data[2] = this._antialias / transform.pixel_ratio
    this._uniform_data[3] = 1.0 // size_hint for circle
    // border_radius (unused for circle)
    this._uniform_data[4] = 0
    this._uniform_data[5] = 0
    this._uniform_data[6] = 0
    this._uniform_data[7] = 0
    // Transform parameters
    this._uniform_data[8] = x_factor
    this._uniform_data[9] = x_offset
    this._uniform_data[10] = y_factor
    this._uniform_data[11] = y_offset
    this._uniform_data[12] = radius_scale
    // Padding
    this._uniform_data[13] = 0
    this._uniform_data[14] = 0
    this._uniform_data[15] = 0
  }

  private _upload_buffer(
    gl: WebGL2RenderingContext,
    data: Float32Array,
    existing: WebGLBuffer | null,
  ): WebGLBuffer {
    const byte_size = data.byteLength

    if (existing == null) {
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      return buffer
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, existing)
    // Check if buffer is large enough
    const current_size = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)
    if (current_size < byte_size) {
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
      this._vao_needs_setup = true
    } else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    return existing
  }

  private _ensure_array(current: Float32Array | null, required_length: number): Float32Array {
    if (current == null || current.length < required_length) {
      return new Float32Array(required_length)
    }
    return current
  }

  // Store DATA coordinates (x, y) and DATA-unit sizes (radius)
  private _update_data_coords(nmarkers: number): void {
    this._position_data = this._ensure_array(this._position_data, nmarkers * 2)
    this._size_data = this._ensure_array(this._size_data, nmarkers * 2)
    this._geometry_data = this._ensure_array(this._geometry_data, nmarkers * 2)

    const pos_data = this._position_data
    const size_data = this._size_data
    const geom_data = this._geometry_data

    const {x, y, radius} = this.glyph

    for (let i = 0; i < nmarkers; i++) {
      const x_i = x[i]
      const y_i = y[i]
      if (!isFinite(x_i) || !isFinite(y_i)) {
        pos_data[i * 2] = MISSING_POINT
        pos_data[i * 2 + 1] = MISSING_POINT
      } else {
        pos_data[i * 2] = x_i
        pos_data[i * 2 + 1] = y_i
      }

      const r = radius.get(i)
      const diameter = r * 2
      size_data[i * 2] = diameter
      size_data[i * 2 + 1] = diameter

      geom_data[i * 2] = 0
      geom_data[i * 2 + 1] = 0
    }
  }

  private _update_visuals(nmarkers: number): void {
    this._line_props_data = this._ensure_array(this._line_props_data, nmarkers * 4)
    this._line_color_data = this._ensure_array(this._line_color_data, nmarkers * 4)
    this._fill_color_data = this._ensure_array(this._fill_color_data, nmarkers * 4)

    const line_props = this._line_props_data
    const line_color = this._line_color_data
    const fill_color = this._fill_color_data

    const visuals = this.glyph.visuals
    const line = visuals.line
    const fill = visuals.fill

    for (let i = 0; i < nmarkers; i++) {
      const offset = i * 4

      line_props[offset] = line.line_width.get(i)
      line_props[offset + 1] = 0  // unused (cap not needed for circles)
      line_props[offset + 2] = 0  // unused (join not needed for circles)
      line_props[offset + 3] = 1.0 // show flag, updated in _update_show_flags

      // Line color - RGBA packed as 32-bit integer
      const lc = line.line_color.get(i)
      const lc_a = (lc & 0xff) / 255
      const line_alpha = line.line_alpha.get(i) * lc_a
      line_color[offset] = ((lc >> 24) & 0xff) / 255     // R
      line_color[offset + 1] = ((lc >> 16) & 0xff) / 255 // G
      line_color[offset + 2] = ((lc >> 8) & 0xff) / 255  // B
      line_color[offset + 3] = line_alpha

      // Fill color - RGBA packed as 32-bit integer
      const fc = fill.fill_color.get(i)
      const fc_a = (fc & 0xff) / 255
      const fill_alpha = fill.fill_alpha.get(i) * fc_a
      fill_color[offset] = ((fc >> 24) & 0xff) / 255     // R
      fill_color[offset + 1] = ((fc >> 16) & 0xff) / 255 // G
      fill_color[offset + 2] = ((fc >> 8) & 0xff) / 255  // B
      fill_color[offset + 3] = fill_alpha
    }
  }

  private _update_show_flags(indices: number[], nmarkers: number): void {
    if (this._line_props_data == null) {
      return
    }

    const line_props = this._line_props_data

    if (indices.length < nmarkers) {
      for (let i = 0; i < nmarkers; i++) {
        line_props[i * 4 + 3] = 0.0
      }
      for (const idx of indices) {
        line_props[idx * 4 + 3] = 1.0
      }
    } else {
      for (let i = 0; i < nmarkers; i++) {
        line_props[i * 4 + 3] = 1.0
      }
    }
  }

  destroy(): void {
    const gl = this.webgl2_wrapper.gl
    if (this._position_buffer != null) {
      gl.deleteBuffer(this._position_buffer)
    }
    if (this._size_buffer != null) {
      gl.deleteBuffer(this._size_buffer)
    }
    if (this._geometry_buffer != null) {
      gl.deleteBuffer(this._geometry_buffer)
    }
    if (this._line_props_buffer != null) {
      gl.deleteBuffer(this._line_props_buffer)
    }
    if (this._line_color_buffer != null) {
      gl.deleteBuffer(this._line_color_buffer)
    }
    if (this._fill_color_buffer != null) {
      gl.deleteBuffer(this._fill_color_buffer)
    }
    if (this._uniform_buffer != null) {
      gl.deleteBuffer(this._uniform_buffer)
    }
    if (this._vao != null) {
      gl.deleteVertexArray(this._vao)
    }
  }
}
