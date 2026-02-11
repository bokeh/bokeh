// Shared utilities for Patch and Patches WebGL glyph rendering.

import type {Arrayable} from "core/types"

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
