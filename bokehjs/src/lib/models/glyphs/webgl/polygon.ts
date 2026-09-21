import {libtess} from "./tessellator"
import earcut from "earcut"

import type {SkirtGeometry} from "core/util/polygon"
import {generate_skirt_geometry, POLYGON_AA_WIDTH} from "core/util/polygon"
import {logger} from "core/logging"

type CombinedVertex = {
  sources: number[]
  weights: number[]
}

type PolygonGroup = {
  rings: number[][]
  vertices: number[]
  tri_indices: number[]
  canonical_orientation: boolean
}

export function coordinates(indices: number[], coords: number[]): number[] {
  const ring = new Array<number>(2*indices.length)
  for (let i = 0; i < indices.length; i++) {
    ring[2*i] = coords[2*indices[i]]
    ring[2*i + 1] = coords[2*indices[i] + 1]
  }
  return ring
}

export function* subdivide_contour(indices: number[]): Generator<number[]> {
  // Long initial faces cause quadratic relabeling in the tessellator. Split
  // them into short arcs and a contour through the arc endpoints. Every added
  // chord occurs twice in opposite directions, preserving the original winding.
  const max_vertices = 128
  while (indices.length > max_vertices) {
    const backbone = [indices[0]]
    for (let start = 0; start < indices.length - 1; start += max_vertices - 1) {
      const end = Math.min(start + max_vertices - 1, indices.length - 1)
      const arc = indices.slice(start, end + 1)
      if (arc.length >= 3) {
        yield arc
      }
      backbone.push(indices[end])
    }
    indices = backbone
  }
  yield indices
}

function orientation(a: number, b: number, c: number, ring: number[]): number {
  const abx = ring[2*b] - ring[2*a]
  const aby = ring[2*b + 1] - ring[2*a + 1]
  const acx = ring[2*c] - ring[2*a]
  const acy = ring[2*c + 1] - ring[2*a + 1]
  const cross = abx*acy - aby*acx
  const error = 8*Number.EPSILON*(Math.abs(abx*acy) + Math.abs(aby*acx))
  return Math.abs(cross) <= error ? 0 : Math.sign(cross)
}

function on_segment(a: number, b: number, p: number, ring: number[]): boolean {
  const x = ring[2*p], y = ring[2*p + 1]
  return x >= Math.min(ring[2*a], ring[2*b]) && x <= Math.max(ring[2*a], ring[2*b]) &&
    y >= Math.min(ring[2*a + 1], ring[2*b + 1]) && y <= Math.max(ring[2*a + 1], ring[2*b + 1])
}

function segments_intersect(a: number, b: number, c: number, d: number, ring: number[]): boolean {
  const abc = orientation(a, b, c, ring)
  const abd = orientation(a, b, d, ring)
  const cda = orientation(c, d, a, ring)
  const cdb = orientation(c, d, b, ring)
  if (abc*abd < 0 && cda*cdb < 0) {
    return true
  }
  return abc == 0 && on_segment(a, b, c, ring) || abd == 0 && on_segment(a, b, d, ring) ||
    cda == 0 && on_segment(c, d, a, ring) || cdb == 0 && on_segment(c, d, b, ring)
}

/** Return source indices when a small ring is simple enough to triangulate directly. */
export function simple_ring_indices(ring: number[]): number[] | null {
  const max_vertices = 4096
  const indices: number[] = []
  for (let i = 0; i < ring.length / 2; i++) {
    const previous = indices.at(-1)
    if (previous == null || ring[2*i] != ring[2*previous] || ring[2*i + 1] != ring[2*previous + 1]) {
      indices.push(i)
    }
  }
  if (indices.length > 1) {
    const first = indices[0], last = indices.at(-1)!
    if (ring[2*first] == ring[2*last] && ring[2*first + 1] == ring[2*last + 1]) {
      indices.pop()
    }
  }
  if (indices.length < 3 || indices.length > max_vertices) {
    return null
  }

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const index of indices) {
    const x = ring[2*index], y = ring[2*index + 1]
    if (!isFinite(x + y) || Math.abs(x) > 1e150 || Math.abs(y) > 1e150) {
      return null
    }
    x0 = Math.min(x0, x)
    y0 = Math.min(y0, y)
    x1 = Math.max(x1, x)
    y1 = Math.max(y1, y)
  }
  if (x0 == x1 || y0 == y1) {
    return null
  }

  for (let i = 0; i < indices.length; i++) {
    const previous = indices[(i + indices.length - 1) % indices.length]
    const current = indices[i]
    const next = indices[(i + 1) % indices.length]
    if (orientation(previous, current, next, ring) == 0) {
      const ax = ring[2*previous] - ring[2*current]
      const ay = ring[2*previous + 1] - ring[2*current + 1]
      const bx = ring[2*next] - ring[2*current]
      const by = ring[2*next + 1] - ring[2*current + 1]
      if (ax*bx + ay*by > 0) {
        return null
      }
    }
  }

  // A conservative uniform grid avoids comparing every pair of edges. Every
  // segment is entered into each cell touched by its bounding box, so crossing
  // segments are always tested together; false positives only select the
  // robust tessellation path.
  const grid_size = Math.ceil(Math.sqrt(indices.length))
  const cells = Array.from({length: grid_size*grid_size}, () => new Array<number>())
  const checked = new Int32Array(indices.length)
  const cell_index = (value: number, low: number, high: number) =>
    Math.min(grid_size - 1, Math.floor(grid_size*(value - low)/(high - low)))
  for (let i = 0; i < indices.length; i++) {
    const i1 = (i + 1) % indices.length
    const a = indices[i], b = indices[i1]
    const ix0 = cell_index(Math.min(ring[2*a], ring[2*b]), x0, x1)
    const ix1 = cell_index(Math.max(ring[2*a], ring[2*b]), x0, x1)
    const iy0 = cell_index(Math.min(ring[2*a + 1], ring[2*b + 1]), y0, y1)
    const iy1 = cell_index(Math.max(ring[2*a + 1], ring[2*b + 1]), y0, y1)
    for (let iy = iy0; iy <= iy1; iy++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const cell = cells[iy*grid_size + ix]
        for (const j of cell) {
          if (checked[j] == i + 1) {
            continue
          }
          checked[j] = i + 1
          const j1 = (j + 1) % indices.length
          if (j1 != i && i1 != j && segments_intersect(a, b, indices[j], indices[j1], ring)) {
            return null
          }
        }
        cell.push(i)
      }
    }
  }
  return indices
}

