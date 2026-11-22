import {libtess} from "./tessellator"
import type {Mesh, MeshHalfEdge} from "libtess/libtess.cat.js"
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
  preserve_vertices: boolean
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
    // Most Patches datasets contain many modest, non-self-intersecting rings.
    // Checking those rings directly avoids the boundary-resolution sweep while
    // retaining the robust path for crossings, overlaps, and large contours.
    if (rings.length == 1) {
      const indices = simple_ring_indices(rings[0])
      if (indices != null) {
        const tri_indices = earcut(coordinates(indices, coords))
        this._groups = [{
          rings: [indices], vertices: indices, tri_indices, canonical_orientation: false, preserve_vertices: false,
        }]
        return
      }
    }

    const tess = tesselator()
    const groups: PolygonGroup[] = []
    // The mesh callback runs after libtess has triangulated the interior and
    // discarded exterior faces. Read both products from that single mesh so
    // complex polygons don't need a second tessellation pass for their fill.
    tess.gluTessCallback(gluEnum.GLU_TESS_MESH, (mesh: Mesh<number>) => {
      const boundaries: number[][] = []
      const visited = new Set<MeshHalfEdge<number>>()
      for (let face = mesh.fHead.next; face !== mesh.fHead; face = face.next) {
        let edge = face.anEdge
        do {
          if (edge.sym.lFace == null && !visited.has(edge)) {
            const start = edge
            const boundary: number[] = []
            let current = start
            do {
              visited.add(current)
              boundary.push(current.org.data)
              // Cross adjacent interior triangles around the destination until
              // the next edge with the filled region on its left is reached.
              current = current.lNext
              while (current.sym.lFace != null) {
                current = current.sym.lNext
              }
            } while (current !== start)
            boundaries.push(boundary)
          }
          edge = edge.lNext
        } while (edge !== face.anEdge)
      }

      const vertices = boundaries.flat()
      const preserve_vertices = new Set(vertices).size < vertices.length
      const vertex_indices = new Map(vertices.map((index, i) => [index, i]))
      const local_index = (index: number) => {
        let local = vertex_indices.get(index)
        if (local == null) {
          local = vertices.length
          vertices.push(index)
          vertex_indices.set(index, local)
        }
        return local
      }
      const tri_indices: number[] = []
      for (let face = mesh.fHead.next; face !== mesh.fHead; face = face.next) {
        let edge = face.anEdge
        do {
          tri_indices.push(local_index(edge.org.data))
          edge = edge.lNext
        } while (edge !== face.anEdge)
      }
      if (tri_indices.length != 0) {
        groups.push({rings: boundaries, vertices, tri_indices, canonical_orientation: true, preserve_vertices})
      }
    })

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

    this._groups = groups
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
    return this._groups.map(({rings: boundaries, vertices, tri_indices, canonical_orientation, preserve_vertices}) => {
      const group_rings = boundaries.map((indices) => coordinates(indices, coords))
      const flat_coords = boundaries.length == 1 && vertices === boundaries[0] ?
        group_rings[0] : coordinates(vertices, coords)
      const boundary_vertices = boundaries.reduce((count, ring) => count + ring.length, 0)
      // Shared boundary occurrences and fill-only mesh vertices must keep their
      // triangulated positions when the AA fringe is added.
      preserve_vertices ||= vertices.length > boundary_vertices
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
