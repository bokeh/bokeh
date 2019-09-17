export type Bezier = [number, number, number, number, number, number]

export function segment_to_bezier(
    cx: number, cy: number,
    th0: number, th1: number,
    rx: number, ry: number,
    sin_th: number, cos_th: number): Bezier {
  const a00 = cos_th*rx
  const a01 = -sin_th*ry
  const a10 = sin_th*rx
  const a11 = cos_th*ry
  const th_half = 0.5*(th1 - th0)
  const t = (8/3)*Math.sin(th_half*0.5)*Math.sin(th_half*0.5) / Math.sin(th_half)
  const x1 = cx + Math.cos(th0) - t*Math.sin(th0)
  const y1 = cy + Math.sin(th0) + t*Math.cos(th0)
  const x3 = cx + Math.cos(th1)
  const y3 = cy + Math.sin(th1)
  const x2 = x3 + t*Math.sin(th1)
  const y2 = y3 - t*Math.cos(th1)

  return [
    a00*x1 + a01*y1, a10*x1 + a11*y1,
    a00*x2 + a01*y2, a10*x2 + a11*y2,
    a00*x3 + a01*y3, a10*x3 + a11*y3,
  ]
}

export function arc_to_bezier(
    ox: number, oy: number,
    radx: number, rady: number,
    rotateX: number,
    large: number,
    sweep: number,
    x: number, y: number): Bezier[] {
  const th = rotateX*(Math.PI/180)
  const sin_th = Math.sin(th)
  const cos_th = Math.cos(th)
  let rx = Math.abs(radx)
  let ry = Math.abs(rady)

  const px = cos_th*(ox - x)*0.5 + sin_th*(oy - y)*0.5
  const py = cos_th*(oy - y)*0.5 - sin_th*(ox - x)*0.5
  let pl = (px*px) / (rx*rx) + (py*py) / (ry*ry)

  if (pl > 1) {
    pl = Math.sqrt(pl)
    rx *= pl
    ry *= pl
  }

  const a00 = cos_th / rx
  const a01 = sin_th / rx
  const a10 = -sin_th / ry
  const a11 = cos_th / ry
  const x0 = a00*ox + a01*oy
  const y0 = a10*ox + a11*oy
  const x1 = a00*x + a01*y
  const y1 = a10*x + a11*y
  const d = (x1 - x0)*(x1 - x0) + (y1 - y0)*(y1 - y0)

  let sfactor_sq = 1 / d - 0.25
  if (sfactor_sq < 0)
    sfactor_sq = 0

  let sfactor = Math.sqrt(sfactor_sq)
  if (sweep == large)
    sfactor = -sfactor

  const xc = 0.5*(x0 + x1) - sfactor*(y1 - y0)
  const yc = 0.5*(y0 + y1) + sfactor*(x1 - x0)
  const th0 = Math.atan2(y0 - yc, x0 - xc)
  const th1 = Math.atan2(y1 - yc, x1 - xc)

  let th_arc = th1 - th0
  if (th_arc < 0 && sweep == 1)
    th_arc += 2*Math.PI
  else if (th_arc > 0 && sweep == 0)
    th_arc -= 2*Math.PI

  const segments = Math.ceil(Math.abs(th_arc / (Math.PI*0.5 + 0.001)))

  let beziers: Bezier[] = []
  for (let i = 0; i < segments; i++) {
    const th2 = th0 + i*th_arc / segments
    const th3 = th0 + (i+1)*th_arc / segments
    beziers.push(segment_to_bezier(xc, yc, th2, th3, rx, ry, sin_th, cos_th))
  }
  return beziers
}
