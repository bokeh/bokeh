import {PNG} from "pngjs"

export type ImageDiff = {pixels: number, percent: number, diff: Buffer}

function rgba2hsla(r: number, g: number, b: number, a: number): [number, number, number, number] {
  r /= 255, g /= 255, b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  const l = (max + min) / 2
  let h = 0, s = 0

  if (max != min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h /= 6
  }

  const f = Math.round
  return [f(h*360), f(s*100), f(l*100), a]
}

export function diff_image(existing: Buffer, current: Buffer, verbose: boolean = false): ImageDiff | null {
  const existing_img = PNG.sync.read(existing)
  const current_img = PNG.sync.read(current)

  // TODO: resize
  const same_dims = existing_img.width == current_img.width && existing_img.height == current_img.height
  if (!same_dims) {
    throw new Error("bad dims")
  }

  const {width, height} = current_img
  const diff_img = new PNG({width, height})

  const len = width*height
  const a32 = new Uint32Array(existing_img.data.buffer, existing_img.data.byteOffset, len)
  const b32 = new Uint32Array(current_img.data.buffer, current_img.data.byteOffset, len)
  const c32 = new Uint32Array(diff_img.data.buffer, diff_img.data.byteOffset, len)

  function encode(r: number, g: number, b: number, a: number = 1.0): number {
    return (a*255 & 0xFF) << 24 | (b & 0xFF) << 16 | (g & 0xFF) << 8 | (r & 0xFF)
  }

  function decode(v: number): [number, number, number, number] {
    return [v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, ((v >> 24) & 0xFF) / 255]
  }

  c32.fill(encode(0, 0, 0))

  let pixels = 0
  for (let i = 0; i < len; i++) {
    const a = a32[i]
    const b = b32[i]

    if (a != b) {
      const [r0, g0, b0, a0] = decode(a)
      const [r1, g1, b1, a1] = decode(b)

      const [h0, s0, l0, _a0] = rgba2hsla(r0, g0, b0, a0)
      const [h1, s1, l1, _a1] = rgba2hsla(r1, g1, b1, a1)

      if (!(h0 == h1 && s0 == s1 && l0 == l1 && _a0 == _a1)) {
        const d = (a: number, b: number) => Math.abs(a - b)


        if (!(h0 == h1 && s0 == s1 && /*l0 == l1*/ d(l0, l1) <= 5 && _a0 == _a1)) {
          if (verbose) {
            const [x, y] = [i % width, Math.floor(i / width)]
            console.log("")
            console.log(`existing(${x}, ${y}) = RGBA(${r0}, ${g0}, ${b0}, ${a0}) HSLA(${h0}, ${s0}, ${l0}, ${_a0})`)
            console.log(`current(${x}, ${y})  = RGBA(${r1}, ${g1}, ${b1}, ${a1}) HSLA(${h1}, ${s1}, ${l1}, ${_a1})`)
            console.log(`d(h0, h1) = ${d(h0, h1)} d(s0, s1) = ${d(s0, s1)} d(l0, l1) = ${d(l0, l1)}`)
          }
          pixels++
          c32[i] = encode(0, 0, 255)
        }
      }
    }
  }

  if (pixels == 0) {
    return null
  } else {
    return {
      pixels,
      percent: pixels/(width*height)*100,
      diff: PNG.sync.write(diff_img),
    }
  }
}
