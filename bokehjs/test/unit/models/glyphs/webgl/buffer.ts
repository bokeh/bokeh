import {expect} from "#framework/assertions"

import {expand_to_per_vertex, Float32Buffer, NormalizedUint8Buffer, Uint8Buffer} from "@bokehjs/models/glyphs/webgl/buffer"
import type {ReglWrapper} from "@bokehjs/models/glyphs/webgl/regl_wrap"
import {UniformScalar, UniformVector} from "@bokehjs/core/uniforms"
import {encode_rgba} from "@bokehjs/core/util/color"
import type {Buffer} from "regl"

// Lightweight mock objects that satisfy expand_to_per_vertex's duck-typed interfaces.
function mock_src(data: number[], is_scalar: boolean) {
  return {
    get_array(): ArrayLike<number> { return data },
    is_scalar_value: is_scalar,
  }
}

function mock_dst() {
  let stored: number[] = []
  let updated = false
  return {
    get_sized_array(n: number) {
      stored = new Array<number>(n).fill(0)
      updated = false
      return stored
    },
    update() { updated = true },
    get result() { return stored },
    get was_updated() { return updated },
  }
}

describe("expand_to_per_vertex", () => {

  it("should expand scalar RGBA to all vertices of a single polygon", () => {
    const src = mock_src([255, 0, 0, 128], true)
    const dst = mock_dst()
    expand_to_per_vertex(src, dst, [3], 4)

    // 3 vertices * 4 components = 12 values
    expect(dst.result.length).to.be.equal(12)
    // Each vertex gets the same color
    expect(dst.result).to.be.equal([
      255, 0, 0, 128,
      255, 0, 0, 128,
      255, 0, 0, 128,
    ])
    expect(dst.was_updated).to.be.true
  })

  it("should expand scalar RGBA across multiple polygons", () => {
    const src = mock_src([0, 255, 0, 255], true)
    const dst = mock_dst()
    // Two polygons: 2 vertices and 4 vertices
    expand_to_per_vertex(src, dst, [2, 4], 4)

    // (2 + 4) * 4 = 24 values, all identical
    expect(dst.result.length).to.be.equal(24)
    for (let i = 0; i < 6; i++) {
      expect(dst.result[i * 4 + 0]).to.be.equal(0)
      expect(dst.result[i * 4 + 1]).to.be.equal(255)
      expect(dst.result[i * 4 + 2]).to.be.equal(0)
      expect(dst.result[i * 4 + 3]).to.be.equal(255)
    }
  })

  it("should expand per-item RGBA to per-vertex for multiple polygons", () => {
    // Two polygons with different colors
    const src = mock_src([
      255, 0, 0, 255,   // polygon 0: red
      0, 0, 255, 255,   // polygon 1: blue
    ], false)
    const dst = mock_dst()
    // polygon 0 has 3 vertices, polygon 1 has 2 vertices
    expand_to_per_vertex(src, dst, [3, 2], 4)

    // (3 + 2) * 4 = 20 values
    expect(dst.result.length).to.be.equal(20)
    // Polygon 0 vertices: all red
    expect(dst.result.slice(0, 12)).to.be.equal([
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
    ])
    // Polygon 1 vertices: all blue
    expect(dst.result.slice(12, 20)).to.be.equal([
      0, 0, 255, 255,
      0, 0, 255, 255,
    ])
  })

  it("should handle single-component properties", () => {
    // Per-item hatch pattern indices: polygon 0 = 3, polygon 1 = 7
    const src = mock_src([3, 7], false)
    const dst = mock_dst()
    expand_to_per_vertex(src, dst, [4, 2], 1)

    // (4 + 2) * 1 = 6 values
    expect(dst.result.length).to.be.equal(6)
    expect(dst.result).to.be.equal([3, 3, 3, 3, 7, 7])
  })

  it("should handle scalar single-component property", () => {
    const src = mock_src([5], true)
    const dst = mock_dst()
    expand_to_per_vertex(src, dst, [3, 2], 1)

    expect(dst.result.length).to.be.equal(5)
    expect(dst.result).to.be.equal([5, 5, 5, 5, 5])
  })

  it("should handle a polygon with zero vertices", () => {
    const src = mock_src([10, 20, 30, 40], true)
    const dst = mock_dst()
    // Three polygons, middle one has 0 vertices (degenerate)
    expand_to_per_vertex(src, dst, [2, 0, 1], 4)

    // (2 + 0 + 1) * 4 = 12 values
    expect(dst.result.length).to.be.equal(12)
    expect(dst.result).to.be.equal([
      10, 20, 30, 40,
      10, 20, 30, 40,
      10, 20, 30, 40,
    ])
  })

  it("should produce empty output for empty vertex_counts", () => {
    const src = mock_src([1, 2, 3, 4], true)
    const dst = mock_dst()
    expand_to_per_vertex(src, dst, [], 4)

    expect(dst.result.length).to.be.equal(0)
    expect(dst.was_updated).to.be.true
  })

  it("should expand per-item with three polygons and 4 components", () => {
    const src = mock_src([
      1, 2, 3, 4,     // polygon 0
      5, 6, 7, 8,     // polygon 1
      9, 10, 11, 12,  // polygon 2
    ], false)
    const dst = mock_dst()
    expand_to_per_vertex(src, dst, [1, 2, 1], 4)

    // (1 + 2 + 1) * 4 = 16 values
    expect(dst.result.length).to.be.equal(16)
    expect(dst.result).to.be.equal([
      1, 2, 3, 4,      // polygon 0, vertex 0
      5, 6, 7, 8,      // polygon 1, vertex 0
      5, 6, 7, 8,      // polygon 1, vertex 1
      9, 10, 11, 12,   // polygon 2, vertex 0
    ])
  })
})

