import {libtess} from "./tessellator"

import type {SkirtGeometry} from "core/util/polygon"
import {point_in_ring, generate_skirt_geometry, POLYGON_AA_WIDTH} from "core/util/polygon"

type CombinedVertex = {
  sources: number[]
  weights: number[]
}

type PolygonGroup = {
  rings: number[][]
  vertices: number[]
  tri_indices: number[]
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

export function signed_area(ring: number[]): number {
  let area = 0
  // Translate to the first vertex to avoid cancellation for small contours at
  // large screen coordinates.
  const x = ring[0], y = ring[1]
  for (let i = 2; i + 3 < ring.length; i += 2) {
    area += (ring[i] - x)*(ring[i + 3] - y) - (ring[i + 2] - x)*(ring[i + 1] - y)
  }
  return area / 2
}

export function group_boundaries(rings: number[][]): number[][][] {
  // With the fixed tessellation normal, filled regions lie to the left of
  // every boundary: positive contours are outers and negative ones are holes.
  // Geometric nesting alone misclassifies contours that touch at a crossing.
  const areas = rings.map(signed_area)
  const outer_indices = rings.map((_, i) => i).filter((i) => areas[i] > 0)
  const groups = outer_indices.map((i) => [rings[i]])
  for (let i = 0; i < rings.length; i++) {
    if (areas[i] >= 0) {
      continue
    }
    const hole = rings[i]
    // Edge interiors avoid ambiguous containment at shared boundary vertices.
    // Coincident boundary edges have already been removed by the tessellator.
    let end = 2
    while (hole[end] == hole[0] && hole[end + 1] == hole[1]) {
      end += 2
    }
    const x = (hole[0] + hole[end]) / 2
    const y = (hole[1] + hole[end + 1]) / 2
    let parent = -1
    let parent_area = Infinity
    for (let j = 0; j < outer_indices.length; j++) {
      const index = outer_indices[j]
      if (areas[index] > -areas[i] && areas[index] < parent_area && point_in_ring(x, y, rings[index])) {
        parent = j
        parent_area = areas[index]
      }
    }
    if (parent != -1) {
      groups[parent].push(hole)
    }
  }
  return groups
}

/** Resolve an even-odd polygon into simple boundaries and cache its triangulation.
 *  Source vertex indices and intersection weights allow the same topology to be
 *  reused under affine screen mappings, including reversed axes. */
export class PolygonTopology {
  private readonly _ring_lengths: number[]
  private readonly _combined: CombinedVertex[] = []
  private readonly _groups: PolygonGroup[]

  constructor(rings: number[][]) {
    this._ring_lengths = rings.map((ring) => ring.length)
    const coords = rings.flat()
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

    const resolved = boundaries.map((indices) => coordinates(indices, coords))
    const vertex_indices = new Map(resolved.map((ring, i) => [ring, boundaries[i]]))
    this._groups = group_boundaries(resolved).map((group_rings) => {
      const rings = group_rings.map((ring) => vertex_indices.get(ring)!)
      const vertices = rings.flat()
      const indices = new Map(vertices.map((index, i) => [index, i]))
      const tri_indices: number[] = []
      const tess = tesselator()
      // The edge-flag callback forces individual triangles rather than strips
      // or fans. Resolved boundaries may still touch, requiring tessellation
      // that supports these weakly simple polygons.
      tess.gluTessCallback(gluEnum.GLU_TESS_EDGE_FLAG, () => {})
      tess.gluTessCallback(gluEnum.GLU_TESS_VERTEX, (index) => {
        let local_index = indices.get(index)
        if (local_index == null) {
          local_index = vertices.length
          vertices.push(index)
          indices.set(index, local_index)
        }
        tri_indices.push(local_index)
      })
      tess.gluTessBeginPolygon()
      for (const ring of rings) {
        tess.gluTessBeginContour()
        for (const index of ring) {
          tess.gluTessVertex([coords[2*index], coords[2*index + 1], 0], index)
        }
        tess.gluTessEndContour()
      }
      tess.gluTessEndPolygon()
      return {rings, vertices, tri_indices}
    })
  }

  // Check mapped ring structure; callers invalidate separately on data changes.
  matches(rings: number[][]): boolean {
    return rings.length == this._ring_lengths.length &&
      rings.every((ring, i) => ring.length == this._ring_lengths[i])
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
    return this._groups.map(({rings: boundaries, vertices, tri_indices}) => {
      const group_rings = boundaries.map((indices) => coordinates(indices, coords))
      const boundary_vertices = boundaries.reduce((count, ring) => count + ring.length, 0)
      // A second sweep may merge coincident boundary vertices or create more
      // intersections. Keep their fill positions and boundary positions aligned
      // when adding the AA fringe.
      const preserve_vertices = vertices.length > boundary_vertices
      return generate_skirt_geometry(coordinates(vertices, coords), group_rings, tri_indices, antialias_width, preserve_vertices)
    })
  }
}
