import {TypedArray} from "core/util/ndarray"
import {unreachable} from "core/util/assert"

export class Texture2d {
  handle: WebGLTexture
  _shape_format?: {width: number, height: number, format: number}

  _target = 3553
  _types: {[key: string]: number} = {
    Int8Array: 5120,
    Uint8Array: 5121,
    Int16Array: 5122,
    Uint16Array: 5123,
    Int32Array: 5124,
    Uint32Array: 5125,
    Float32Array: 5126,
  }

  constructor(readonly gl: WebGLRenderingContext) {
    this.handle = this.gl.createTexture()!
  }

  delete(): void {
    this.gl.deleteTexture(this.handle)
  }

  activate(): void {
    this.gl.bindTexture(this._target, this.handle)
  }

  deactivate(): void {
    this.gl.bindTexture(this._target, 0)
  }

  _get_alignment(width: number): number {
    // Determines a textures byte alignment. If the width isn't a
    // power of 2 we need to adjust the byte alignment of the image.
    // The image height is unimportant.
    //
    // www.opengl.org/wiki/Common_Mistakes#Texture_upload_and_pixel_reads
    const alignments = [4, 8, 2, 1]
    for (const alignment of alignments) {
      if (width % alignment == 0) {
        return alignment
      }
    }
    unreachable()
  }

  set_wrapping(wrap_s: number, wrap_t: number): void {
    // Set the texture wrapping mode.
    //
    // Parameters
    // ----------
    // wrap_s : GL enum
    //     The mode to wrap the x dimension. Valid values are REPEAT
    //     CLAMP_TO_EDGE MIRRORED_REPEAT
    // wrap_t : GL enum
    //     The mode to wrap the y dimension. Same options as for wrap_s.
    this.activate()
    this.gl.texParameterf(this._target, this.gl.TEXTURE_WRAP_S, wrap_s)
    this.gl.texParameterf(this._target, this.gl.TEXTURE_WRAP_T, wrap_t)
  }

  set_interpolation(min: number, mag: number): void {
    // Set the texture interpolation mode
    //
    // Parameters
    // ----------
    // min : GL enum
    //     The interpolation mode when minifying (i.e. zoomed out). Valid
    //     values are LINEAR and NEAREST.
    // max : GL enum
    //     The interpolation mode when magnifying (i.e. zoomed in). Valid
    //     values are LINEAR, NEAREST, NEAREST_MIPMAP_NEAREST,
    //     LINEAR_MIPMAP_NEAREST, NEAREST_MIPMAP_LINEAR, LINEAR_MIPMAP_LINEAR.
    this.activate()
    this.gl.texParameterf(this._target, this.gl.TEXTURE_MIN_FILTER, min)
    this.gl.texParameterf(this._target, this.gl.TEXTURE_MAG_FILTER, mag)
  }

  set_size([width, height]: [number, number], format: number): void {
    // Set the size of the 2D texture.
    //
    // Parameters
    // ----------
    // shape : tuple of ints
    //     The shape of the data to upload
    // format : GL enum
    //     The format of the texture data. Can be LUMINANCE, LUMINANCE_ALPHA,
    //     RGB, and RGBA.
    if (width != this._shape_format?.width || height != this._shape_format?.height || format != this._shape_format?.format) {
      this._shape_format = {width, height, format}
      this.activate()
      this.gl.texImage2D(this._target, 0, format, width, height, 0, format, this.gl.UNSIGNED_BYTE, null)
    }
  }

  set_data(offset: [number, number], [width, height]: [number, number], data: TypedArray): void {
    // Set the 2D texture data.
    //
    // Parameters
    // ----------
    // offset : tuple of ints
    //     Offset in pixels for each dimension.
    // shape : tuple of ints
    //     The shape of the data to upload
    // data : typed array
    //     The actual pixel data. Can be of any type, but on the GPU the
    //     dat is stored in 8 bit precision.
    this.activate()
    const {format} = this._shape_format!
    const [x, y] = offset
    const gtype = this._types[data.constructor.name]
    if (gtype == null) {
      throw new Error(`Type ${data.constructor.name} not allowed for texture`)
    }
    const alignment = this._get_alignment(width)
    if (alignment != 4) {
      this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, alignment)
    }
    this.gl.texSubImage2D(this._target, 0, x, y, width, height, format, gtype, data)
    if (alignment != 4) {
      this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4)
    }
  }
}
