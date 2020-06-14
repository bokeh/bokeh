import proj4 from "proj4/lib/core"
import Projection from "proj4/lib/Proj"

import {LatLon} from "../enums"
import {Arrayable, NumberArray} from "../types"

const mercator = new Projection('GOOGLE')
const wgs84    = new Projection('WGS84')

export const wgs84_mercator = proj4(wgs84, mercator)

const mercator_bounds = {
  lon: [-20026376.39, 20026376.39],
  lat: [-20048966.10, 20048966.10],
}

const latlon_bounds = {
  lon: [-180, 180],
  lat: [-85.06, 85.06],
}

const {min, max} = Math

export function clip_mercator(low: number, high: number, dimension: LatLon): [number, number] {
  const [vmin, vmax] = mercator_bounds[dimension]
  return [max(low, vmin), min(high, vmax)]
}

export function in_bounds(value: number, dimension: LatLon): boolean {
  const [min, max] = latlon_bounds[dimension]
  return min < value && value < max
}

export function project_xy(x: Arrayable<number>, y: Arrayable<number>): [NumberArray, NumberArray] {
  const n = min(x.length, y.length)
  const merc_x_s = new NumberArray(n)
  const merc_y_s = new NumberArray(n)
  for (let i = 0; i < n; i++) {
    const [merc_x, merc_y] = wgs84_mercator.forward([x[i], y[i]])
    merc_x_s[i] = merc_x
    merc_y_s[i] = merc_y
  }
  return [merc_x_s, merc_y_s]
}

export function project_xsys(xs: Arrayable<number>[], ys: Arrayable<number>[]): [NumberArray[], NumberArray[]] {
  const n = min(xs.length, ys.length)
  const merc_xs_s: NumberArray[] = new Array(n)
  const merc_ys_s: NumberArray[] = new Array(n)
  for (let i = 0; i < n; i++) {
    const [merc_x_s, merc_y_s] = project_xy(xs[i], ys[i])
    merc_xs_s[i] = merc_x_s
    merc_ys_s[i] = merc_y_s
  }
  return [merc_xs_s, merc_ys_s]
}
