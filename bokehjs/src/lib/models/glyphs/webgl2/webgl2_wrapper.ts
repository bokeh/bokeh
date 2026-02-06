import type {BoundingBox, GL2MarkerType} from "./types"
import marker_vert from "./marker.vert"
import marker_frag from "./marker.frag"

// Singleton WebGL2 wrapper instance
let webgl2_wrapper: WebGL2Wrapper | null = null

export function get_webgl2(gl: WebGL2RenderingContext): WebGL2Wrapper {
  if (webgl2_wrapper == null) {
    webgl2_wrapper = new WebGL2Wrapper(gl)
  }
  return webgl2_wrapper
}

// UBO binding point for the transform block
const TRANSFORM_UBO_BINDING = 0

export class WebGL2Wrapper {
  private _gl: WebGL2RenderingContext
  private _webgl2_available: boolean = true

  // Cached shader programs
  private _program_cache: Map<string, WebGLProgram> = new Map()

  // Static geometry buffers
  private _rect_geometry: WebGLBuffer | null = null
  private _rect_vao_cache: Map<string, WebGLVertexArrayObject> = new Map()

  // WebGL2 state
  private _scissor: BoundingBox = {x: 0, y: 0, width: 0, height: 0}
  private _needs_clear: boolean = true
  private _has_valid_content: boolean = false

  constructor(gl: WebGL2RenderingContext) {
    this._gl = gl
    this._init_static_buffers()
  }

  private _init_static_buffers(): void {
    const gl = this._gl
    // Rectangle geometry for instanced rendering (4 vertices for a quad)
    const rect_data = new Float32Array([
      -0.5, -0.5,  // bottom-left  (vertex 0)
      0.5, -0.5,   // bottom-right (vertex 1)
      -0.5, 0.5,   // top-left     (vertex 2)
      0.5, 0.5,    // top-right    (vertex 3)
    ])

    this._rect_geometry = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this._rect_geometry)
    gl.bufferData(gl.ARRAY_BUFFER, rect_data, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }

  get gl(): WebGL2RenderingContext {
    return this._gl
  }

  get has_webgl2(): boolean {
    return this._webgl2_available
  }

  get scissor(): BoundingBox {
    return this._scissor
  }

  set_scissor(x: number, y: number, width: number, height: number): void {
    this._scissor = {x, y, width, height}
  }

  clear(): void {
    this._needs_clear = true
  }

  get needs_clear(): boolean {
    return this._needs_clear
  }

  consume_clear(): void {
    this._needs_clear = false
  }

  mark_rendered(): void {
    this._has_valid_content = true
  }

  get should_blit(): boolean {
    return this._has_valid_content
  }

  get rect_geometry(): WebGLBuffer {
    return this._rect_geometry!
  }

  // Compile a shader with error reporting
  private _compile_shader(type: number, source: string): WebGLShader | null {
    const gl = this._gl
    const shader = gl.createShader(type)
    if (shader == null) {
      return null
    }
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader)
      console.error(`Shader compilation error: ${info}`)
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  // Get or create a cached program for a specific marker type
  get_marker_program(marker_type: GL2MarkerType): WebGLProgram | null {
    const key = marker_type
    let program = this._program_cache.get(key)

    if (program != null) {
      return program
    }

    const gl = this._gl

    // Build preprocessor defines based on marker type
    const defines: string[] = []
    switch (marker_type) {
      case "circle":
        defines.push("#define MARKER_CIRCLE")
        break
      case "rect":
        defines.push("#define MARKER_RECT")
        break
      case "round_rect":
        defines.push("#define MARKER_ROUND_RECT")
        break
      default:
        defines.push("#define MARKER_CIRCLE")
        break
    }
    const define_block = defines.join("\n")

    // Inject defines after #version directive
    const inject_defines = (source: string): string => {
      const trimmed = source.trimStart()
      const version_line_end = trimmed.indexOf("\n") + 1
      return `${trimmed.slice(0, version_line_end)}${define_block}\n${trimmed.slice(version_line_end)}`
    }

    const vert_shader = this._compile_shader(gl.VERTEX_SHADER, inject_defines(marker_vert))
    const frag_shader = this._compile_shader(gl.FRAGMENT_SHADER, inject_defines(marker_frag))

    if (vert_shader == null || frag_shader == null) {
      return null
    }

    program = gl.createProgram()!
    gl.attachShader(program, vert_shader)
    gl.attachShader(program, frag_shader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program)
      console.error(`Program link error: ${info}`)
      gl.deleteProgram(program)
      gl.deleteShader(vert_shader)
      gl.deleteShader(frag_shader)
      return null
    }

    // Bind the UBO to the known binding point
    const ubo_index = gl.getUniformBlockIndex(program, "TransformBlock")
    gl.uniformBlockBinding(program, ubo_index, TRANSFORM_UBO_BINDING)

    // Clean up shaders (they're linked into the program now)
    gl.deleteShader(vert_shader)
    gl.deleteShader(frag_shader)

    this._program_cache.set(key, program)
    return program
  }

  // Create a UBO buffer
  create_uniform_buffer(data: ArrayBuffer): WebGLBuffer {
    const gl = this._gl
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer)
    gl.bufferData(gl.UNIFORM_BUFFER, data, gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.UNIFORM_BUFFER, null)
    return buffer
  }

  // Update an existing UBO buffer
  update_uniform_buffer(buffer: WebGLBuffer, data: ArrayBuffer): void {
    const gl = this._gl
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer)
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data)
    gl.bindBuffer(gl.UNIFORM_BUFFER, null)
  }

  // Bind UBO to the transform binding point
  bind_uniform_buffer(buffer: WebGLBuffer): void {
    this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER, TRANSFORM_UBO_BINDING, buffer)
  }

  // Get or create a VAO for a marker type
  // We cache VAOs per marker type since attribute layout is the same
  get_or_create_vao(key: string): WebGLVertexArrayObject {
    let vao = this._rect_vao_cache.get(key)
    if (vao == null) {
      vao = this._gl.createVertexArray()!
      this._rect_vao_cache.set(key, vao)
    }
    return vao
  }
}
