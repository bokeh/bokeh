// WebGPU implementation for Circle glyph with GPU-side coordinate transforms
import type {Transform} from "./types"
import {BaseGPUGlyph} from "./base"
import type {WebGPUWrapper} from "./webgpu_wrapper"
import type {CircleView} from "../circle"
import type {GlyphView} from "../glyph"
import type * as visuals from "core/visuals"

export type MarkerVisuals = {
  readonly line: visuals.LineVector
  readonly fill: visuals.FillVector
  readonly hatch: visuals.HatchVector
}

// Missing data marker value (avoiding NaN/Inf for GPU precision)
const MISSING_POINT = -10000

// Uniform buffer layout (must match shader):
// 0-1: canvas_size (vec2f)
// 2: antialias (f32)
// 3: size_hint (f32)
// 4-7: border_radius (vec4f)
// 8: x_scale (f32)
// 9: x_offset (f32)
// 10: y_scale (f32)
// 11: y_offset (f32)
// 12: radius_scale (f32)
// 13-15: padding
const UNIFORM_FLOATS = 16

export class CircleGPU extends BaseGPUGlyph {
  private readonly _antialias: number = 1.5

  // GPU buffers - separate for different update frequencies
  private _position_buffer: GPUBuffer | null = null    // DATA coords - only changes on data change
  private _size_buffer: GPUBuffer | null = null        // DATA units - only changes on data change
  private _geometry_buffer: GPUBuffer | null = null    // Only changes on data change
  private _line_props_buffer: GPUBuffer | null = null  // Changes on visual/selection
  private _line_color_buffer: GPUBuffer | null = null  // Changes on visual change
  private _fill_color_buffer: GPUBuffer | null = null  // Changes on visual change
  private _uniform_buffer: GPUBuffer | null = null
  private _bind_group: GPUBindGroup | null = null

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

  constructor(wrapper: WebGPUWrapper, override readonly glyph: CircleView) {
    super(wrapper, glyph)
  }

  draw(indices: number[], main_glyph: GlyphView, transform: Transform): void {
    const main_circle = main_glyph as CircleView
    const main_gpu = main_circle.gpuglyph

    if (main_gpu == null) {
      return
    }

    // Only mark data dirty when actual DATA changes, not on pan/zoom
    // data_changed = true when source data changes
    // data_mapped = true on pan/zoom (but we handle this via uniforms now)
    if (main_gpu.data_changed) {
      main_gpu._data_dirty = true
      main_gpu.data_changed = false
    }

    // We still need to clear data_mapped flag, but we don't rebuild buffers
    if (main_gpu.data_mapped) {
      main_gpu.data_mapped = false
      // Transform changes are handled via uniforms - no buffer rebuild needed!
    }

    // Mark THIS glyph's visuals dirty (not main_gpu's)
    // Each glyph (main, selection, nonselection) has its own visuals
    if (this.visuals_changed) {
      this._visuals_dirty = true
      this.visuals_changed = false
    }

    this._draw_markers(indices, transform, main_gpu)
  }

