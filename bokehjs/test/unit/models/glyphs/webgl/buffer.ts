import {expect} from "assertions"

import {expand_to_per_vertex} from "@bokehjs/models/glyphs/webgl/buffer"

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