export function is_affine_remap(source: number[], mapped: number[]): boolean {
  if (source.length != mapped.length) {
    return false
  }
  for (const offset of [0, 1]) {
    if (source.length <= offset) {
      continue
    }
    const first = offset
    let second = offset + 2
    while (second < source.length && source[second] == source[first]) {
      second += 2
    }
    if (second >= source.length) {
      for (let i = offset + 2; i < mapped.length; i += 2) {
        if (mapped[i] != mapped[first]) {
          return false
        }
      }
      continue
    }
    const scale = (mapped[second] - mapped[first])/(source[second] - source[first])
    const shift = mapped[first] - scale*source[first]
    for (let i = offset; i < source.length; i += 2) {
      const expected = scale*source[i] + shift
      // Screen coordinates are stored as float32, so an affine remap can pick
      // up rounding at both the source and destination mapping stages.
      const tolerance = 1e-6*Math.max(1, Math.abs(expected), Math.abs(mapped[i]))
      if (Math.abs(expected - mapped[i]) > tolerance) {
        return false
      }
    }
  }
  return true
}

/** Resolve an even-odd polygon into simple boundaries and cache its triangulation.
 *  Source vertex indices and intersection weights allow the same topology to be
 *  reused under affine screen mappings, including reversed axes. */
export class PolygonTopology {
  private readonly _ring_lengths: number[]
  private readonly _source_coords: number[]
  private readonly _combined: CombinedVertex[] = []
  private readonly _groups: PolygonGroup[]

