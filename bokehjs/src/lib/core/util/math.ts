const enum Direction {clock, anticlock}

export function angle_norm(angle: number): number {
  if (angle == 0) {
    return 0
  }
  while (angle <= 0) {
    angle += 2*Math.PI
  }
  while (angle > 2*Math.PI) {
    angle -= 2*Math.PI
  }
  return angle
}

export function angle_dist(lhs: number, rhs: number): number {
  return angle_norm(lhs-rhs)
}

export function angle_between(mid: number, lhs: number, rhs: number, direction: Direction): boolean {
  const d = angle_dist(lhs, rhs)
  if (d == 0)
    return false
  if (d == 2*Math.PI)
    return true
  const norm_mid = angle_norm(mid)
  const cond = angle_dist(lhs, norm_mid) <= d && angle_dist(norm_mid, rhs) <= d
  return (direction == Direction.clock) ? cond : !cond
}

export function random(): number {
  return Math.random()
}

export function randomIn(min: number, max?: number): number {
  if (max == null) {
    max = min
    min = 0
  }

  return min + Math.floor(Math.random()*(max - min + 1))
}

export function atan2(start: [number, number], end: [number, number]): number {
  /*
   * Calculate the angle between a line containing start and end points (composed
   * of [x, y] arrays) and the positive x-axis.
   */
  return Math.atan2(end[1] - start[1], end[0] - start[0])
}

export function radians(degrees: number): number {
  return degrees*(Math.PI/180)
}

export function degrees(radians: number): number {
  return radians/(Math.PI/180)
}

// http://www2.econ.osaka-u.ac.jp/~tanizaki/class/2013/econome3/13.pdf (Page 432)
export function rnorm(mu: number, sigma: number): number {
  // Generate a random normal with a mean of 0 and a sigma of 1
  let r1: number
  let r2: number
  while (true) {
    r1 = random()
    r2 = random()
    r2 = (2*r2-1)*Math.sqrt(2*(1/Math.E))
    if (-4*r1*r1*Math.log(r1) >= r2*r2)
      break
  }
  let rn = r2/r1

  // Transform the standard normal to meet the characteristics that we want (mu, sigma)
  rn = mu + sigma*rn

  return rn
}

export function clamp(val: number, min: number, max: number): number {
  if (val < min)
    return min
  if (val > max)
    return max
  return val
}
