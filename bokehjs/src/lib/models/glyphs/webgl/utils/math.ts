// Greatest Common Divisor of 2+ integers using Euclid's algorithm.
function gcd2(a: number, b: number): number {
  let higher: number
  let lower: number

  if (a > b) {
    higher = a
    lower = b
  } else {
    higher = b
    lower = a
  }

  let divisor = higher % lower

  while (divisor != 0) {
    higher = lower
    lower = divisor
    divisor = higher % lower
  }

  return lower
}

export function gcd(values: number[]): number {
  let ret = values[0]

  for (let i = 1; i < values.length; i++) {
    ret = gcd2(ret, values[i])
  }

  return ret
}

// From regl
export function is_pow_2(v: number): boolean {
  return (v & (v - 1)) == 0 && v != 0
}
