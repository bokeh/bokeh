import type {BoundingBox, GPUMarkerType} from "./types"
import marker_shader from "./marker.wgsl"

// Singleton WebGPU wrapper instance
let webgpu_wrapper: WebGPUWrapper | null = null

export function get_webgpu(device: GPUDevice, context: GPUCanvasContext, format: GPUTextureFormat): WebGPUWrapper {
  if (webgpu_wrapper == null) {
    webgpu_wrapper = new WebGPUWrapper(device, context, format)
  }
  return webgpu_wrapper
}

export class WebGPUWrapper {
  private _device: GPUDevice
  private _context: GPUCanvasContext
  private _format: GPUTextureFormat
  private _webgpu_available: boolean = true

  // Cached shader modules
  private _marker_shader_module: GPUShaderModule | null = null

  // Cached render pipelines
  private _marker_pipeline_cache: Map<string, GPURenderPipeline> = new Map()

  // Static geometry buffers
  private _rect_geometry: GPUBuffer | null = null

  // Bind group layouts
  private _marker_bind_group_layout: GPUBindGroupLayout | null = null

  // WebGPU state
  private _scissor: BoundingBox = {x: 0, y: 0, width: 0, height: 0}

  constructor(device: GPUDevice, context: GPUCanvasContext, format: GPUTextureFormat) {
    this._device = device
    this._context = context
    this._format = format

    this._init_static_buffers()
  }

  private _init_static_buffers(): void {
    // Rectangle geometry for instanced rendering (4 vertices for a quad)
    // Each vertex has position (x, y) in range [-0.5, 0.5]
    // Order is important for triangle-strip: forms two triangles covering the quad
    const rect_data = new Float32Array([
      -0.5, -0.5,  // bottom-left  (vertex 0)
      0.5, -0.5,   // bottom-right (vertex 1)
      -0.5, 0.5,   // top-left     (vertex 2)
      0.5, 0.5,    // top-right    (vertex 3)
    ])

    this._rect_geometry = this._device.createBuffer({
      size: rect_data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    })
    new Float32Array(this._rect_geometry.getMappedRange()).set(rect_data)
    this._rect_geometry.unmap()
  }

  get device(): GPUDevice {
    return this._device
  }

  get context(): GPUCanvasContext {
    return this._context
  }

  get format(): GPUTextureFormat {
    return this._format
  }

  get has_webgpu(): boolean {
    return this._webgpu_available
  }

  get scissor(): BoundingBox {
    return this._scissor
  }

  set_scissor(x: number, y: number, width: number, height: number): void {
    this._scissor = {x, y, width, height}
  }

  private _needs_clear: boolean = true
  private _has_valid_content: boolean = false

  clear(): void {
    this._needs_clear = true
  }

  // Returns the loadOp to use for the next render pass
  get_load_op(): "clear" | "load" {
    if (this._needs_clear) {
      this._needs_clear = false
      return "clear"
    }
    return "load"
  }

  // Mark that we've rendered something this frame
  mark_rendered(): void {
    this._has_valid_content = true
  }

  // Check if we should blit - either rendered this frame or have valid previous content
  get should_blit(): boolean {
    return this._has_valid_content
  }

  get rect_geometry(): GPUBuffer {
    return this._rect_geometry!
  }

  // Get or create the marker shader module
  get_marker_shader_module(): GPUShaderModule {
    if (this._marker_shader_module == null) {
      this._marker_shader_module = this._device.createShaderModule({
        label: "Marker Shader",
        code: marker_shader,
      })
    }
    return this._marker_shader_module
  }

