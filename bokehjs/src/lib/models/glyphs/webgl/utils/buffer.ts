import {TypedArray} from "core/util/ndarray"

export abstract class Buffer {
  protected _target: number
  protected _usage = 35048

  readonly handle: WebGLBuffer
  buffer_size = 0

  constructor(readonly gl: WebGLRenderingContext) {
    this.handle = this.gl.createBuffer()!
  }

  delete(): void {
    this.gl.deleteBuffer(this.handle)
  }

  activate(): void {
    this.gl.bindBuffer(this._target, this.handle)
  }

  deactivate(): void {
    this.gl.bindBuffer(this._target, null)
  }

  set_size(nbytes: number): void {
    // Set the size of the buffer in bytes.
    //
    // Parameters
    // ----------
    // nbytes : int
    //     The number of bytes that the buffer needs to hold.
    if (nbytes != this.buffer_size) {
      this.activate()
      this.gl.bufferData(this._target, nbytes, this._usage)
      this.buffer_size = nbytes
    }
  }

  set_data(offset: number, data: TypedArray): void {
    // Set the buffer data.
    //
    // Parameters
    // ----------
    // offset : int
    //     The offset in bytes for the new data.
    // data : typed array
    //     The data to upload.
    this.activate()
    this.gl.bufferSubData(this._target, offset, data)
  }
}

export class VertexBuffer extends Buffer {
  _target = 34962
}

export class IndexBuffer extends Buffer {
  _target = 34963
}
