import {expect} from "assertions"

import {split_rings, point_in_ring, classify_rings, build_line_from_ring, generate_skirt_geometry} from "@bokehjs/core/util/polygon"

describe("polygon_utils", () => {

  describe("split_rings", () => {

    it("should return one ring for a simple polygon with no NaNs", () => {
      const rings = split_rings([1, 2, 3], [4, 5, 6])
      expect(rings).to.be.equal([[1, 4, 2, 5, 3, 6]])
    })

    it("should split on NaN into outer boundary and hole", () => {
      const rings = split_rings(
        [0, 10, 10, 0, NaN, 2, 8, 8, 2],
        [0, 0, 10, 10, NaN, 2, 2, 8, 8],
      )
      expect(rings.length).to.be.equal(2)
      expect(rings[0]).to.be.equal([0, 0, 10, 0, 10, 10, 0, 10])
      expect(rings[1]).to.be.equal([2, 2, 8, 2, 8, 8, 2, 8])
    })

    it("should split into multiple holes with multiple NaN separators", () => {
      const rings = split_rings(
        [0, 10, 10, 0, NaN, 1, 2, 3, NaN, 4, 5, 6],
        [0, 0, 10, 10, NaN, 1, 2, 3, NaN, 4, 5, 6],
      )
      expect(rings.length).to.be.equal(3)
      expect(rings[0]).to.be.equal([0, 0, 10, 0, 10, 10, 0, 10])
      expect(rings[1]).to.be.equal([1, 1, 2, 2, 3, 3])
      expect(rings[2]).to.be.equal([4, 4, 5, 5, 6, 6])
    })

    it("should skip leading NaN", () => {
      const rings = split_rings([NaN, 1, 2], [NaN, 3, 4])
      expect(rings).to.be.equal([[1, 3, 2, 4]])
    })

    it("should skip trailing NaN", () => {
      const rings = split_rings([1, 2, NaN], [3, 4, NaN])
      expect(rings).to.be.equal([[1, 3, 2, 4]])
    })

    it("should skip consecutive NaNs", () => {
      const rings = split_rings([1, NaN, NaN, 2], [3, NaN, NaN, 4])
      expect(rings.length).to.be.equal(2)
      expect(rings[0]).to.be.equal([1, 3])
      expect(rings[1]).to.be.equal([2, 4])
    })

    it("should return empty array for empty input", () => {
      const rings = split_rings([], [])
      expect(rings).to.be.equal([])
    })

    it("should return empty array for all-NaN input", () => {
      const rings = split_rings([NaN, NaN], [NaN, NaN])
      expect(rings).to.be.equal([])
    })

    it("should use min of sx and sy lengths", () => {
      const rings = split_rings([1, 2, 3, 4], [5, 6])
      expect(rings).to.be.equal([[1, 5, 2, 6]])
    })

    it("should split on Infinity the same as NaN", () => {
      const rings = split_rings([1, 2, Infinity, 3, 4], [5, 6, Infinity, 7, 8])
      expect(rings.length).to.be.equal(2)
      expect(rings[0]).to.be.equal([1, 5, 2, 6])
      expect(rings[1]).to.be.equal([3, 7, 4, 8])
    })

    it("should split on -Infinity the same as NaN", () => {
      const rings = split_rings([1, -Infinity, 2], [3, -Infinity, 4])
      expect(rings.length).to.be.equal(2)
      expect(rings[0]).to.be.equal([1, 3])
      expect(rings[1]).to.be.equal([2, 4])
    })

    it("should split when only one of x or y is NaN", () => {
      const rings = split_rings([1, NaN, 2], [3, 4, 5])
      expect(rings.length).to.be.equal(2)
      expect(rings[0]).to.be.equal([1, 3])
      expect(rings[1]).to.be.equal([2, 5])
    })

    it("should handle a single point", () => {
      const rings = split_rings([5], [10])
      expect(rings).to.be.equal([[5, 10]])
    })

    it("should work with Float32Array inputs", () => {
      const sx = new Float32Array([1, 2, 3])
      const sy = new Float32Array([4, 5, 6])
      const rings = split_rings(sx, sy)
      expect(rings).to.be.equal([[1, 4, 2, 5, 3, 6]])
    })
  })

  describe("point_in_ring", () => {

    it("should return true for point inside a square", () => {
      const ring = [0, 0, 10, 0, 10, 10, 0, 10]
      expect(point_in_ring(5, 5, ring)).to.be.equal(true)
    })

    it("should return false for point outside a square", () => {
      const ring = [0, 0, 10, 0, 10, 10, 0, 10]
      expect(point_in_ring(15, 5, ring)).to.be.equal(false)
    })

    it("should return false for point above a square", () => {
      const ring = [0, 0, 10, 0, 10, 10, 0, 10]
      expect(point_in_ring(5, 15, ring)).to.be.equal(false)
    })

    it("should return true for point inside a triangle", () => {
      const ring = [0, 0, 10, 0, 5, 10]
      expect(point_in_ring(5, 3, ring)).to.be.equal(true)
    })

    it("should return false for point outside a triangle", () => {
      const ring = [0, 0, 10, 0, 5, 10]
      expect(point_in_ring(9, 9, ring)).to.be.equal(false)
    })
  })

  describe("classify_rings", () => {

    it("should return a single group for a single ring", () => {
      const rings = [[0, 0, 10, 0, 10, 10, 0, 10]]
      const groups = classify_rings(rings)
      expect(groups.length).to.be.equal(1)
      expect(groups[0].rings.length).to.be.equal(1)
    })

    it("should classify a true hole as part of the outer group", () => {
      // Outer square, inner square hole
      const outer = [0, 0, 20, 0, 20, 20, 0, 20]
      const hole = [5, 5, 15, 5, 15, 15, 5, 15]
      const groups = classify_rings([outer, hole])
      expect(groups.length).to.be.equal(1)
      expect(groups[0].rings.length).to.be.equal(2)
      expect(groups[0].rings[0]).to.be.equal(outer)
      expect(groups[0].rings[1]).to.be.equal(hole)
    })

    it("should classify a disjoint ring as a separate group", () => {
      // Two disjoint squares
      const ring0 = [0, 0, 10, 0, 10, 10, 0, 10]
      const ring1 = [20, 0, 30, 0, 30, 10, 20, 10]
      const groups = classify_rings([ring0, ring1])
      expect(groups.length).to.be.equal(2)
      expect(groups[0].rings.length).to.be.equal(1)
      expect(groups[0].rings[0]).to.be.equal(ring0)
      expect(groups[1].rings.length).to.be.equal(1)
      expect(groups[1].rings[0]).to.be.equal(ring1)
    })

    it("should handle mix of holes and disjoint parts", () => {
      // Outer square with a hole, plus a disjoint square
      const outer = [0, 0, 20, 0, 20, 20, 0, 20]
      const hole = [5, 5, 15, 5, 15, 15, 5, 15]
      const disjoint = [30, 0, 40, 0, 40, 10, 30, 10]
      const groups = classify_rings([outer, hole, disjoint])
      expect(groups.length).to.be.equal(2)
      // Group 0: outer + hole
      expect(groups[0].rings.length).to.be.equal(2)
      expect(groups[0].rings[0]).to.be.equal(outer)
      expect(groups[0].rings[1]).to.be.equal(hole)
      // Group 1: disjoint
      expect(groups[1].rings.length).to.be.equal(1)
      expect(groups[1].rings[0]).to.be.equal(disjoint)
    })

    it("should produce correct flat_coords for each group", () => {
      const ring0 = [0, 0, 10, 0, 10, 10, 0, 10]
      const ring1 = [20, 0, 30, 0, 30, 10, 20, 10]
      const groups = classify_rings([ring0, ring1])
      expect(groups[0].flat_coords).to.be.equal([0, 0, 10, 0, 10, 10, 0, 10])
      expect(groups[1].flat_coords).to.be.equal([20, 0, 30, 0, 30, 10, 20, 10])
    })

    it("should handle overlapping disjoint rings (Venn diagram pattern)", () => {
      // Two overlapping circles approximated as squares
      // Ring 0: square at (0,0)-(10,10)
      // Ring 1: square at (5,0)-(15,10) — overlaps ring 0 but first point (5,0) is ON the edge
      // Since (5,0) is on the boundary, ray-casting may return false, making it disjoint
      const ring0 = [0, 0, 10, 0, 10, 10, 0, 10]
      const ring1 = [5, -1, 15, -1, 15, 10, 5, 10]  // first point clearly outside ring0
      const groups = classify_rings([ring0, ring1])
      // Both should be separate groups since ring1's first point is outside ring0
      expect(groups.length).to.be.equal(2)
    })

    it("should handle empty rings array", () => {
      const groups = classify_rings([])
      expect(groups.length).to.be.equal(1)
      expect(groups[0].rings.length).to.be.equal(0)
      expect(groups[0].flat_coords).to.be.equal([])
    })
  })

  describe("build_line_from_ring", () => {

    it("should return empty data for an empty ring", () => {
      const result = build_line_from_ring([])
      expect(result.nline).to.be.equal(0)
      expect(result.points.length).to.be.equal(0)
      expect(result.show.length).to.be.equal(0)
      expect(result.length_so_far.length).to.be.equal(0)
    })

    it("should return empty data for a single point", () => {
      const result = build_line_from_ring([5, 10])
      expect(result.nline).to.be.equal(0)
      expect(result.points.length).to.be.equal(0)
      expect(result.show.length).to.be.equal(0)
      expect(result.length_so_far.length).to.be.equal(0)
    })

    it("should handle a two-point open ring", () => {
      // Two distinct points: not closed (npoints == 2, so is_closed check requires npoints > 2)
      // nline = npoints + 1 = 3
      const result = build_line_from_ring([0, 0, 10, 0])
      expect(result.nline).to.be.equal(3)

      // points has (nline + 2) * 2 = 10 values
      expect(result.points.length).to.be.equal(10)

      // Core points at indices 1..npoints (slots 1,2 for the two original points)
      expect(result.points[2]).to.be.equal(0)   // point[1].x = first vertex
      expect(result.points[3]).to.be.equal(0)   // point[1].y
      expect(result.points[4]).to.be.equal(10)  // point[2].x = second vertex
      expect(result.points[5]).to.be.equal(0)   // point[2].y

      // Closing point (repeat first vertex) at slot npoints+1 = 3
      expect(result.points[6]).to.be.equal(0)   // point[3].x = first vertex repeated
      expect(result.points[7]).to.be.equal(0)   // point[3].y

      // show array length = nline + 1 = 4, all ones
      expect(result.show.length).to.be.equal(4)
      for (let i = 0; i < result.show.length; i++) {
        expect(result.show[i]).to.be.equal(1)
      }

      // length_so_far has nsegments = nline - 1 = 2 entries
      expect(result.length_so_far.length).to.be.equal(2)
    })

    it("should detect explicitly closed polygon (first == last)", () => {
      // Triangle: (0,0) -> (3,0) -> (0,4) -> (0,0)
      // 4 points, first == last => is_closed = true, nline = npoints = 4
      const ring = [0, 0, 3, 0, 0, 4, 0, 0]
      const result = build_line_from_ring(ring)
      expect(result.nline).to.be.equal(4)

      // points has (4 + 2) * 2 = 12 values
      expect(result.points.length).to.be.equal(12)
    })

    it("should add closing vertex for implicitly open polygon", () => {
      // Triangle: (0,0) -> (3,0) -> (0,4)  (no repeated last point)
      // 3 points, first != last => is_closed = false, nline = npoints + 1 = 4
      const ring = [0, 0, 3, 0, 0, 4]
      const result = build_line_from_ring(ring)
      expect(result.nline).to.be.equal(4)

      // points has (4 + 2) * 2 = 12 values
      expect(result.points.length).to.be.equal(12)

      // Closing vertex at slot npoints+1 = 4 should equal first vertex
      expect(result.points[8]).to.be.equal(0)   // point[4].x
      expect(result.points[9]).to.be.equal(0)   // point[4].y
    })

    it("should set guard points correctly for a closed polygon", () => {
      // Square: (0,0) -> (10,0) -> (10,10) -> (0,10) -> (0,0)
      // npoints = 5 (including closing duplicate), is_closed = true, nline = 5
      const ring = [0, 0, 10, 0, 10, 10, 0, 10, 0, 0]
      const npoints = ring.length / 2  // 5
      const result = build_line_from_ring(ring)

      // Points layout (1-indexed core, 0-indexed guard):
      //   slot 0: guard0       slot 1: (0,0)   slot 2: (10,0)
      //   slot 3: (10,10)      slot 4: (0,10)  slot 5: (0,0)
      //   slot 6: guard_end

      // guard0 (slot 0) = point[npoints-1] in the points array = second-to-last vertex = (0,10)
      expect(result.points[0]).to.be.equal(result.points[(npoints - 1) * 2])      // points[8] = 0
      expect(result.points[1]).to.be.equal(result.points[(npoints - 1) * 2 + 1])  // points[9] = 10

      // guard_end (slot nline+1 = 6) = second vertex in the points array = points[4], points[5] = (10,0)
      const guard_end_idx = (result.nline + 1) * 2
      expect(result.points[guard_end_idx]).to.be.equal(result.points[4])
      expect(result.points[guard_end_idx + 1]).to.be.equal(result.points[5])
    })

    it("should set guard points correctly for an open polygon", () => {
      // Triangle: (0,0) -> (3,0) -> (0,4)  (open, closing vertex added)
      // npoints = 3, nline = 4
      const ring = [0, 0, 3, 0, 0, 4]
      const npoints = 3
      const result = build_line_from_ring(ring)

      // guard0 (slot 0) = last unique point = point[npoints] in the 1-indexed layout
      expect(result.points[0]).to.be.equal(result.points[npoints * 2])
      expect(result.points[1]).to.be.equal(result.points[npoints * 2 + 1])

      // guard_end (slot nline+1 = 5) = second point = points[4], points[5]
      const guard_end_idx = (result.nline + 1) * 2
      expect(result.points[guard_end_idx]).to.be.equal(result.points[4])
      expect(result.points[guard_end_idx + 1]).to.be.equal(result.points[5])
    })

    it("should fill show array with all ones", () => {
      const ring = [0, 0, 10, 0, 10, 10, 0, 10, 0, 0]
      const result = build_line_from_ring(ring)

      expect(result.show.length).to.be.equal(result.nline + 1)
      for (let i = 0; i < result.show.length; i++) {
        expect(result.show[i]).to.be.equal(1)
      }
    })

    it("should compute cumulative segment lengths for a 3-4-5 right triangle", () => {
      // Explicitly closed triangle: (0,0) -> (3,0) -> (3,4) -> (0,0)
      // npoints = 4, is_closed = true, nline = 4
      // Segments (in the points array, 1-indexed):
      //   seg 0: point[1]->[2] = (0,0)->(3,0), length = 3
      //   seg 1: point[2]->[3] = (3,0)->(3,4), length = 4
      //   seg 2: point[3]->[4] = (3,4)->(0,0), length = 5
      const ring = [0, 0, 3, 0, 3, 4, 0, 0]
      const result = build_line_from_ring(ring)

      expect(result.nline).to.be.equal(4)
      // nsegments = nline - 1 = 3
      expect(result.length_so_far.length).to.be.equal(3)

      // length_so_far is cumulative BEFORE each segment
      expect(result.length_so_far[0]).to.be.equal(0)      // before first segment
      expect(result.length_so_far[1]).to.be.similar(3)     // after first segment (length 3)
      expect(result.length_so_far[2]).to.be.similar(7)     // after second segment (3 + 4)
    })

    it("should compute cumulative segment lengths for an axis-aligned square", () => {
      // Open square: (0,0) -> (10,0) -> (10,10) -> (0,10)
      // npoints = 4, first != last, nline = 5
      // Closing vertex added: (0,0)
      // Segments:
      //   seg 0: (0,0)->(10,0), length = 10
      //   seg 1: (10,0)->(10,10), length = 10
      //   seg 2: (10,10)->(0,10), length = 10
      //   seg 3: (0,10)->(0,0), length = 10
      const ring = [0, 0, 10, 0, 10, 10, 0, 10]
      const result = build_line_from_ring(ring)

      expect(result.nline).to.be.equal(5)
      // nsegments = 4
      expect(result.length_so_far.length).to.be.equal(4)

      expect(result.length_so_far[0]).to.be.similar(0)
      expect(result.length_so_far[1]).to.be.similar(10)
      expect(result.length_so_far[2]).to.be.similar(20)
      expect(result.length_so_far[3]).to.be.similar(30)
    })

    it("should produce correct array sizes for all outputs", () => {
      // 6-point polygon (hexagon-like), explicitly closed
      const ring = [1, 0, 0.5, 0.87, -0.5, 0.87, -1, 0, -0.5, -0.87, 0.5, -0.87, 1, 0]
      const result = build_line_from_ring(ring)

      const npoints = ring.length / 2  // 7
      // is_closed = true (first == last), so nline = npoints = 7
      expect(result.nline).to.be.equal(npoints)

      // points: (nline + 2) * 2
      expect(result.points.length).to.be.equal((result.nline + 2) * 2)

      // show: nline + 1
      expect(result.show.length).to.be.equal(result.nline + 1)

      // length_so_far: nline - 1
      expect(result.length_so_far.length).to.be.equal(result.nline - 1)
    })
  })

  describe("generate_skirt_geometry", () => {

    // Pre-computed earcut results for each test polygon to avoid
    // importing earcut (which lacks type declarations in test env).
    const TRIANGLE_INDICES = [1, 2, 0]
    const SQUARE_INDICES = [2, 3, 0, 0, 1, 2]
    const SQUARE_HOLE_INDICES = [0, 4, 7, 5, 4, 0, 3, 0, 7, 5, 0, 1, 2, 3, 7, 6, 5, 1, 2, 7, 6, 6, 1, 2]
    const SHARP_V_INDICES = [1, 2, 0]

    it("should produce correct vertex and triangle counts for a triangle", () => {
      // Triangle: 3 original + 3 skirt = 6 vertices
      // 1 earcut triangle + 2*3 = 6 skirt triangles = 7 total
      const flat_coords = [0, 0, 10, 0, 0, 10]
      const rings = [flat_coords]
      const geom = generate_skirt_geometry(flat_coords, rings, TRIANGLE_INDICES, 1.5)

      expect(geom.nvertices).to.be.equal(6)
      expect(geom.ntriangles).to.be.equal(7)
      expect(geom.positions.length).to.be.equal(12) // 6 verts * 2 coords
      expect(geom.edge_distance.length).to.be.equal(6)
      expect(geom.indices.length).to.be.equal(21)   // 7 tris * 3
    })

    it("should produce correct vertex and triangle counts for a square", () => {
      // Square: 4 original + 4 skirt = 8 vertices
      // 2 earcut triangles + 2*4 = 8 skirt triangles = 10 total
      const flat_coords = [0, 0, 10, 0, 10, 10, 0, 10]
      const rings = [flat_coords]
      const geom = generate_skirt_geometry(flat_coords, rings, SQUARE_INDICES, 1.5)

      expect(geom.nvertices).to.be.equal(8)
      expect(geom.ntriangles).to.be.equal(10)
      expect(geom.positions.length).to.be.equal(16) // 8 verts * 2 coords
      expect(geom.edge_distance.length).to.be.equal(8)
      expect(geom.indices.length).to.be.equal(30)   // 10 tris * 3
    })

    it("should set inner edge_distance = antialias_width for original vertices", () => {
      const flat_coords = [0, 0, 10, 0, 0, 10]
      const rings = [flat_coords]
      const geom = generate_skirt_geometry(flat_coords, rings, TRIANGLE_INDICES, 1.5)

      // First 3 vertices (original) should have edge_distance = 1.5
      for (let i = 0; i < 3; i++) {
        expect(geom.edge_distance[i]).to.be.equal(1.5)
      }
    })

    it("should set outer edge_distance = 0 for skirt vertices", () => {
      const flat_coords = [0, 0, 10, 0, 0, 10]
      const rings = [flat_coords]
      const geom = generate_skirt_geometry(flat_coords, rings, TRIANGLE_INDICES, 1.5)

      // Last 3 vertices (skirt) should have edge_distance = 0
      for (let i = 3; i < 6; i++) {
        expect(geom.edge_distance[i]).to.be.equal(0)
      }
    })

    it("should preserve earcut indices as first portion of result indices", () => {
      const flat_coords = [0, 0, 10, 0, 10, 10, 0, 10]
      const rings = [flat_coords]
      const geom = generate_skirt_geometry(flat_coords, rings, SQUARE_INDICES, 1.5)

      // First earcut_count indices should match the original earcut output
      for (let i = 0; i < SQUARE_INDICES.length; i++) {
        expect(geom.indices[i]).to.be.equal(SQUARE_INDICES[i])
      }
    })

    it("should place skirt vertices outward and shift boundary vertices inward (straddling AA)", () => {
      // CCW square: (0,0) -> (10,0) -> (10,10) -> (0,10)
      const flat_coords = [0, 0, 10, 0, 10, 10, 0, 10]
      const rings = [flat_coords]
      const geom = generate_skirt_geometry(flat_coords, rings, SQUARE_INDICES, 1.5)

      // Original boundary vertices (indices 0-3) should be shifted inward
      // v0=(0,0): shifted toward interior (positive x, positive y)
      expect(geom.positions[0 * 2]).to.be.above(0)
      expect(geom.positions[0 * 2 + 1]).to.be.above(0)

      // v1=(10,0): shifted toward interior (negative x, positive y)
      expect(geom.positions[1 * 2]).to.be.below(10)
      expect(geom.positions[1 * 2 + 1]).to.be.above(0)

      // v2=(10,10): shifted toward interior (negative x, negative y)
      expect(geom.positions[2 * 2]).to.be.below(10)
      expect(geom.positions[2 * 2 + 1]).to.be.below(10)

      // v3=(0,10): shifted toward interior (positive x, negative y)
      expect(geom.positions[3 * 2]).to.be.above(0)
      expect(geom.positions[3 * 2 + 1]).to.be.below(10)

      // Skirt vertices (indices 4-7) should be offset outward from the
      // original mathematical boundary (past the input coordinates)
      // v0=(0,0): skirt should be at roughly (-0.75, -0.75) direction
      const s0x = geom.positions[4 * 2]
      const s0y = geom.positions[4 * 2 + 1]
      expect(s0x).to.be.below(0)  // moved left of original
      expect(s0y).to.be.below(0)  // moved down of original

      // v1=(10,0): skirt should be at roughly (10.75, -0.75) direction
      const s1x = geom.positions[5 * 2]
      const s1y = geom.positions[5 * 2 + 1]
      expect(s1x).to.be.above(10) // moved right of original
      expect(s1y).to.be.below(0)   // moved down of original

      // v2=(10,10): skirt should be at roughly (10.75, 10.75) direction
      const s2x = geom.positions[6 * 2]
      const s2y = geom.positions[6 * 2 + 1]
      expect(s2x).to.be.above(10) // moved right of original
      expect(s2y).to.be.above(10)  // moved up of original

      // v3=(0,10): skirt should be at roughly (-0.75, 10.75) direction
      const s3x = geom.positions[7 * 2]
      const s3y = geom.positions[7 * 2 + 1]
      expect(s3x).to.be.below(0)  // moved left of original
      expect(s3y).to.be.above(10)  // moved up of original

      // Inner and outer vertices should be symmetric about original boundary.
      const half_aa = 0.75  // 0.5 * 1.5
      expect(geom.positions[0 * 2]).to.be.similar(half_aa, 0.01)
      expect(geom.positions[0 * 2 + 1]).to.be.similar(half_aa, 0.01)
      expect(s0x).to.be.similar(-half_aa, 0.01)
      expect(s0y).to.be.similar(-half_aa, 0.01)
    })

    it("should handle polygon with a hole (both boundaries get skirts)", () => {
      // Outer square: (0,0)-(20,0)-(20,20)-(0,20), 4 vertices
      // Hole: (5,5)-(15,5)-(15,15)-(5,15), 4 vertices
      // 8 original + 8 skirt = 16 vertices
      const flat_coords = [0, 0, 20, 0, 20, 20, 0, 20, 5, 5, 15, 5, 15, 15, 5, 15]
      const rings = [[0, 0, 20, 0, 20, 20, 0, 20], [5, 5, 15, 5, 15, 15, 5, 15]]
      const geom = generate_skirt_geometry(flat_coords, rings, SQUARE_HOLE_INDICES, 1.5)

      // 8 original + 4 outer skirt + 4 hole skirt = 16 vertices
      expect(geom.nvertices).to.be.equal(16)

      // earcut tris + 2*4 outer skirt + 2*4 hole skirt = earcut + 16
      const n_earcut = SQUARE_HOLE_INDICES.length / 3
      expect(geom.ntriangles).to.be.equal(n_earcut + 16)

      // All original vertices should have edge_distance = 1.5
      for (let i = 0; i < 8; i++) {
        expect(geom.edge_distance[i]).to.be.equal(1.5)
      }

      // All skirt vertices should have edge_distance = 0
      for (let i = 8; i < 16; i++) {
        expect(geom.edge_distance[i]).to.be.equal(0)
      }

      // Outer boundary vertex v0=(0,0) should be shifted inward (positive x, positive y)
      expect(geom.positions[0 * 2]).to.be.above(0)
      expect(geom.positions[0 * 2 + 1]).to.be.above(0)

      // Outer skirt vertices (8-11) should expand outward from outer boundary
      // v0=(0,0) outer skirt should be outside (negative x, negative y)
      expect(geom.positions[8 * 2]).to.be.below(0)
      expect(geom.positions[8 * 2 + 1]).to.be.below(0)

      // Hole boundary vertex v4=(5,5) should be shifted inward toward fill
      // (away from hole center), i.e., toward (0,0) corner — smaller x, smaller y
      expect(geom.positions[4 * 2]).to.be.below(5)
      expect(geom.positions[4 * 2 + 1]).to.be.below(5)

      // Hole skirt vertices (12-15) should expand INTO the hole
      // v4=(5,5) is a hole corner. Its skirt should move TOWARD the hole center.
      const hole_s0x = geom.positions[12 * 2]
      const hole_s0y = geom.positions[12 * 2 + 1]
      // Skirt vertex for hole corner (5,5) should be closer to center (10,10)
      expect(hole_s0x).to.be.above(5)
      expect(hole_s0y).to.be.above(5)
    })

    it("should clamp miter at sharp angles", () => {
      // Very sharp V-shape: creates near-parallel edges
      const flat_coords = [0, 0, 100, 1, 0, 2]
      const rings = [flat_coords]
      const geom = generate_skirt_geometry(flat_coords, rings, SHARP_V_INDICES, 1.5)

      // Both original (shifted inward) and skirt (shifted outward) vertices
      // should be within a reasonable distance of the original boundary.
      // Max offset = half_aa / clamped_cos = 0.75 / 0.1 = 7.5
      for (let i = 0; i < geom.nvertices; i++) {
        const sx = geom.positions[i * 2]
        const sy = geom.positions[i * 2 + 1]
        let min_dist = Infinity
        for (let j = 0; j < 3; j++) {
          const dx = sx - flat_coords[j * 2]
          const dy = sy - flat_coords[j * 2 + 1]
          min_dist = Math.min(min_dist, Math.sqrt(dx * dx + dy * dy))
        }
        expect(min_dist).to.be.below(10) // 0.75/0.1 = 7.5, allow some margin
      }
    })

    it("should straddle boundary symmetrically (inner + outer equidistant from original)", () => {
      // For an axis-aligned square with 90° corners, each miter has cos(45°)
      // scaling. The inner and outer vertices should be equidistant from the
      // original mathematical boundary position, ensuring that the midpoint
      // of the skirt lies on the original boundary.
      const flat_coords = [0, 0, 10, 0, 10, 10, 0, 10]
      const rings = [flat_coords]
      const aa = 1.5
      const geom = generate_skirt_geometry(flat_coords, rings, SQUARE_INDICES, aa)

      for (let i = 0; i < 4; i++) {
        const orig_x = flat_coords[i * 2]
        const orig_y = flat_coords[i * 2 + 1]

        const inner_x = geom.positions[i * 2]
        const inner_y = geom.positions[i * 2 + 1]

        const outer_x = geom.positions[(4 + i) * 2]
        const outer_y = geom.positions[(4 + i) * 2 + 1]

        // Midpoint of inner and outer should equal the original boundary position
        const mid_x = (inner_x + outer_x) / 2
        const mid_y = (inner_y + outer_y) / 2
        expect(mid_x).to.be.similar(orig_x, 0.001)
        expect(mid_y).to.be.similar(orig_y, 0.001)
      }
    })

    it("should handle collinear edges correctly", () => {
      // Three collinear points form a degenerate polygon
      // earcut produces 0 triangles for collinear points
      const flat_coords = [0, 0, 5, 0, 10, 0]
      const rings = [flat_coords]
      const tri_indices: number[] = []
      const geom = generate_skirt_geometry(flat_coords, rings, tri_indices, 1.5)

      // With 0 earcut triangles and < 3 original vertices check is n_original < 3,
      // but we have 3 original vertices with 0 earcut tris, so the early exit applies
      expect(geom.nvertices).to.be.equal(3)
      expect(geom.ntriangles).to.be.equal(0)

      // All edge_distance values should be finite
      for (let i = 0; i < geom.edge_distance.length; i++) {
        expect(isFinite(geom.edge_distance[i])).to.be.equal(true)
      }

      // All positions should be finite
      for (let i = 0; i < geom.positions.length; i++) {
        expect(isFinite(geom.positions[i])).to.be.equal(true)
      }
    })

    it("should handle fewer than 3 vertices gracefully", () => {
      // 2 vertices -> earcut produces 0 triangles
      const flat_coords = [0, 0, 10, 0]
      const rings = [flat_coords]
      const tri_indices: number[] = []
      const geom = generate_skirt_geometry(flat_coords, rings, tri_indices, 1.5)

      expect(geom.nvertices).to.be.equal(2)
      expect(geom.ntriangles).to.be.equal(0)
    })

    it("should use custom antialias_width", () => {
      const flat_coords = [0, 0, 10, 0, 0, 10]
      const rings = [flat_coords]
      const geom = generate_skirt_geometry(flat_coords, rings, TRIANGLE_INDICES, 3.0)

      // Original vertices should have edge_distance = 3.0
      for (let i = 0; i < 3; i++) {
        expect(geom.edge_distance[i]).to.be.equal(3.0)
      }
      // Skirt vertices should have edge_distance = 0
      for (let i = 3; i < 6; i++) {
        expect(geom.edge_distance[i]).to.be.equal(0)
      }
    })
  })
})
