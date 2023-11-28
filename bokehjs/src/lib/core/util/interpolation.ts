import type {Arrayable} from "../types"
import {infer_type} from "../types"
import {assert} from "./assert"

export function catmullrom_spline(x: Arrayable<number>, y: Arrayable<number>,
    T: number = 10, tension: number = 0.5, closed: boolean = false): [Arrayable<number>, Arrayable<number>] {
  /** Centripetal Catmull-Rom spline. */
  assert(x.length == y.length)

  const n = x.length
  const N = closed ? n + 1 : n

  const ArrayType = infer_type(x, y)

  const xx = new ArrayType(N + 2)
  const yy = new ArrayType(N + 2)
  xx.set(x, 1)
  yy.set(y, 1)

  if (closed) {
    xx[0] = x[n-1]
    yy[0] = y[n-1]
    xx[N] = x[0]
    yy[N] = y[0]
    xx[N+1] = x[1]
    yy[N+1] = y[1]
  } else {
    xx[0] = x[0]
    yy[0] = y[0]
    xx[N+1] = x[n-1]
    yy[N+1] = y[n-1]
  }

  const basis = new ArrayType(4*(T + 1))
  for (let j = 0, k = 0; j <= T; j++) {
    const t = j/T
    const t_2 = t**2
    const t_3 = t*t_2
    basis[k++] =  2*t_3 - 3*t_2 + 1 // h00
    basis[k++] = -2*t_3 + 3*t_2     // h01
    basis[k++] =    t_3 - 2*t_2 + t // h10
    basis[k++] =    t_3 -   t_2     // h11
  }

  const xt = new ArrayType((N - 1)*(T + 1))
  const yt = new ArrayType((N - 1)*(T + 1))

  for (let i = 1, k = 0; i < N; i++) {
    const t0x = (xx[i+1] - xx[i-1])*tension
    const t0y = (yy[i+1] - yy[i-1])*tension
    const t1x = (xx[i+2] - xx[i])*tension
    const t1y = (yy[i+2] - yy[i])*tension

    for (let j = 0; j <= 4*T; k++) {
      const h00 = basis[j++]
      const h01 = basis[j++]
      const h10 = basis[j++]
      const h11 = basis[j++]

      xt[k] = h00*xx[i] + h01*xx[i+1] + h10*t0x + h11*t1x
      yt[k] = h00*yy[i] + h01*yy[i+1] + h10*t0y + h11*t1y
    }
  }

  return [xt, yt]
}
