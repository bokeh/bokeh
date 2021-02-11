import {gcd, is_pow_2} from "./utils/math"
import {Regl, Texture2D} from "regl"


/*
 * DashCache creates and stores webgl resources for dashes that can be reused
 * for different webgl lines.  Dash represented by pattern which is a list of
 * an even number of integers.
 */
export class DashCache {
  private _regl: Regl  // Needed to create textures.
  private _map: Map<string, [[number, number, number], Texture2D]>

  constructor(regl: Regl) {
    this._regl = regl
    this._map = new Map<string, [[number, number, number], Texture2D]>()
  }

  protected _create_texture(pattern: number[]): [number, number, Texture2D] {
    /*
     * Texture used to represent dash pattern is a distance function.  Each tex
     * value is the distance to the nearest edge between a dash and a gap; -ve
     * if in a dash and +ve if in a gap.  If this was an analytical function
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
     */
    const n = pattern.length        // Number of items in pattern.
    let len = 0                     // Length of pattern.
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
    const length_pow_2 = is_pow_2(ideal_ntex);
    const ntex = length_pow_2 ? ideal_ntex : 128

    // Distance between texture values.
    const dtex = 0.5*twice_jumps_gcd * ideal_ntex/ntex

    // xstart is the position along the texture of the first value, and offset
    // is the distance to the upstroke of the first dash.
    // When interpolating the texture each texel fills 1/ntex of the length of
    // the texture.  For a single dash the centre of the dash is 0.25 along
    // the texture, so the upstroke offset has to be determined from this.
    let xstart;
    if (length_pow_2) {
      xstart = 0.5*pattern[0]

      if (dtex < xstart) {
        const n_dtex = Math.floor(xstart / dtex)
        xstart -= n_dtex*dtex
      }
    }
    else {
      // Have lots of values so don't need to match middles of dashes/gaps.
      xstart = 0.0;
    }
    let offset = xstart - 0.5*dtex

    // Calculate values for texture.
    let y = new Float32Array(ntex)
    let dash_index = 0
    for (let i = 0; i < ntex; i++) {
      const x = xstart + i*dtex  // Distance along texture.

      // Which dash are we in?
      if (x > starts_and_ends[dash_index + 1])
        dash_index++

      const xsize = pattern[dash_index]
      const xmid = starts_and_ends[dash_index] + 0.5*xsize
      y[i] = 0.5*xsize - Math.abs(x - xmid)
      if (dash_index % 2 == 1)
        y[i] = -y[i]  // Change sign for gaps between dashes.
    }

    // Create the 1D texture.
    const tex: Texture2D = this._regl.texture({
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

  public _get_or_create(pattern: number[]): [[number,number,number], Texture2D] {
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

  public get(pattern: number[]): [[number,number,number], Texture2D] {
    // Limit pattern to even number of items.
    if (pattern.length % 2 == 1)
      pattern = pattern.slice(0, -1)

    return this._get_or_create(pattern)
  }
}
