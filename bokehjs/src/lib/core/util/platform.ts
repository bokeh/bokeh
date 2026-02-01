import type {ByteOrder} from "../types"

export const is_mobile = (() => {
  return "ontouchstart" in globalThis || (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
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

export function to_big_endian(values: Uint32Array): void {
  if (is_little_endian) {
    const bytes = new Uint8Array(values.buffer)
    const n_bytes = bytes.length
    for (let i = 0; i < n_bytes; i+=4) {
      let temp_byte = bytes[i]
      bytes[i] = bytes[i+3]
      bytes[i+3] = temp_byte
      temp_byte = bytes[i+1]
      bytes[i+1] = bytes[i+2]
      bytes[i+2] = temp_byte
    }
  }
}
