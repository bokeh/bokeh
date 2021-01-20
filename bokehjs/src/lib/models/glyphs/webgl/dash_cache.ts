import {gcd, is_pow_2} from "./utils/math"


/*
 * DashCache creates and stores webgl resources for dashes that cam be reused
 * for different webgl lines.  Dash represented by pattern which is a list of
 * an even number of integers.
 */
export class DashCache {
  private _regl: any  // Needed to create textures.
  private _map: Map<string, [[number, number, number], any]>

  constructor(regl: any) {
    this._regl = regl
    this._map = new Map()
  }

  protected _create_texture(pattern: number[]): [number, number, any] {
    const n = pattern.length
    let len = 0  // Length of pattern.
    let twice_jumps: number[] = []  // Twice the jumps between dash middles.
    for (let i = 0; i < n; i++) {
      len += pattern[i]
      twice_jumps.push(pattern[i] + pattern[(i+1) % n])
    }

    const twice_jumps_gcd = gcd(twice_jumps)

    // Starts and ends of dashes and gaps.
    var starts_and_ends: number[] = [0]
    for (let i = 0; i < n; i++)
        starts_and_ends.push(starts_and_ends[i] + pattern[i])

    // Length of texture, webgl requires a power of 2.
    const ideal_ntex = 2*len / twice_jumps_gcd
    const ntex = is_pow_2(ideal_ntex) ? ideal_ntex : 128

    // Distance between texture values.
    const dtex = 0.5*twice_jumps_gcd * ideal_ntex/ntex

    let offset = 0.5*pattern[0]
    if (dtex < offset) {
      const n_dtex = Math.floor(offset / dtex)
      offset -= n_dtex*dtex
    }

    // Calculate values for texture.
    let y = new Float32Array(ntex)
    let dash_index = 0
    for (let i = 0; i < ntex; i++) {
      const x = offset + i*dtex  // Distance along texture.

      // Which dash are we in?
      if (x > starts_and_ends[dash_index + 1])
        dash_index++

      const xsize = pattern[dash_index]
      const xmid = starts_and_ends[dash_index] + 0.5*xsize
      y[i] = -0.5*xsize + Math.abs(x - xmid)
      if (dash_index % 2 == 1)
        y[i] = -y[i]  // Change sign for gaps between dashes.
    }

    // Create the 1D texture.
    const tex = this._regl.texture({
      shape: [ntex, 1, 1],
      data: y,
      wrapS: 'repeat',
      format: 'alpha',
      type: 'float',
      mag: 'linear',
      min: 'linear',
    })

    return [len, offset, tex]
  }

  protected _get_key(pattern: number[]): string {
    return pattern.join(",")
  }

  public _get_or_create(pattern: number[]): [[number,number,number], any] {
    const key = this._get_key(pattern)
    let cached = this._map.get(key)
    if (cached === undefined) {
      const scale: number = gcd(pattern)

      if (scale > 1) {
        for (let i = 0; i < pattern.length; i++)
          pattern[i] /= scale

        // Get the simple pattern that can be reused when scaled up.
        cached = this._get_or_create(pattern)

        // Store an entry for the requested pattern which is just the simple
        // pattern scaled-up.
        const [[len0, offset0, ], tex] = cached
        cached = [[len0, offset0, scale], tex]
        this._map.set(key, cached)
      }
      else {
        // Simple pattern with scale of 1.
        const [len, offset, tex] = this._create_texture(pattern)

        // Store the simple pattern.
        cached = [[len, offset, scale], tex]
        this._map.set(key, cached)
      }
    }

    return cached
  }

  public get(pattern: number[]): [[number,number,number], any] {
    // Limit pattern to even number of items.
    if (pattern.length % 2 == 1)
      pattern = pattern.slice(0, -1)

    return this._get_or_create(pattern)
  }
}
