import type {GPUResource} from "./resource_owner"

/** Minimal WebGL2 uniform-buffer resource used by higher-level shader modules. */
export class UniformBuffer implements GPUResource {
  private _buffer: WebGLBuffer | null

  constructor(
    private readonly gl: WebGL2RenderingContext,
    readonly byte_length: number,
    readonly binding: number,
  ) {
    const buffer = gl.createBuffer()
    this._buffer = buffer
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer)
    gl.bufferData(gl.UNIFORM_BUFFER, byte_length, gl.DYNAMIC_DRAW)
    gl.bindBufferBase(gl.UNIFORM_BUFFER, binding, buffer)
    gl.bindBuffer(gl.UNIFORM_BUFFER, null)
  }

  update(data: Float32Array, byte_offset: number = 0): void {
    const {_buffer} = this
    if (_buffer == null) {
      throw new Error("uniform buffer was destroyed")
    }
    if (byte_offset < 0 || byte_offset + data.byteLength > this.byte_length) {
      throw new Error("uniform buffer update exceeds its allocation")
    }
    const {gl} = this
    gl.bindBuffer(gl.UNIFORM_BUFFER, _buffer)
    gl.bufferSubData(gl.UNIFORM_BUFFER, byte_offset, data)
    gl.bindBuffer(gl.UNIFORM_BUFFER, null)
  }

  destroy(): void {
    if (this._buffer != null) {
      this.gl.deleteBuffer(this._buffer)
      this._buffer = null
    }
  }
}
