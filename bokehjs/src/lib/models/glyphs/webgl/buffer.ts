import {ReglWrapper} from "./regl_wrap"
import {cap_lookup, hatch_pattern_to_index, join_lookup} from "./webgl_utils"
import {LineCap, LineJoin} from "core/enums"
import {HatchPattern} from "core/property_mixins"
import {uint32} from "core/types"
import {Uniform} from "core/uniforms"
import {color2rgba} from "core/util/color"
import {AttributeConfig, Buffer} from "regl"

type WrappedArrayType = Float32Array | Uint8Array

// Arrays are sent to GPU using ReGL Buffer objects.  CPU-side arrays used to
// update the Buffers are also kept for reuse to avoid unnecessary reallocation.
abstract class WrappedBuffer<ArrayType extends WrappedArrayType> {
  protected regl_wrapper: ReglWrapper
  protected buffer?: Buffer
  protected array?: ArrayType
  protected is_scalar: boolean

  constructor(regl_wrapper: ReglWrapper) {
    this.regl_wrapper = regl_wrapper
    this.is_scalar = true
  }

  // Return array of correct size, creating it if necessary.
  // Must call update() when finished setting the array values.
  get_sized_array(length: number): ArrayType {
    if (this.array == null || this.array.length != length)
      this.array = this.new_array(length)

    return this.array
  }

  protected is_normalized(): boolean {
    return false
  }

  get length(): number {
    return this.array != null ? this.array.length : 0
  }

  protected abstract new_array(len: number): ArrayType

  set_from_array(numbers: number[] | Float32Array): void {
    const len = numbers.length
    const array = this.get_sized_array(len)

    for (let i = 0; i < len; i++)
      array[i] = numbers[i]

    this.update()
  }

  // length_if_scalar is the number of vertices in the WebGL primitive used to
  // render the glyph; usually this is a rectangle with 4 vertices.
  set_from_prop(prop: Uniform<number>, length_if_scalar = 4): void {
    const len = prop.is_Scalar() ? length_if_scalar : prop.length
    const array = this.get_sized_array(len)

    for (let i = 0; i < len; i++)
      array[i] = prop.get(i)

    this.update(prop.is_Scalar())
  }

  // length_if_scalar is the number of vertices in the WebGL primitive used to
  // render the glyph; usually this is a rectangle with 4 vertices.
  set_from_scalar(scalar: number, length_if_scalar: number = 4): void {
    this.get_sized_array(length_if_scalar).fill(scalar)
    this.update(true)
  }

  // Return a ReGL AttributeConfig that corresponds to one value for each glyph
  // or the same value for all glyphs.  Instanced rendering supports the former
  // using 'divisor = 1', but does not support the latter directly.  We have to
  // either repeat the attribute once for each glyph, which is wasteful for a
  // large number of glyphs, or the solution used here which is to use
  // 'divisor = 0' and repeat the value once for each of the instanced vertices
  // which is usually 4.  See also set_from_prop() above.
  to_attribute_config(offset: number = 0): AttributeConfig {
    return {
      buffer: this.buffer,
      divisor: this.is_scalar ? 0 : 1,
      normalized: this.is_normalized(),
      offset,
    }
  }

  // Update ReGL buffer with data contained in array in preparation for passing
  // it to the GPU.  This function must be called after get_sized_array().
  update(is_scalar: boolean = false): void {
    // Update buffer with data contained in array.
    if (this.buffer == null) {
      // Create new buffer.
      this.buffer = this.regl_wrapper.buffer({
        usage: "dynamic",
        data: this.array,
      })
    } else {
      // Reuse existing buffer.
      this.buffer({data: this.array})
    }

    this.is_scalar = is_scalar
  }
}

export class Float32Buffer extends WrappedBuffer<Float32Array> {
  protected new_array(len: number): Float32Array {
    return new Float32Array(len)
  }
}

export class Uint8Buffer extends WrappedBuffer<Uint8Array> {
  protected new_array(len: number): Uint8Array {
    return new Uint8Array(len)
  }

  set_from_color(color_prop: Uniform<uint32>, alpha_prop: Uniform<number>, length_if_scalar = 4): void {
    const is_scalar = color_prop.is_Scalar() && alpha_prop.is_Scalar()
    const ncolors = is_scalar ? length_if_scalar : color_prop.length
    const array = this.get_sized_array(4*ncolors)

    for (let i = 0; i < ncolors; i++) {
      const [r, g, b, a] = color2rgba(color_prop.get(i), alpha_prop.get(i))
      array[4*i  ] = r
      array[4*i+1] = g
      array[4*i+2] = b
      array[4*i+3] = a
    }

    this.update(is_scalar)
  }

  set_from_hatch_pattern(hatch_pattern_prop: Uniform<HatchPattern>, length_if_scalar = 4): void {
    const len = hatch_pattern_prop.is_Scalar() ? length_if_scalar : hatch_pattern_prop.length
    const array = this.get_sized_array(len)

    for (let i = 0; i < len; i++)
      array[i] = hatch_pattern_to_index(hatch_pattern_prop.get(i))

    this.update(hatch_pattern_prop.is_Scalar())
  }

  set_from_line_cap(line_cap_prop: Uniform<LineCap>, length_if_scalar = 4): void {
    const len = line_cap_prop.is_Scalar() ? length_if_scalar : line_cap_prop.length
    const array = this.get_sized_array(len)

    for (let i = 0; i < len; i++)
      array[i] = cap_lookup[line_cap_prop.get(i)]

    this.update(line_cap_prop.is_Scalar())
  }

  set_from_line_join(line_join_prop: Uniform<LineJoin>, length_if_scalar = 4): void {
    const len = line_join_prop.is_Scalar() ? length_if_scalar : line_join_prop.length
    const array = this.get_sized_array(len)

    for (let i = 0; i < len; i++)
      array[i] = join_lookup[line_join_prop.get(i)]

    this.update(line_join_prop.is_Scalar())
  }
}

// Normalized refers to optional WebGL behaviour of automatically converting
// Uint8 values that are passed to shaders into floats in the range 0 to 1.
export class NormalizedUint8Buffer extends Uint8Buffer {
  protected override is_normalized(): boolean {
    return true
  }
}
