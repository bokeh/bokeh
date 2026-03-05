// Shared utilities for polygon rendering (Patch, Patches glyphs).

import type {Arrayable} from "core/types"

/** Width of the anti-aliasing skirt in CSS pixels. Must match the
 *  `antialias` uniform passed to the polygon shader so that the
 *  smoothstep fade range equals the skirt geometry extent. */
export const POLYGON_AA_WIDTH = 0.75

/** Split x/y coordinate arrays on NaN values into rings (sub-paths).
 *  Each ring is a flat array of interleaved [x0, y0, x1, y1, ...] values.
 *  The first ring is the outer boundary; subsequent rings are holes. */
export function split_rings(sx: Arrayable<number>, sy: Arrayable<number>): number[][] {
  const n = Math.min(sx.length, sy.length)
  const rings: number[][] = []
  let current_ring: number[] = []

  for (let i = 0; i < n; i++) {
    const x = sx[i]
    const y = sy[i]
    if (!isFinite(x + y)) {
      if (current_ring.length > 0) {
        rings.push(current_ring)
        current_ring = []
      }
    } else {
      current_ring.push(x, y)
    }
  }
  if (current_ring.length > 0) {
    rings.push(current_ring)
  }

  return rings
}

export type SkirtGeometry = {
  positions: Float32Array      // [x,y,...] for original + skirt vertices
  edge_distance: Float32Array  // 1 float per vertex
  indices: Uint32Array         // earcut + skirt triangle indices
  nvertices: number
  ntriangles: number
}

/** Compute the signed area of a ring (shoelace formula).
 *  Positive for counter-clockwise, negative for clockwise. */
function signed_area_2(ring: number[]): number {
  const n = ring.length / 2
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += ring[i * 2] * ring[j * 2 + 1] - ring[j * 2] * ring[i * 2 + 1]
  }
  return area
}

/** Generate expanded geometry with an anti-aliasing skirt around polygon boundaries.
 *
 *  The skirt approach adds a thin fringe of extra triangles around each polygon
 *  boundary edge. Interior (earcut) vertices get `edge_distance = antialias_width`
 *  (fully opaque). Skirt outer vertices get `edge_distance = 0.0` (fully
 *  transparent). The GPU linearly interpolates across the skirt, producing a
 *  smooth alpha gradient for anti-aliased polygon edges.
 *
 *  @param flat_coords      Interleaved [x0,y0,...] screen-pixel coordinates.
 *  @param rings            Ring arrays as returned by {@link split_rings}.
 *  @param tri_indices      Earcut triangle indices into flat_coords.
 *  @param antialias_width  Width of the AA skirt in CSS pixels.
 *  @returns SkirtGeometry with combined positions, edge distances, and indices.
 */