describe("WrappedBuffer", () => {
  it("should preserve positive alpha at normalized RGBA8 precision", () => {
    const gpu_buffer = Object.assign((_options: unknown) => {}, {destroy() {}}) as unknown as Buffer
    const regl_wrapper = {
      flush() {},
      flush_resource() {},
      buffer() { return gpu_buffer },
    } as unknown as ReglWrapper
    const buffer = new NormalizedUint8Buffer(regl_wrapper, 4)
    const color = new UniformScalar(encode_rgba([31, 119, 180, 255]), 10_000)

    buffer.set_from_color(color, new UniformScalar(0.001, 10_000))
    expect(buffer.get_array()[3]).to.be.equal(1)
    expect(buffer.to_attribute_config()).to.be.equal({
      buffer: gpu_buffer, divisor: 1, normalized: true, offset: 0,
    })
    const expanded = new NormalizedUint8Buffer(regl_wrapper, 4)
    expand_to_per_vertex(buffer, expanded, [3, 4], 4)
    expect(expanded.to_per_vertex_config()).to.be.equal({
      buffer: gpu_buffer, divisor: 0, normalized: true, offset: 0,
    })

    buffer.set_from_color(color, new UniformScalar(0, 10_000))
    expect(buffer.get_array()[3]).to.be.equal(0)
    expect(buffer.to_attribute_config()).to.be.equal({
      buffer: gpu_buffer, divisor: 1, normalized: true, offset: 0,
    })

    buffer.set_from_color(color, new UniformVector([0.001, 0.5]))
    expect(buffer.get_array().slice(0, 8)).to.be.equal(new Uint8Array([31, 119, 180, 1, 31, 119, 180, 128]))
    expect(buffer.to_attribute_config()).to.be.equal({
      buffer: gpu_buffer, divisor: 1, normalized: true, offset: 0,
    })

    const unnormalized = new Uint8Buffer(regl_wrapper, 4)
    unnormalized.set_from_color(color, new UniformScalar(0.001, 10_000))
    expect(unnormalized.get_array()[3]).to.be.equal(0)
  })

  it("should release its GPU buffer exactly once", () => {
    let destroyed = 0
    const gpu_buffer = Object.assign((_options: unknown) => {}, {
      destroy() { destroyed++ },
    }) as unknown as Buffer
    const regl_wrapper = {
      flush() {},
      flush_resource() {},
      buffer() { return gpu_buffer },
    } as unknown as ReglWrapper

    const buffer = new Float32Buffer(regl_wrapper)
    buffer.set_from_array([1, 2, 3])
    buffer.destroy()
    buffer.destroy()

    expect(destroyed).to.be.equal(1)
    expect(buffer.length).to.be.equal(0)
  })

  it("should upload sparse changes with byte offsets", () => {
    const updates: {data: number[], offset: number}[] = []
    const gpu_buffer = Object.assign((_options: unknown) => {}, {
      subdata(data: Float32Array, offset: number) {
        updates.push({data: [...data], offset})
      },
      destroy() {},
    }) as unknown as Buffer
    const regl_wrapper = {
      flush() {},
      flush_resource() {},
      buffer() { return gpu_buffer },
    } as unknown as ReglWrapper

    const buffer = new Float32Buffer(regl_wrapper)
    buffer.set_from_array([1, 2, 3, 4])
    const revision = buffer.uploaded_revision
    const array = buffer.get_array()
    array[1] = 20
    array[2] = 30
    buffer.update_range(1, 2)

    expect(updates).to.be.equal([{data: [20, 30], offset: Float32Array.BYTES_PER_ELEMENT}])
    expect(buffer.uploaded_revision).to.be.equal(revision + 1)
    expect(buffer.upload_stats).to.be.equal({full_uploads: 1, partial_uploads: 1, bytes: 6*Float32Array.BYTES_PER_ELEMENT})

    buffer.reset_upload_stats()
    expect(buffer.upload_stats).to.be.equal({full_uploads: 0, partial_uploads: 0, bytes: 0})
  })

  it("should coalesce sparse changes without relying on regl buffer internals", () => {
    const updates: {data: number[], offset: number}[] = []
    const gpu_buffer = Object.assign((_options: unknown) => {}, {
      subdata(data: Float32Array, offset: number) {
        updates.push({data: [...data], offset})
      },
      destroy() {},
    }) as unknown as Buffer
    const regl_wrapper = {
      flush() {},
      flush_resource() {},
      buffer() { return gpu_buffer },
    } as unknown as ReglWrapper

    const buffer = new Float32Buffer(regl_wrapper)
    buffer.set_from_array([1, 2, 3, 4, 5, 6])
    const array = buffer.get_array()
    array[2] = 30
    array[3] = 40
    array[5] = 60
    buffer.update_ranges([5, 3, 2, 3])

    expect(updates).to.be.equal([
      {data: [30, 40], offset: 2*Float32Array.BYTES_PER_ELEMENT},
      {data: [60], offset: 5*Float32Array.BYTES_PER_ELEMENT},
    ])
    expect(buffer.upload_stats).to.be.equal({full_uploads: 1, partial_uploads: 2, bytes: 9*Float32Array.BYTES_PER_ELEMENT})
  })

  it("should fall back to a full upload when the CPU array changes size", () => {
    let full_uploads = 0
    let sparse_uploads = 0
    const gpu_buffer = Object.assign((_options: unknown) => { full_uploads++ }, {
      subdata() { sparse_uploads++ },
      destroy() {},
    }) as unknown as Buffer
    const regl_wrapper = {
      flush() {},
      flush_resource() {},
      buffer() { return gpu_buffer },
    } as unknown as ReglWrapper

    const buffer = new Float32Buffer(regl_wrapper)
    buffer.set_from_array([1, 2, 3])
    buffer.get_sized_array(4).set([10, 20, 30, 40])
    buffer.update_range(1, 1)

    expect(full_uploads).to.be.equal(1)
    expect(sparse_uploads).to.be.equal(0)
  })
})
