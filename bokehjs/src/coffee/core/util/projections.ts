import {proj4, mercator} from "./proj4"

export function project_xy(x: number[], y: number[]): [number[], number[]] {
  const n = Math.min(x.length, y.length)
  const merc_x_s = new Array<number>(n)
  const merc_y_s = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    const [merc_x, merc_y] = proj4(mercator, [x[i], y[i]])
    merc_x_s[i] = merc_x
    merc_y_s[i] = merc_y
  }
  return [merc_x_s, merc_y_s]
}

export function project_xsys(xs: number[][], ys: number[][]): [number[][], number[][]] {
  const n = Math.min(xs.length, ys.length)
  const merc_xs_s = new Array<number[]>(n)
  const merc_ys_s = new Array<number[]>(n)
  for (let i = 0; i < n; i++) {
    const [merc_x_s, merc_y_s] = project_xy(xs[i], ys[i])
    merc_xs_s[i] = merc_x_s
    merc_ys_s[i] = merc_y_s
  }
  return [merc_xs_s, merc_ys_s]
}