export function generate_skirt_geometry(
  flat_coords: ArrayLike<number>,
  rings: number[][],
  tri_indices: ArrayLike<number>,
  antialias_width: number,
): SkirtGeometry {
  const n_original = flat_coords.length / 2
  const n_earcut_tris = tri_indices.length / 3

  if (n_original < 3 || n_earcut_tris == 0) {
    return {
      positions: new Float32Array(flat_coords.length),
      edge_distance: new Float32Array(n_original).fill(antialias_width),
      indices: new Uint32Array(tri_indices),
      nvertices: n_original,
      ntriangles: n_earcut_tris,
    }
  }

  // Count boundary vertices (= boundary edges) across all rings
  let n_boundary = 0
  for (const ring of rings) {
    n_boundary += ring.length / 2
  }

  const n_total_verts = n_original + n_boundary
  const n_skirt_tris = 2 * n_boundary
  const n_total_tris = n_earcut_tris + n_skirt_tris

  const positions = new Float32Array(n_total_verts * 2)
  const edge_distance = new Float32Array(n_total_verts)
  const indices = new Uint32Array(n_total_tris * 3)

  // 1. Copy original vertices, set edge_distance = antialias_width
  for (let i = 0; i < flat_coords.length; i++) {
    positions[i] = flat_coords[i]
  }
  edge_distance.fill(antialias_width, 0, n_original)

  // 2. Copy earcut indices
  for (let i = 0; i < tri_indices.length; i++) {
    indices[i] = tri_indices[i]
  }

  // 3. Generate skirt vertices and triangles
  let skirt_vert_idx = n_original
  let skirt_tri_idx = n_earcut_tris * 3
  let ring_offset = 0  // global vertex index offset for current ring

  for (let ring_idx = 0; ring_idx < rings.length; ring_idx++) {
    const ring = rings[ring_idx]
    const npts = ring.length / 2

    if (npts < 2) {
      ring_offset += npts
      continue
    }

    // Determine normal direction based on ring role:
    // Ring 0 (outer): expand outward
    // Ring 1+ (holes): expand into the hole
    const area = signed_area_2(ring)
    // For CCW (positive area) outer ring, right-hand perpendicular points outward
    // For holes, we flip
    const normal_sign = ring_idx == 0 ? Math.sign(area) : -Math.sign(area)

    // If area is zero (degenerate ring), skip skirt for this ring
    if (normal_sign == 0) {
      // Still create degenerate skirt vertices at the same position
      for (let i = 0; i < npts; i++) {
        const vx = flat_coords[(ring_offset + i) * 2]
        const vy = flat_coords[(ring_offset + i) * 2 + 1]
        positions[skirt_vert_idx * 2] = vx
        positions[skirt_vert_idx * 2 + 1] = vy
        edge_distance[skirt_vert_idx] = 0

        // Still emit skirt triangles (they'll be degenerate/zero-area)
        const a_inner = ring_offset + i
        const b_inner = ring_offset + (i + 1) % npts
        const skirt_base = skirt_vert_idx - i  // base of this ring's skirt vertices
        const a_out = skirt_base + i
        const b_out = skirt_base + (i + 1) % npts

        indices[skirt_tri_idx++] = a_inner
        indices[skirt_tri_idx++] = b_inner
        indices[skirt_tri_idx++] = b_out

        indices[skirt_tri_idx++] = a_inner
        indices[skirt_tri_idx++] = b_out
        indices[skirt_tri_idx++] = a_out

        skirt_vert_idx++
      }
      ring_offset += npts
      continue
    }

    // Compute per-edge outward normals
    const normals = new Float64Array(npts * 2)
    for (let i = 0; i < npts; i++) {
      const j = (i + 1) % npts
      const ex = ring[j * 2] - ring[i * 2]
      const ey = ring[j * 2 + 1] - ring[i * 2 + 1]
      const len = Math.sqrt(ex * ex + ey * ey)
      if (len < 1e-10) {
        // Zero-length edge: normal will be zero, handled below
        normals[i * 2] = 0
        normals[i * 2 + 1] = 0
      } else {
        // Right-hand perpendicular: (ey, -ex) for CCW, then multiply by normal_sign
        normals[i * 2] = normal_sign * ey / len
        normals[i * 2 + 1] = normal_sign * (-ex) / len
      }
    }

    // Record the base index for this ring's skirt vertices
    const skirt_base = skirt_vert_idx

    // Clamp the inward shift so that it doesn't collapse small or narrow
    // polygons.  We use the approximate "inradius" (area / perimeter) to
    // estimate how far inward we can safely shift without inverting the
    // earcut triangulation.  The inward shift is limited to at most 25% of
    // the inradius so the polygon retains most of its original shape.
    let perimeter = 0
    for (let i = 0; i < npts; i++) {
      const j = (i + 1) % npts
      const ex = ring[j * 2] - ring[i * 2]
      const ey = ring[j * 2 + 1] - ring[i * 2 + 1]
      perimeter += Math.sqrt(ex * ex + ey * ey)
    }
    const abs_area = Math.abs(area)
    const inradius = perimeter > 0 ? abs_area / perimeter : 0
    const half_aa = Math.min(0.5 * antialias_width, 0.25 * inradius)

    // Compute miter direction and offset for straddling AA.
    // Original boundary vertices are shifted inward by half the AA width;
    // skirt vertices are placed outward by half the AA width from the
    // original mathematical boundary.  The total skirt width is unchanged,
    // but it now straddles the boundary so that the mathematical edge sits
    // at the midpoint of the fade, matching canvas 2D AA behavior.
    for (let i = 0; i < npts; i++) {
      const prev_edge = (i - 1 + npts) % npts
      const curr_edge = i

      const n0x = normals[prev_edge * 2]
      const n0y = normals[prev_edge * 2 + 1]
      const n1x = normals[curr_edge * 2]
      const n1y = normals[curr_edge * 2 + 1]

      const n0_zero = (n0x == 0 && n0y == 0)
      const n1_zero = (n1x == 0 && n1y == 0)

      // Compute unit miter direction (dx, dy) and inverse-cosine scale
      let dx: number, dy: number, inv_cos: number
      if (n0_zero && n1_zero) {
        dx = 0
        dy = 0
        inv_cos = 1
      } else if (n0_zero) {
        dx = n1x
        dy = n1y
        inv_cos = 1
      } else if (n1_zero) {
        dx = n0x
        dy = n0y
        inv_cos = 1
      } else {
        let bx = n0x + n1x
        let by = n0y + n1y
        const blen = Math.sqrt(bx * bx + by * by)
        if (blen < 1e-10) {
          // Normals point in opposite directions (180° turn)
          dx = n0x
          dy = n0y
          inv_cos = 1
        } else {
          bx /= blen
          by /= blen
          const cos_half = bx * n0x + by * n0y
          const clamped_cos = Math.max(cos_half, 0.1)
          inv_cos = 1.0 / clamped_cos
          dx = bx
          dy = by
        }
      }

      const offset = half_aa * inv_cos
      const vx = flat_coords[(ring_offset + i) * 2]
      const vy = flat_coords[(ring_offset + i) * 2 + 1]

      // Shift original boundary vertex inward (subtract miter direction)
      positions[(ring_offset + i) * 2] = vx - dx * offset
      positions[(ring_offset + i) * 2 + 1] = vy - dy * offset

      // Place skirt vertex outward from original position (add miter direction)
      positions[skirt_vert_idx * 2] = vx + dx * offset
      positions[skirt_vert_idx * 2 + 1] = vy + dy * offset
      edge_distance[skirt_vert_idx] = 0

      skirt_vert_idx++
    }

    // Emit skirt triangles for each boundary edge
    for (let i = 0; i < npts; i++) {
      const j = (i + 1) % npts
      const a_inner = ring_offset + i
      const b_inner = ring_offset + j
      const a_outer = skirt_base + i
      const b_outer = skirt_base + j

      // Two triangles per edge: (A_inner, B_inner, B_outer) and (A_inner, B_outer, A_outer)
      indices[skirt_tri_idx++] = a_inner
      indices[skirt_tri_idx++] = b_inner
      indices[skirt_tri_idx++] = b_outer

      indices[skirt_tri_idx++] = a_inner
      indices[skirt_tri_idx++] = b_outer
      indices[skirt_tri_idx++] = a_outer
    }

    ring_offset += npts
  }

  return {
    positions,
    edge_distance,
    indices,
    nvertices: n_total_verts,
    ntriangles: n_total_tris,
  }
}

