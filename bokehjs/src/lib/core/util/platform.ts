import {ByteOrder} from "../types"

export const is_mobile = (() => {
  return typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
})()

export const is_little_endian = (() => {
  const buf = new ArrayBuffer(4)
  const buf8 = new Uint8Array(buf)
  const buf32 = new Uint32Array(buf)
  buf32[1] = 0x0a0b0c0d

  let little_endian = true
  if (buf8[4] == 0x0a && buf8[5] == 0x0b && buf8[6] == 0x0c && buf8[7] == 0x0d) {
    little_endian = false
  }
  return little_endian
})()

export const BYTE_ORDER: ByteOrder = is_little_endian ? "little" : "big"

export function to_big_endian(values: Uint32Array): Uint32Array {
  if (is_little_endian) {
    const result = new Uint32Array(values.length)
    const view = new DataView(result.buffer)
    let j = 0
    for (const color of values) {
      view.setUint32(j, color)
      j += 4
    }
    return result
  } else
    return values
}
