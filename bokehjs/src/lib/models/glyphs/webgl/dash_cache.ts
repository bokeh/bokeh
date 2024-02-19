import {gcd, is_pow_2} from "./utils/math"
import {concat} from "core/util/array"
import {map} from "core/util/arrayable"
import type {Regl, Texture2D} from "regl"

export type DashReturn = [[number, number, number, number], Texture2D, number]
type TextureReturn = [[number, number, number, number], Texture2D]

/*
 * DashCache creates and stores webgl resources for dashes that can be reused
 * for different webgl lines.  Dash represented by pattern which is a list of
 * an even number of integers.
 */
export class DashCache {
  private _regl: Regl  // Needed to create textures.
  private _map: Map<string, DashReturn>

  constructor(regl: Regl) {
    this._regl = regl
    this._map = new Map<string, DashReturn>()
  }

  protected _create_texture(pattern: number[]): TextureReturn {
    /*
     * Texture used to represent dash pattern is a distance function.  Each tex
     * value is the distance to the nearest edge between a dash and a gap; +ve
     * if in a dash and -ve if in a gap.  If this was an analytical function
     * then it would be piecewise linear with turning points (local extremes)
     * in the middle of each dash and each gap.  Try to use the minimum texture
     * length that includes all these middle points.  For a single dash (hence
     * single gap) this is 2 values, one each in the middle of the dash and the
     * gap.
     * For rendering the texture is repeated.  WebGL only supports this for
     * texture lengths that are a power of 2, so if the ideal texture length is
     * not a power of 2 then increase it to be a large power of 2 and do not
     * bother to ensure that turning points in the distance function correspond
     * to texture value locations.
     * Finally, would like to use floating point textures for the distance.
     * However, these are often not available on mobile devices so instead scale
     * them to uint8 and convert back to floating point in fragment shader.
     */
    const n = pattern.length           // Number of items in pattern.
    let len = 0                        // Length of pattern.
    const twice_jumps: number[] = []   // Twice the jumps between dash middles.
    let dist_min = 0.0, dist_max = 0.0 // Min and max distances.
    for (let i = 0; i < n; i++) {
      len += pattern[i]
      twice_jumps.push(pattern[i] + pattern[(i+1) % n])
      if (i % 2 == 0) {
        dist_max = Math.max(dist_max, pattern[i])  // Dash.
      } else {
        dist_min = Math.min(dist_min, -pattern[i]) // Gap.
      }
    }
    dist_min *= 0.5
    dist_max *= 0.5

    const twice_jumps_gcd = gcd(twice_jumps)

    // Starts and ends of dashes and gaps.
    const starts_and_ends: number[] = [0]
    for (let i = 0; i < n; i++) {
      starts_and_ends.push(starts_and_ends[i] + pattern[i])
    }

    // Length of texture, webgl requires a power of 2.
    const ideal_ntex = 2*len / twice_jumps_gcd
    const length_pow_2 = is_pow_2(ideal_ntex)
    const ntex = length_pow_2 ? ideal_ntex : 128

    // Distance between texture values.
    const dtex = 0.5*twice_jumps_gcd * ideal_ntex/ntex

    // xstart is the position along the texture of the first value, and offset
    // is the distance to the upstroke of the first dash.
    // When interpolating the texture each texel fills 1/ntex of the length of
    // the texture.  For a single dash the centre of the dash is 0.25 along
    // the texture, so the upstroke offset has to be determined from this.
    let xstart
    if (length_pow_2) {
      xstart = 0.5*pattern[0]

      if (dtex < xstart) {
        const n_dtex = Math.floor(xstart / dtex)
        xstart -= n_dtex*dtex
      }
    } else {
      // Have lots of values so don't need to match middles of dashes/gaps.
      xstart = 0.0
    }
    const offset = xstart - 0.5*dtex

    // Calculate values for texture.
    const dist = new Uint8Array(ntex)
    let dash_index = 0
    for (let i = 0; i < ntex; i++) {
      const x = xstart + i*dtex  // Distance along texture.

      // Which dash are we in?
      if (x > starts_and_ends[dash_index + 1]) {
        dash_index++
      }

      const xsize = pattern[dash_index]
      const xmid = starts_and_ends[dash_index] + 0.5*xsize
      let dist_float = 0.5*xsize - Math.abs(x - xmid)
      if (dash_index % 2 == 1) {
        dist_float = -dist_float // Change sign for gaps between dashes.
      }

      dist[i] = Math.round(255*(dist_float-dist_min) / (dist_max-dist_min))
    }

    // Create the 1D texture.
    const tex: Texture2D = this._regl.texture({
      shape: [ntex, 1, 1],
      data: dist,
      wrapS: "repeat",
      format: "alpha",
      type: "uint8",
      mag: "linear",
      min: "linear",
    })

    return [[len, offset, dist_min, dist_max], tex]
  }

  protected _get_key(pattern: number[]): string {
    return pattern.join(",")
  }

  public _get_or_create(pattern: number[]): DashReturn {
    const key = this._get_key(pattern)
    let cached = this._map.get(key)
    if (cached == null) {
      const scale: number = gcd(pattern)

      if (scale > 1) {
        // Do not modify pattern in-place, create a new one.
        pattern = map(pattern, (n) => (n / scale))

        // Get the simple pattern that can be reused when scaled up.
        cached = this._get_or_create(pattern)

        // Store an entry for the requested pattern which is just the simple
        // pattern scaled-up.
        const [tex_info, tex, _simple_scale] = cached
        cached = [tex_info, tex, scale]
        this._map.set(key, cached)
      } else {
        // Simple pattern with scale of 1.
        const [tex_info, tex] = this._create_texture(pattern)

        // Store the simple pattern.
        cached = [tex_info, tex, scale]
        this._map.set(key, cached)
      }
    }

    return cached
  }

  public get(pattern: number[]): DashReturn {
    // Odd-length patterns are repeated to match canvas.
    if (pattern.length % 2 == 1) {
      pattern = concat([pattern, pattern])
    }

    return this._get_or_create(pattern)
  }
}
