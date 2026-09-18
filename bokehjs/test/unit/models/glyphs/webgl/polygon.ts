import {expect} from "#framework/assertions"

import type {SkirtGeometry} from "@bokehjs/core/util/polygon"
import {
  PolygonTopology, coordinates, group_boundaries, signed_area, subdivide_contour,
} from "@bokehjs/models/glyphs/webgl/polygon"
import {libtess} from "@bokehjs/models/glyphs/webgl/tessellator"

describe("polygon topology helpers", () => {
  it("should gather indexed coordinate pairs in order", () => {
    expect(coordinates([2, 0, 2], [10, 11, 20, 21, 30, 31])).to.be.equal([30, 31, 10, 11, 30, 31])
  })

  it("should preserve contour winding when recursively subdividing long contours", () => {
    const indices = Array.from({length: 20_000}, (_, i) => i)
    const contours = [...subdivide_contour(indices)]
    expect(contours.length).to.be.above(1)
    expect(contours.every((contour) => contour.length >= 3 && contour.length <= 128)).to.be.equal(true)

    function directed_edges(cycles: number[][]): [string, number][] {
      const edges = new Map<string, number>()
      for (const cycle of cycles) {
        for (let i = 0; i < cycle.length; i++) {
          const a = cycle[i], b = cycle[(i + 1) % cycle.length]
          const key = a < b ? `${a}:${b}` : `${b}:${a}`
          const direction = a < b ? 1 : -1
          edges.set(key, (edges.get(key) ?? 0) + direction)
        }
      }
      return [...edges].filter(([_, count]) => count != 0).sort(([a], [b]) => a.localeCompare(b))
    }

    // Synthetic closing chords occur in both directions and cancel, leaving
    // exactly the directed edges of the original contour.
    expect(directed_edges(contours)).to.be.equal(directed_edges([indices]))
  })

  it("should split at the contour-size boundary without losing the tail", () => {
    const indices = Array.from({length: 129}, (_, i) => i)
    expect([...subdivide_contour(indices)]).to.be.equal([
      indices.slice(0, 128),
      [0, 127, 128],
    ])
  })

  it("should compute translated signed areas without cancellation", () => {
    const x = 1_000_000_000_000
    const ring = [x, x, x + 3, x, x + 3, x + 2, x, x + 2]
    const reversed = [x, x + 2, x + 3, x + 2, x + 3, x, x, x]
    expect(signed_area(ring)).to.be.equal(6)
    expect(signed_area(reversed)).to.be.equal(-6)
    expect(signed_area([x, x, x + 1, x + 1, x + 2, x + 2])).to.be.equal(0)
  })

  it("should attach negative boundaries to the smallest containing positive boundary", () => {
    const reverse = (ring: number[]) => {
      const result: number[] = []
      for (let i = ring.length - 2; i >= 0; i -= 2) {
        result.push(ring[i], ring[i + 1])
      }
      return result
    }
    const outer = square(0, 0, 20)
    const separate = square(30, 0, 4)
    const island = square(5, 5, 10)
    const outer_hole = reverse(square(1, 1, 2))
    const island_hole = reverse(square(7, 7, 2))
    island_hole.unshift(island_hole[0], island_hole[1]) // repeated start exercises edge-interior sampling
    const orphan = reverse(square(100, 100, 1))

    expect(group_boundaries([outer, island_hole, separate, outer_hole, island, orphan])).to.be.equal([
      [outer, outer_hole],
      [separate],
      [island, island_hole],
    ])
  })
})

function area(geometries: SkirtGeometry[]): number {
  let area = 0
  for (const {positions, indices} of geometries) {
    for (let i = 0; i < indices.length; i += 3) {
      const a = 2*indices[i], b = 2*indices[i + 1], c = 2*indices[i + 2]
      area += Math.abs((positions[b] - positions[a])*(positions[c + 1] - positions[a + 1]) -
                      (positions[c] - positions[a])*(positions[b + 1] - positions[a + 1])) / 2
    }
  }
  return area
}