  // Get the bind group layout for marker rendering
  get_marker_bind_group_layout(): GPUBindGroupLayout {
    if (this._marker_bind_group_layout == null) {
      this._marker_bind_group_layout = this._device.createBindGroupLayout({
        label: "Marker Bind Group Layout",
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {type: "uniform"},
          },
        ],
      })
    }
    return this._marker_bind_group_layout
  }

  // Get or create render pipeline for a specific marker type
  get_marker_pipeline(marker_type: GPUMarkerType, hatch: boolean = false): GPURenderPipeline {
    const key = `${marker_type}_${hatch ? "hatch" : "no_hatch"}`
    let pipeline = this._marker_pipeline_cache.get(key)

    if (pipeline == null) {
      const shader_module = this.get_marker_shader_module()
      const bind_group_layout = this.get_marker_bind_group_layout()

      // Constants for shader specialization
      const constants: Record<string, number> = {
        MARKER_CIRCLE: marker_type === "circle" ? 1 : 0,
        MARKER_RECT: marker_type === "rect" ? 1 : 0,
        MARKER_ROUND_RECT: marker_type === "round_rect" ? 1 : 0,
      }

      pipeline = this._device.createRenderPipeline({
        label: `Marker Pipeline (${key})`,
        layout: this._device.createPipelineLayout({
          bindGroupLayouts: [bind_group_layout],
        }),
        vertex: {
          module: shader_module,
          entryPoint: "vertex_main",
          constants,
          buffers: [
            // Buffer 0: Vertex buffer (quad geometry) - per-vertex
            {
              arrayStride: 2 * 4, // 2 floats * 4 bytes
              stepMode: "vertex",
              attributes: [
                {shaderLocation: 0, offset: 0, format: "float32x2"}, // position
              ],
            },
            // Buffer 1: Position (center) - per-instance, changes on pan/zoom
            {
              arrayStride: 2 * 4, // 2 floats (cx, cy)
              stepMode: "instance",
              attributes: [
                {shaderLocation: 1, offset: 0, format: "float32x2"}, // center
              ],
            },
            // Buffer 2: Size - per-instance, changes on data change
            {
              arrayStride: 2 * 4, // 2 floats (width, height)
              stepMode: "instance",
              attributes: [
                {shaderLocation: 2, offset: 0, format: "float32x2"}, // size
              ],
            },
            // Buffer 3: Geometry - per-instance, changes on data change
            {
              arrayStride: 2 * 4, // 2 floats (angle, aux)
              stepMode: "instance",
              attributes: [
                {shaderLocation: 3, offset: 0, format: "float32x2"}, // angle_aux
              ],
            },
            // Buffer 4: Line properties - per-instance, changes on visual/selection
            {
              arrayStride: 4 * 4, // 4 floats (linewidth, cap, join, show)
              stepMode: "instance",
              attributes: [
                {shaderLocation: 4, offset: 0, format: "float32x4"}, // line_props
              ],
            },
            // Buffer 5: Line color - per-instance, changes on visual change
            {
              arrayStride: 4 * 4, // 4 floats (r, g, b, a)
              stepMode: "instance",
              attributes: [
                {shaderLocation: 5, offset: 0, format: "float32x4"}, // line_color
              ],
            },
            // Buffer 6: Fill color - per-instance, changes on visual change
            {
              arrayStride: 4 * 4, // 4 floats (r, g, b, a)
              stepMode: "instance",
              attributes: [
                {shaderLocation: 6, offset: 0, format: "float32x4"}, // fill_color
              ],
            },
          ],
        },
        fragment: {
          module: shader_module,
          entryPoint: "fragment_main",
          constants,
          targets: [
            {
              format: this._format,
              blend: {
                color: {
                  srcFactor: "one",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add",
                },
                alpha: {
                  srcFactor: "one",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add",
                },
              },
            },
          ],
        },
        primitive: {
          topology: "triangle-strip",
          stripIndexFormat: "uint32",
        },
      })

      this._marker_pipeline_cache.set(key, pipeline)
    }

    return pipeline
  }

  // Create a uniform buffer with the given data
  create_uniform_buffer(data: ArrayBuffer): GPUBuffer {
    const buffer = this._device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this._device.queue.writeBuffer(buffer, 0, data)
    return buffer
  }

  // Create a bind group for marker rendering
  create_marker_bind_group(uniform_buffer: GPUBuffer): GPUBindGroup {
    return this._device.createBindGroup({
      layout: this.get_marker_bind_group_layout(),
      entries: [
        {binding: 0, resource: {buffer: uniform_buffer}},
      ],
    })
  }
}
