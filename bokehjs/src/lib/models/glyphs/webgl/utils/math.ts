// Greatest Common Divisor of 2+ integers using Euclid's algorithm.
function gcd2(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)

  if (a == 0) {
    return b
  }
  if (b == 0) {
    return a
  }

  while (b != 0) {
    const remainder = a % b
    a = b
    b = remainder
  }

  return a
}

export function gcd(values: number[]): number {
  let ret = 0

  for (let i = 0; i < values.length; i++) {
    ret = gcd2(ret, values[i])
  }

  return ret
}

// From regl
export function is_pow_2(v: number): boolean {
  return (v & (v - 1)) == 0 && v != 0
}