function covers(geometries: SkirtGeometry[], x: number, y: number): boolean {
  for (const {positions, indices} of geometries) {
    for (let i = 0; i < indices.length; i += 3) {
      const a = 2*indices[i], b = 2*indices[i + 1], c = 2*indices[i + 2]
      const ax = positions[a], ay = positions[a + 1]
      const bx = positions[b], by = positions[b + 1]
      const cx = positions[c], cy = positions[c + 1]
      const det = (bx - ax)*(cy - ay) - (cx - ax)*(by - ay)
      if (Math.abs(det) < 1e-12) {
        continue
      }
      const u = ((x - ax)*(cy - ay) - (cx - ax)*(y - ay)) / det
      const v = ((bx - ax)*(y - ay) - (x - ax)*(by - ay)) / det
      if (u >= 0 && v >= 0 && u + v <= 1) {
        return true
      }
    }
  }
  return false
}

function square(x: number, y: number, size: number): number[] {
  return [x, y, x + size, y, x + size, y + size, x, y + size]
}

function triangulate(rings: number[][]): SkirtGeometry[] {
  // Disable AA to check the exact filled region independently of its fringe.
  return new PolygonTopology(rings).geometries(rings, 0)
}

describe("PolygonTopology", () => {
  it("should fill both lobes of a self-intersecting bow-tie", () => {
    const geometries = triangulate([[0, 0, 2, 2, 0, 2, 2, 0]])
    expect(area(geometries)).to.be.similar(2)
    expect(covers(geometries, 1, 0.25)).to.be.equal(true)
    expect(covers(geometries, 1, 1.75)).to.be.equal(true)
    expect(covers(geometries, 0.25, 1)).to.be.equal(false)
    expect(covers(geometries, 1.75, 1)).to.be.equal(false)
  })

  it("should fill every lobe of a sine curve crossing its baseline (issue #15453)", () => {
    const n = 500
    const xs = Array.from({length: n + 1}, (_, i) => 10*i/n)
    const ys = xs.map(Math.sin)
    const ring = xs.flatMap((x) => [x, 0])
    for (let i = n; i >= 0; i--) {
      ring.push(xs[i], ys[i])
    }
    let expected_area = 0
    for (let i = 1; i <= n; i++) {
      const a = Math.abs(ys[i - 1]), b = Math.abs(ys[i])
      const height = ys[i - 1]*ys[i] < 0 ? (a*a + b*b)/(a + b) : a + b
      expected_area += (xs[i] - xs[i - 1])*height/2
    }

    const geometries = triangulate([ring])
    expect(area(geometries)).to.be.similar(expected_area, 1e-6)
    for (const x of [1, 4, 7, 9.9]) {
      expect(covers(geometries, x, Math.sin(x)/2)).to.be.equal(true)
      expect(covers(geometries, x, -Math.sin(x)/2)).to.be.equal(false)
    }
  })

  it("should exclude the overlap of intersecting rings under the even-odd rule", () => {
    const geometries = triangulate([square(0, 0, 10), square(5, 0, 10)])
    expect(area(geometries)).to.be.similar(100)
    expect(covers(geometries, 2, 5)).to.be.equal(true)
    expect(covers(geometries, 12, 5)).to.be.equal(true)
    expect(covers(geometries, 7, 5)).to.be.equal(false)
  })

  it("should preserve the fill when subdividing long self-intersecting contours", () => {
    const corners = [[0, 0], [200, 200], [0, 200], [200, 0]]
    const ring: number[] = []
    for (let i = 0; i < corners.length; i++) {
      const [x0, y0] = corners[i]
      const [x1, y1] = corners[(i + 1) % corners.length]
      for (let j = 0; j < 100; j++) {
        ring.push(x0 + (x1 - x0)*j/100, y0 + (y1 - y0)*j/100)
      }
    }
    const topology = new PolygonTopology([ring])
    const original = topology.geometries([ring], 0)
    expect(area(original)).to.be.similar(20_000)
    const mapped = ring.map((v, i) => i % 2 == 0 ? 13 - 3*v : 7 + 2*v)
    const geometries = topology.geometries([mapped], 0)
    expect(area(geometries)).to.be.similar(120_000)
    for (const [x, y, inside] of [[100, 25, true], [100, 175, true], [25, 100, false], [175, 100, false]] as const) {
      expect(covers(original, x, y)).to.be.equal(inside)
      expect(covers(geometries, 13 - 3*x, 7 + 2*y)).to.be.equal(inside)
    }
  })

  it("should preserve holes, nested islands, and disjoint rings", () => {
    const rings = [square(0, 0, 20), square(2, 2, 16), square(5, 5, 10), square(7, 7, 6), square(30, 0, 4)]
    const geometries = triangulate(rings)
    expect(area(geometries)).to.be.similar(224)
    expect(covers(geometries, 1, 1)).to.be.equal(true)
    expect(covers(geometries, 3, 3)).to.be.equal(false)
    expect(covers(geometries, 6, 6)).to.be.equal(true)
    expect(covers(geometries, 8, 8)).to.be.equal(false)
    expect(covers(geometries, 31, 1)).to.be.equal(true)
    expect(covers(geometries, 25, 1)).to.be.equal(false)
  })

  it("should handle a hole touching the outer boundary", () => {
    const geometries = triangulate([square(0, 0, 10), square(0, 3, 4)])
    expect(area(geometries)).to.be.similar(84)
    expect(covers(geometries, 2, 5)).to.be.equal(false)
    expect(covers(geometries, 6, 5)).to.be.equal(true)
  })

  it("should preserve separate filled contours that touch at an intersection", () => {
    const rings = [
      [3, 5, 3, 7, 1, 4, 9, 5],
      [5, 0, 5, 5, 0, 0],
      [3, 5, 5, 3, 8, 7, 3, 9],
    ]
    const geometries = triangulate(rings)
    expect(covers(geometries, 3.56604, 4.62420)).to.be.equal(false)
    expect(covers(geometries, 4.8, 4.6)).to.be.equal(true)
  })

  it("should triangulate boundaries that touch their own edges without overlap", () => {
    const rings = [
      [9, 2, 4, 7, 5, 0, 8, 9, 2, 1],
      [9, 4, 6, 3, 8, 0],
      [2, 5, 8, 4, 0, 4],
    ]
    const geometries = triangulate(rings)
    const x = 6.044331181328744, y = 2.7202809555456042
    let count = 0
    for (const geometry of geometries) {
      for (let i = 0; i < geometry.indices.length; i += 3) {
        const triangle = {...geometry, indices: geometry.indices.slice(i, i + 3)}
        count += covers([triangle], x, y) ? 1 : 0
      }
    }
    expect(count).to.be.equal(1)
  })

  it("should keep combined fill vertices aligned with their antialiased boundaries", () => {
    // The resolved boundary visits (3,4) twice. Its second tessellation merges
    // those visits, and all three copies must stay aligned when adding AA.
    const rings = [[3, 5, 2, 6, 7, 1, 4, 4, 0, 4, 3, 7, 9, 0, 7, 3, 3, 1].map((v) => 60*v)]
    const topology = new PolygonTopology(rings)
    const plain = topology.geometries(rings, 0)
    const antialiased = topology.geometries(rings)
    let checked = false
    for (let i = 0; i < antialiased.length; i++) {
      const geometry = antialiased[i]
      const fill_vertices = geometry.edge_distance.findIndex((v) => v == 0)
      const boundary_vertices = geometry.nvertices - fill_vertices
      if (fill_vertices > boundary_vertices) {
        checked = true
        expect(geometry.positions.slice(0, 2*fill_vertices)).to.be.equal(plain[i].positions.slice(0, 2*fill_vertices))
      }
    }
    expect(checked).to.be.equal(true)
  })

  it("should cancel coincident rings regardless of orientation", () => {
    const ring = square(0, 0, 10)
    const reversed = [0, 0, 0, 10, 10, 10, 10, 0]
    expect(triangulate([ring, ring])).to.be.equal([])
    expect(triangulate([ring, reversed])).to.be.equal([])
  })

  it("should ignore empty and degenerate contours", () => {
    const rings = [[], [1, 1], [0, 0, 1, 1], [0, 0, 1, 1, 2, 2], [1, 1, 1, 1, 1, 1]]
    expect(triangulate(rings)).to.be.equal([])
    expect(area(triangulate([...rings, square(0, 0, 10)]))).to.be.similar(100)
  })

  it("should retain fill topology when remapping intersection vertices", () => {
    // Repeat a closing vertex to exercise coincident-vertex combination too.
    const rings = [[0, 0, 2, 2, 0, 2, 2, 0, 0, 0]]
    const topology = new PolygonTopology(rings)
    const original = topology.geometries(rings, 0)
    const mapped = rings.map((ring) => ring.map((v, i) => i % 2 == 0 ? 13 - 3*v : 7 + 2*v))
    const geometries = topology.geometries(mapped, 0)
    expect(topology.matches(mapped)).to.be.equal(true)
    expect(geometries.map(({indices}) => indices)).to.be.equal(original.map(({indices}) => indices))
    expect(area(geometries)).to.be.similar(12)
    expect(covers(geometries, 10, 7.5)).to.be.equal(true)
    expect(covers(geometries, 10, 10.5)).to.be.equal(true)
    expect(covers(geometries, 12.25, 9)).to.be.equal(false)
    expect(covers(geometries, 7.75, 9)).to.be.equal(false)
  })

  it("should reject changes in the number or length of source rings", () => {
    const rings = [square(0, 0, 10), square(20, 0, 10)]
    const topology = new PolygonTopology(rings)
    expect(topology.matches(rings)).to.be.equal(true)
    expect(topology.matches([rings[0]])).to.be.equal(false)
    expect(topology.matches([rings[0], rings[1].slice(2)])).to.be.equal(false)
    expect(topology.matches([rings[0], [...rings[1], 20, 0]])).to.be.equal(false)
  })

  it("should bound mesh relabeling for a large contour with many touching regions", () => {
    type Point = [number, number]
    const points: Point[] = []
    function koch([x0, y0]: Point, [x1, y1]: Point, depth: number): void {
      if (depth == 0) {
        points.push([x0, y0])
        return
      }
      const a: Point = [x0 + (x1 - x0)/3, y0 + (y1 - y0)/3]
      const b: Point = [x0 + 2*(x1 - x0)/3, y0 + 2*(y1 - y0)/3]
      const tip: Point = [(a[0] + b[0])/2 + Math.sqrt(3)*(y0 - y1)/6,
                          (a[1] + b[1])/2 + Math.sqrt(3)*(x1 - x0)/6]
      koch([x0, y0], a, depth - 1)
      koch(a, tip, depth - 1)
      koch(tip, b, depth - 1)
      koch(b, [x1, y1], depth - 1)
    }
    const vertices = Array.from({length: 3}, (_, i): Point =>
      [200*Math.cos(Math.PI/2 + i*2*Math.PI/3), 200*Math.sin(Math.PI/2 + i*2*Math.PI/3)])
    for (let i = 0; i < vertices.length; i++) {
      koch(vertices[i], vertices[(i + 1) % vertices.length], 5)
    }
    const ring = points.flatMap(([x, y]) => [Math.fround(260 + x), Math.fround(260 - y)])

    // Count work instead of timing it: the upstream mesh operations perform
    // over a million face assignments for these 3,072 vertices.
    const {mesh} = libtess
    const make_edge = mesh.makeEdgePair_
    let assignments = 0
    mesh.makeEdgePair_ = (next: Parameters<typeof make_edge>[0]) => {
      const edge = make_edge(next)
      for (const e of [edge, edge.sym]) {
        let face = e.lFace
        Object.defineProperty(e, "lFace", {
          get: () => face,
          set: (replacement: typeof face) => {
            face = replacement
            assignments++
          },
        })
      }
      return edge
    }
    try {
      new PolygonTopology([ring])
    } finally {
      mesh.makeEdgePair_ = make_edge
    }
    expect(assignments).to.be.above(0)
    expect(assignments).to.be.below(100*points.length)
  })
})
