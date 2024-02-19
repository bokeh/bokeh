import type {ReglWrapper} from "./regl_wrap"
import {cap_lookup, hatch_pattern_to_index, join_lookup} from "./webgl_utils"
import type {LineCap, LineJoin} from "core/enums"
import type {HatchPattern} from "core/property_mixins"
import type {uint32, Arrayable} from "core/types"
import type {Uniform} from "core/uniforms"
import {assert} from "core/util/assert"
import {color2rgba} from "core/util/color"
import type {AttributeConfig, Buffer} from "regl"

type WrappedArrayType = Float32Array | Uint8Array

// Arrays are sent to GPU using ReGL Buffer objects.  CPU-side arrays used to
// update the Buffers are also kept for reuse to avoid unnecessary reallocation.
abstract class WrappedBuffer<ArrayType extends WrappedArrayType> {
  protected regl_wrapper: ReglWrapper
  protected buffer?: Buffer
  protected array?: ArrayType
  protected is_scalar: boolean

  // Number of buffer elements per rendered primitive, e.g. for RGBA buffers this is 4
  // as a single color is 4 x uint8 = 32-bit in total.
  protected elements_per_primitive: number

  constructor(regl_wrapper: ReglWrapper, elements_per_primitive: number = 1) {
    this.regl_wrapper = regl_wrapper
    this.is_scalar = true
    this.elements_per_primitive = elements_per_primitive
  }

  protected abstract bytes_per_element(): number

  // Return array if already know it exists and is the correct length.
  get_array(): ArrayType {
    assert(this.array != null, "WrappedBuffer not yet initialised")
    return this.array
  }

  // Return array of correct size, creating it if necessary.
  // Must call update() when finished setting the array values.
  get_sized_array(length: number): ArrayType {
    if (this.array == null || this.array.length != length) {
      this.array = this.new_array(length)
    }

    return this.array
  }

  protected is_normalized(): boolean {
    return false
  }

  get length(): number {
    return this.array != null ? this.array.length : 0
  }

  protected abstract new_array(len: number): ArrayType

  set_from_array(numbers: Arrayable<number>): void {
    const len = numbers.length
    const array = this.get_sized_array(len)

    for (let i = 0; i < len; i++) {
      array[i] = numbers[i]
    }

    this.update()
  }

  set_from_prop(prop: Uniform<number>): void {
    const len = prop.is_Scalar() ? 1 : prop.length
    const array = this.get_sized_array(len)

    for (let i = 0; i < len; i++) {
      array[i] = prop.get(i)
    }

    this.update(prop.is_Scalar())
  }

  set_from_scalar(scalar: number): void {
    this.get_sized_array(1).fill(scalar)
    this.update(true)
  }

  // Return a ReGL AttributeConfig that corresponds to one value for each glyph
  // or the same value for a number of glyphs.  A buffer passed to ReGL for
  // instanced rendering can be used for multiple rendering calls and the
  // important attributes for this are the offset (in bytes) into the buffer
  // and the divisor, which is the number of instances rendered before the
  // offset is advanced to the next buffer element.

  // to_attribute_config() is used for the common case of a single render call
  // per buffer with visual properties that are either scalar or vector.
  // Visual properties of scatter markers are an good example, and scalar_divisor
  // would be the number of markers rendered.
  to_attribute_config(offset: number = 0, scalar_divisor: number = 1): AttributeConfig {
    return {
      buffer: this.buffer,
      divisor: this.is_scalar ? scalar_divisor : 1,
      normalized: this.is_normalized(),
      offset: offset*this.bytes_per_element(),
    }
  }

  // to_attribute_config_nested() is used for the more complicated case in
  // which the vectorisation is nested, such as rendering multi_lines where
  // each visual property has a single buffer that is used multiple times, once
  // for each of the constituent lines.  Vector properties are therefore
  // constant for each constituent line (composed of multiple rendered
  // instances) but change between lines.
  to_attribute_config_nested(offset_vector: number = 0, divisor: number = 1): AttributeConfig {
    return {
      buffer: this.buffer,
      divisor: divisor*this.elements_per_primitive,
      normalized: this.is_normalized(),
      offset: this.is_scalar ? 0 : offset_vector*this.bytes_per_element()*this.elements_per_primitive,
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
  protected bytes_per_element(): number {
    return Float32Array.BYTES_PER_ELEMENT
  }

  protected new_array(len: number): Float32Array {
    return new Float32Array(len)
  }
}

export class Uint8Buffer extends WrappedBuffer<Uint8Array> {
  protected bytes_per_element(): number {
    return Uint8Array.BYTES_PER_ELEMENT
  }

  protected new_array(len: number): Uint8Array {
    return new Uint8Array(len)
  }

  set_from_color(color_prop: Uniform<uint32>, alpha_prop: Uniform<number>): void {
    const is_scalar = color_prop.is_Scalar() && alpha_prop.is_Scalar()
    const ncolors = is_scalar ? 1 : color_prop.length
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

  set_from_hatch_pattern(hatch_pattern_prop: Uniform<HatchPattern>): void {
    const len = hatch_pattern_prop.is_Scalar() ? 1 : hatch_pattern_prop.length
    const array = this.get_sized_array(len)

    for (let i = 0; i < len; i++) {
      array[i] = hatch_pattern_to_index(hatch_pattern_prop.get(i))
    }

    this.update(hatch_pattern_prop.is_Scalar())
  }

  set_from_line_cap(line_cap_prop: Uniform<LineCap>): void {
    const len = line_cap_prop.is_Scalar() ? 1 : line_cap_prop.length
    const array = this.get_sized_array(len)

    for (let i = 0; i < len; i++) {
      array[i] = cap_lookup[line_cap_prop.get(i)]
    }

    this.update(line_cap_prop.is_Scalar())
  }

  set_from_line_join(line_join_prop: Uniform<LineJoin>): void {
    const len = line_join_prop.is_Scalar() ? 1 : line_join_prop.length
    const array = this.get_sized_array(len)

    for (let i = 0; i < len; i++) {
      array[i] = join_lookup[line_join_prop.get(i)]
    }

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