  constructor(rings: number[][]) {
    this._ring_lengths = rings.map((ring) => ring.length)
    const coords = rings.flat()
    this._source_coords = coords.slice()
    const boundaries: number[][] = []
    let boundary: number[]

    const {gluEnum, windingRule} = libtess
    const combine = ([x, y]: [number, number, number], data: (number | null)[], weights: number[]) => {
      const sources: number[] = []
      const source_weights: number[] = []
      for (let i = 0; i < data.length; i++) {
        const source = data[i]
        if (source != null && weights[i] != 0) {
          sources.push(source)
          source_weights.push(weights[i])
        }
      }
      // A source can itself be an intersection generated earlier in the sweep.
      // Keep this dependency graph instead of recursively expanding its weights.
      this._combined.push({sources, weights: source_weights})
      const index = coords.length / 2
      coords.push(x, y)
      return index
    }
    const tesselator = () => {
      const tess = new libtess.GluTesselator<number>()
      // A fixed normal handles rings whose signed area cancels, such as a
      // symmetric bow-tie, and gives resolved boundaries a known orientation.
      tess.gluTessNormal(0, 0, 1)
      tess.gluTessProperty(gluEnum.GLU_TESS_WINDING_RULE, windingRule.GLU_TESS_WINDING_ODD)
      tess.gluTessCallback(gluEnum.GLU_TESS_COMBINE, combine)
      tess.gluTessCallback(gluEnum.GLU_TESS_ERROR, (code) => {
        throw new Error(`Polygon tessellation failed (${code})`)
      })
      return tess
    }
    const triangulate_boundaries = (resolved_rings: number[][], canonical_orientation: boolean): PolygonGroup => {
      const vertices = resolved_rings.flat()
      const indices = new Map(vertices.map((index, i) => [index, i]))
      const tri_indices: number[] = []
      const fill_tess = tesselator()
      // The edge-flag callback forces individual triangles rather than strips
      // or fans. Resolved boundaries may still touch, requiring tessellation
      // that supports these weakly simple polygons.
      fill_tess.gluTessCallback(gluEnum.GLU_TESS_EDGE_FLAG, () => {})
      fill_tess.gluTessCallback(gluEnum.GLU_TESS_VERTEX, (index) => {
        let local_index = indices.get(index)
        if (local_index == null) {
          local_index = vertices.length
          vertices.push(index)
          indices.set(index, local_index)
        }
        tri_indices.push(local_index)
      })
      fill_tess.gluTessBeginPolygon()
      for (const ring of resolved_rings) {
        fill_tess.gluTessBeginContour()
        for (const index of ring) {
          fill_tess.gluTessVertex([coords[2*index], coords[2*index + 1], 0], index)
        }
        fill_tess.gluTessEndContour()
      }
      fill_tess.gluTessEndPolygon()
      return {rings: resolved_rings, vertices, tri_indices, canonical_orientation}
    }

    // Most Patches datasets contain many modest, non-self-intersecting rings.
    // Checking those rings directly avoids the boundary-resolution sweep while
    // retaining the robust path for crossings, overlaps, and large contours.
    if (rings.length == 1) {
      const indices = simple_ring_indices(rings[0])
      if (indices != null) {
        const tri_indices = earcut(coordinates(indices, coords))
        this._groups = [{rings: [indices], vertices: indices, tri_indices, canonical_orientation: false}]
        return
      }
    }

    const tess = tesselator()
    // Boundary-only output removes crossings and coincident edges before both
    // triangulation and AA skirt generation.
    tess.gluTessProperty(gluEnum.GLU_TESS_BOUNDARY_ONLY, true)
    tess.gluTessCallback(gluEnum.GLU_TESS_BEGIN, () => {
      boundaries.push(boundary = [])
    })
    tess.gluTessCallback(gluEnum.GLU_TESS_VERTEX, (index) => boundary.push(index))

    tess.gluTessBeginPolygon()
    let offset = 0
    for (const ring of rings) {
      if (ring.length >= 6) {
        const indices = Array.from({length: ring.length / 2}, (_, i) => offset + i)
        for (const contour of subdivide_contour(indices)) {
          tess.gluTessBeginContour()
          for (const index of contour) {
            tess.gluTessVertex([coords[2*index], coords[2*index + 1], 0], index)
          }
          tess.gluTessEndContour()
        }
      }
      offset += ring.length / 2
    }
    tess.gluTessEndPolygon()

    if (boundaries.length == 0) {
      this._groups = []
      return
    }

    // The boundary pass gives every contour a canonical orientation with the
    // filled region on its left. Tessellate all resolved boundaries together;
    // libtess applies the even-odd rule directly to holes, nested islands, and
    // disjoint parts without a separate containment classification.
    this._groups = [triangulate_boundaries(boundaries, true)]
  }

  // Check mapped ring structure; callers invalidate separately on data changes.
  matches(rings: number[][]): boolean {
    return rings.length == this._ring_lengths.length &&
      rings.every((ring, i) => ring.length == this._ring_lengths[i]) &&
      is_affine_remap(this._source_coords, rings.flat())
  }

  geometries(rings: number[][], antialias_width: number = POLYGON_AA_WIDTH): SkirtGeometry[] {
    const coords = rings.flat()
    for (const {sources, weights} of this._combined) {
      let x = 0
      let y = 0
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i]
        x += weights[i] * coords[2*source]
        y += weights[i] * coords[2*source + 1]
      }
      coords.push(x, y)
    }
    return this._groups.map(({rings: boundaries, vertices, tri_indices, canonical_orientation}) => {
      const group_rings = boundaries.map((indices) => coordinates(indices, coords))
      const flat_coords = boundaries.length == 1 && vertices === boundaries[0] ?
        group_rings[0] : coordinates(vertices, coords)
      const boundary_vertices = boundaries.reduce((count, ring) => count + ring.length, 0)
      // A second sweep may merge coincident boundary vertices or create more
      // intersections. Keep their fill positions and boundary positions aligned
      // when adding the AA fringe.
      const preserve_vertices = vertices.length > boundary_vertices
      return generate_skirt_geometry(
        flat_coords, group_rings, tri_indices, antialias_width, preserve_vertices, canonical_orientation,
      )
    })
  }
}

let warned_tessellation_error = false

/** Construct polygon topology without allowing invalid geometry to abort a plot render. */
export function try_create_polygon_topology(rings: number[][]): PolygonTopology | null {
  try {
    return new PolygonTopology(rings)
  } catch (error) {
    if (!warned_tessellation_error) {
      warned_tessellation_error = true
      logger.warn("unable to tessellate a WebGL polygon fill; rendering its outline only", error)
    }
    return null
  }
}
