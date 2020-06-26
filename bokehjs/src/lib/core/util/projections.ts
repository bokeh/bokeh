import proj4 from "proj4/lib/core"
import Projection from "proj4/lib/Proj"

import {LatLon} from "../enums"
import {Arrayable, NumberArray} from "../types"

const mercator = new Projection('GOOGLE')
const wgs84    = new Projection('WGS84')

const _wgs84_mercator = proj4(wgs84, mercator)

export const wgs84_mercator = {
  compute(x: number, y: number): [number, number] {
    if (isFinite(x) && isFinite(y))
      return _wgs84_mercator.forward([x, y])
    else
      return [NaN, NaN]
  },
  invert(merc_x: number, merc_y: number): [number, number] {
    if (isFinite(merc_x) && isFinite(merc_y))
      return _wgs84_mercator.inverse([merc_x, merc_y])
    else
      return [NaN, NaN]
  },
}

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

export namespace inplace {
  export function project_xy(x: Arrayable<number>, y: Arrayable<number>, merc_x?: Arrayable<number>, merc_y?: Arrayable<number>): void {
    const n = min(x.length, y.length)
    merc_x = merc_x ?? x
    merc_y = merc_y ?? y
    for (let i = 0; i < n; i++) {
      const xi = x[i]
      const yi = y[i]
      const [merc_xi, merc_yi] = wgs84_mercator.compute(xi, yi)
      merc_x[i] = merc_xi
      merc_y[i] = merc_yi
    }
  }

  export function project_xsys(xs: Arrayable<number>[], ys: Arrayable<number>[], merc_xs?: Arrayable<number>[], merc_ys?: Arrayable<number>[]): void {
    const n = min(xs.length, ys.length)
    merc_xs = merc_xs ?? xs
    merc_ys = merc_ys ?? ys
    for (let i = 0; i < n; i++) {
      project_xy(xs[i], ys[i], merc_xs[i], merc_ys[i])
    }
  }
}

export function project_xy(x: Arrayable<number>, y: Arrayable<number>): [NumberArray, NumberArray] {
  const n = min(x.length, y.length)
  const merc_x = new NumberArray(n)
  const merc_y = new NumberArray(n)
  inplace.project_xy(x, y, merc_x, merc_y)
  return [merc_x, merc_y]
}

export function project_xsys(xs: Arrayable<number>[], ys: Arrayable<number>[]): [NumberArray[], NumberArray[]] {
  const n = min(xs.length, ys.length)
  const merc_xs: NumberArray[] = new Array(n)
  const merc_ys: NumberArray[] = new Array(n)
  for (let i = 0; i < n; i++) {
    const [merc_x, merc_y] = project_xy(xs[i], ys[i])
    merc_xs[i] = merc_x
    merc_ys[i] = merc_y
  }
  return [merc_xs, merc_ys]
}