  private _draw_markers(indices: number[], transform: Transform, main_gpu: CircleGPU): void {
    const {webgpu_wrapper} = this
    const device = webgpu_wrapper.device

    const nmarkers = main_gpu.nvertices
    if (nmarkers === 0) {
      return
    }

    // Ensure we have the data we need before proceeding
    if (main_gpu._position_data == null && !main_gpu._data_dirty) {
      // Force data update if we don't have position data yet
      main_gpu._data_dirty = true
    }

    const size_changed = main_gpu._last_nmarkers !== nmarkers
    main_gpu._last_nmarkers = nmarkers

    // Track if THIS glyph's marker count changed (for buffer allocation)
    const this_size_changed = this._last_nmarkers !== nmarkers
    this._last_nmarkers = nmarkers

    // Update GEOMETRY buffers from main_gpu (shared data)
    if (main_gpu._data_dirty || size_changed) {
      main_gpu._update_data_coords(nmarkers)
      main_gpu._data_dirty = false
      main_gpu._positions_upload_needed = true
      main_gpu._sizes_upload_needed = true
      main_gpu._geometry_upload_needed = true
    }

    // Update VISUAL buffers from THIS glyph (each glyph has its own visuals)
    // This is critical for selection - nonselection_glyph has faded alpha
    if (this._visuals_dirty || this_size_changed) {
      this._update_visuals(nmarkers)
      this._visuals_dirty = false
      this._line_color_upload_needed = true
      this._fill_color_upload_needed = true
    }

    // Update show flags based on indices (for selection support)
    // This needs to happen on every draw call since indices can change
    this._update_show_flags(indices, nmarkers)

    // Upload GEOMETRY buffers from main_gpu (shared)
    if (main_gpu._positions_upload_needed) {
      this._upload_buffer(device, main_gpu._position_data!, main_gpu, "_position_buffer")
      main_gpu._positions_upload_needed = false
    }
    if (main_gpu._sizes_upload_needed) {
      this._upload_buffer(device, main_gpu._size_data!, main_gpu, "_size_buffer")
      main_gpu._sizes_upload_needed = false
    }
    if (main_gpu._geometry_upload_needed) {
      this._upload_buffer(device, main_gpu._geometry_data!, main_gpu, "_geometry_buffer")
      main_gpu._geometry_upload_needed = false
    }

    // Upload VISUAL buffers from THIS glyph (each has its own visuals)
    // line_props always needs upload since show flags change every draw
    this._upload_buffer(device, this._line_props_data!, this, "_line_props_buffer")
    if (this._line_color_upload_needed) {
      this._upload_buffer(device, this._line_color_data!, this, "_line_color_buffer")
      this._line_color_upload_needed = false
    }
    if (this._fill_color_upload_needed) {
      this._upload_buffer(device, this._fill_color_data!, this, "_fill_color_buffer")
      this._fill_color_upload_needed = false
    }

    // Update uniform buffer with canvas size and coordinate transform
    // This is the ONLY thing that changes on pan/zoom!
    this._update_uniforms(transform)

    if (this._uniform_buffer == null) {
      this._uniform_buffer = device.createBuffer({
        size: UNIFORM_FLOATS * 4,  // 16 floats * 4 bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })
      this._bind_group = webgpu_wrapper.create_marker_bind_group(this._uniform_buffer)
    }
    device.queue.writeBuffer(this._uniform_buffer, 0, this._uniform_data.buffer, this._uniform_data.byteOffset, this._uniform_data.byteLength)

    // Get render pipeline (cached in wrapper)
    const pipeline = webgpu_wrapper.get_marker_pipeline("circle", false)

    // Get current texture to render to
    const texture_view = webgpu_wrapper.context.getCurrentTexture().createView()

    // Create command encoder and render pass
    const command_encoder = device.createCommandEncoder()
    const loadOp = webgpu_wrapper.get_load_op()

    const render_pass = command_encoder.beginRenderPass({
      colorAttachments: [{
        view: texture_view,
        clearValue: {r: 0, g: 0, b: 0, a: 0},
        loadOp,
        storeOp: "store",
      }],
    })

    render_pass.setPipeline(pipeline)
    render_pass.setBindGroup(0, this._bind_group)
    render_pass.setVertexBuffer(0, webgpu_wrapper.rect_geometry)
    // Geometry buffers from main_gpu (shared data)
    render_pass.setVertexBuffer(1, main_gpu._position_buffer)
    render_pass.setVertexBuffer(2, main_gpu._size_buffer)
    render_pass.setVertexBuffer(3, main_gpu._geometry_buffer)
    // Visual buffers from THIS glyph (selection/nonselection have different visuals)
    render_pass.setVertexBuffer(4, this._line_props_buffer)
    render_pass.setVertexBuffer(5, this._line_color_buffer)
    render_pass.setVertexBuffer(6, this._fill_color_buffer)

    // Apply scissor rect to clip rendering to the plot frame
    const scissor = webgpu_wrapper.scissor
    render_pass.setScissorRect(scissor.x, scissor.y, scissor.width, scissor.height)

    render_pass.draw(4, nmarkers, 0, 0)
    render_pass.end()

    device.queue.submit([command_encoder.finish()])

    // Mark that we've rendered something this frame
    webgpu_wrapper.mark_rendered()
  }

  private _update_uniforms(transform: Transform): void {
    // Get the coordinate transform from the renderer
    const renderer = this.glyph.renderer
    const frame = renderer.plot_view.frame

    // Get scales for x and y
    const x_scale = frame.x_scales.get(renderer.model.x_range_name)
    const y_scale = frame.y_scales.get(renderer.model.y_range_name)

    if (x_scale == null || y_scale == null) {
      return
    }

    // For linear scales: screen = data * factor + offset
    // We need to extract factor and offset from the scale
    const x_source = x_scale.source_range
    const x_target = x_scale.target_range
    const y_source = y_scale.source_range
    const y_target = y_scale.target_range

    const x_factor = (x_target.end - x_target.start) / (x_source.end - x_source.start)
    const x_offset = -(x_factor * x_source.start) + x_target.start

    const y_factor = (y_target.end - y_target.start) / (y_source.end - y_source.start)
    const y_offset = -(y_factor * y_source.start) + y_target.start

    // For radius, use the x scale factor (could be made configurable)
    const radius_scale = Math.abs(x_factor)

    // Fill uniform data
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
    device: GPUDevice,
    data: Float32Array,
    target: CircleGPU,
    buffer_name: "_position_buffer" | "_size_buffer" | "_geometry_buffer" | "_line_props_buffer" | "_line_color_buffer" | "_fill_color_buffer",
  ): void {
    const byte_size = data.byteLength
    const existing = target[buffer_name]

    if (existing == null || existing.size < byte_size) {
      existing?.destroy()
      target[buffer_name] = device.createBuffer({
        size: byte_size,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      })
    }
    device.queue.writeBuffer(target[buffer_name]!, 0, data.buffer, data.byteOffset, data.byteLength)
  }

  private _ensure_array(current: Float32Array | null, required_length: number): Float32Array {
    if (current == null || current.length < required_length) {
      return new Float32Array(required_length)
    }
    return current
  }

  // Store DATA coordinates (x, y) and DATA-unit sizes (radius)
  // These only change when the actual data source changes, NOT on pan/zoom
  private _update_data_coords(nmarkers: number): void {
    this._position_data = this._ensure_array(this._position_data, nmarkers * 2)
    this._size_data = this._ensure_array(this._size_data, nmarkers * 2)
    this._geometry_data = this._ensure_array(this._geometry_data, nmarkers * 2)

    const pos_data = this._position_data
    const size_data = this._size_data
    const geom_data = this._geometry_data

    // Get DATA coordinates (not screen coordinates)
    const {x, y, radius} = this.glyph

    for (let i = 0; i < nmarkers; i++) {
      // Position in DATA coordinates
      const x_i = x[i]
      const y_i = y[i]
      if (!isFinite(x_i) || !isFinite(y_i)) {
        pos_data[i * 2] = MISSING_POINT
        pos_data[i * 2 + 1] = MISSING_POINT
      } else {
        pos_data[i * 2] = x_i
        pos_data[i * 2 + 1] = y_i
      }

      // Size in DATA units (diameter = radius * 2)
      const r = radius.get(i)
      const diameter = r * 2
      size_data[i * 2] = diameter
      size_data[i * 2 + 1] = diameter

      // Geometry buffer: angle, aux (both 0 for circles)
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

      // Line props: linewidth, unused, unused, show (show set later)
      line_props[offset] = line.line_width.get(i)
      line_props[offset + 1] = 0  // unused (cap not needed for circles)
      line_props[offset + 2] = 0  // unused (join not needed for circles)
      line_props[offset + 3] = 1.0 // show flag, updated in _update_show_flags

      // Line color - RGBA packed as 32-bit integer with R at bits 24-31, G at 16-23, B at 8-15, A at 0-7
      const lc = line.line_color.get(i)
      const lc_a = (lc & 0xff) / 255  // A from color
      const line_alpha = line.line_alpha.get(i) * lc_a  // Combined alpha
      line_color[offset] = ((lc >> 24) & 0xff) / 255     // R
      line_color[offset + 1] = ((lc >> 16) & 0xff) / 255 // G
      line_color[offset + 2] = ((lc >> 8) & 0xff) / 255  // B
      line_color[offset + 3] = line_alpha

      // Fill color - RGBA packed as 32-bit integer with R at bits 24-31, G at 16-23, B at 8-15, A at 0-7
      const fc = fill.fill_color.get(i)
      const fc_a = (fc & 0xff) / 255  // A from color
      const fill_alpha = fill.fill_alpha.get(i) * fc_a  // Combined alpha
      fill_color[offset] = ((fc >> 24) & 0xff) / 255     // R
      fill_color[offset + 1] = ((fc >> 16) & 0xff) / 255 // G
      fill_color[offset + 2] = ((fc >> 8) & 0xff) / 255  // B
      fill_color[offset + 3] = fill_alpha
    }
  }

  // Update show flags based on indices (for selection support)
  // When indices.length < nmarkers, only show markers at specified indices
  private _update_show_flags(indices: number[], nmarkers: number): void {
    if (this._line_props_data == null) {
      return
    }

    const line_props = this._line_props_data

    if (indices.length < nmarkers) {
      // Selection case: only show markers at specified indices
      // First, hide all markers
      for (let i = 0; i < nmarkers; i++) {
        line_props[i * 4 + 3] = 0.0
      }
      // Then show only the specified indices
      for (const idx of indices) {
        line_props[idx * 4 + 3] = 1.0
      }
    } else {
      // Show all markers
      for (let i = 0; i < nmarkers; i++) {
        line_props[i * 4 + 3] = 1.0
      }
    }
  }

  destroy(): void {
    this._position_buffer?.destroy()
    this._size_buffer?.destroy()
    this._geometry_buffer?.destroy()
    this._line_props_buffer?.destroy()
    this._line_color_buffer?.destroy()
    this._fill_color_buffer?.destroy()
    this._uniform_buffer?.destroy()
  }
}