/** Test whether point (px, py) is inside a ring of interleaved [x0,y0,...] coords.
 *  Uses ray-casting algorithm. */
export function point_in_ring(px: number, py: number, ring: number[]): boolean {
  const n = ring.length / 2
  let inside = false
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2], yi = ring[i * 2 + 1]
    const xj = ring[j * 2], yj = ring[j * 2 + 1]
    if (((yi > py) != (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

export type TriangulationGroup = {
  rings: number[][]      // rings[0] = outer, rings[1+] = holes
  flat_coords: number[]
}

/** Classify split rings into triangulation groups.
 *  Each group has one outer ring and zero or more holes.
 *  Rings not contained in ring[0] become separate groups. */
export function classify_rings(rings: number[][]): TriangulationGroup[] {
  if (rings.length <= 1) {
    return [{rings, flat_coords: rings.length > 0 ? [...rings[0]] : []}]
  }

  const outer = rings[0]
  const holes: number[][] = []
  const separate: number[][] = []

  for (let i = 1; i < rings.length; i++) {
    // Test first point of ring against ring 0
    if (point_in_ring(rings[i][0], rings[i][1], outer)) {
      holes.push(rings[i])
    } else {
      separate.push(rings[i])
    }
  }

  const groups: TriangulationGroup[] = []

  // Group 0: outer ring + its holes
  const main_rings = [outer, ...holes]
  const main_flat: number[] = []
  for (const r of main_rings) {
    main_flat.push(...r)
  }
  groups.push({rings: main_rings, flat_coords: main_flat})

  // Each separate ring is its own group (no holes)
  for (const r of separate) {
    groups.push({rings: [r], flat_coords: [...r]})
  }

  return groups
}

export type RingLineData = {
  points: Float32Array  // (nline+2)*2 with guard points
  show: Uint8Array      // nline+1
  nline: number
  length_so_far: Float32Array  // nsegments (nline-1)
}

/** Build line rendering data from a flat ring [x0,y0,x1,y1,...].
 *  Produces points with guard vertices, show flags, and
 *  cumulative segment lengths (always computed so that any glyph view
 *  e.g. selection or hover can render dashed if needed). */
export function build_line_from_ring(ring: number[]): RingLineData {
  const npoints = ring.length / 2

  if (npoints < 2) {
    return {
      points: new Float32Array(0),
      show: new Uint8Array(0),
      nline: 0,
      length_so_far: new Float32Array(0),
    }
  }

  const is_closed = (npoints > 2 &&
    ring[0] == ring[(npoints - 1) * 2] &&
    ring[1] == ring[(npoints - 1) * 2 + 1])

  // For implicitly closed polygons, add a closing point to draw the final edge
  const nline = is_closed ? npoints : npoints + 1
  const points = new Float32Array((nline + 2) * 2)

  for (let i = 0; i < npoints; i++) {
    points[(i + 1) * 2] = ring[i * 2]
    points[(i + 1) * 2 + 1] = ring[i * 2 + 1]
  }

  if (!is_closed) {
    // Add closing point (repeat first vertex)
    points[(npoints + 1) * 2] = ring[0]
    points[(npoints + 1) * 2 + 1] = ring[1]
  }

  // Guard points for proper line joins at the closing vertex
  if (is_closed) {
    points[0] = points[(npoints - 1) * 2]
    points[1] = points[(npoints - 1) * 2 + 1]
    points[(nline + 1) * 2] = points[4]
    points[(nline + 1) * 2 + 1] = points[5]
  } else {
    // guard0 = last unique point (before closing vertex)
    points[0] = points[npoints * 2]
    points[1] = points[npoints * 2 + 1]
    // guard_end = second point (after closing vertex)
    points[(nline + 1) * 2] = points[4]
    points[(nline + 1) * 2 + 1] = points[5]
  }

  const show = new Uint8Array(nline + 1)
  show.fill(1)

  // Always compute length_so_far so that any glyph view (selection, hover)
  // can render dashed lines even if the main glyph is solid.
  const nsegments = nline - 1
  const length_so_far = new Float32Array(nsegments)
  let length = 0.0
  for (let i = 0; i < nsegments; i++) {
    length_so_far[i] = length
    if (show[i + 1] == 1) {
      length += Math.sqrt((points[2*i + 4] - points[2*i + 2])**2 +
                          (points[2*i + 5] - points[2*i + 3])**2)
    } else {
      length = 0.0
    }
  }

  return {points, show, nline, length_so_far}
}
