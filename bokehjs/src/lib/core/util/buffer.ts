import {TypedArray} from "../types"

export function buffer_to_base64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chars = Array.from(bytes).map((b) => String.fromCharCode(b))
  return btoa(chars.join(""))
}

export function base64_to_buffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0, end = len; i < end; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}

type Array16 = Int16Array | Uint16Array
type Array32 = Int32Array | Uint32Array | Float32Array
type Array64 = Float64Array

function swap16(a: Array16): void {
  const x = new Uint8Array(a.buffer, a.byteOffset, a.length * 2)
  for (let i = 0, end = x.length; i < end; i += 2) {
    const t = x[i]
    x[i] = x[i + 1]
    x[i + 1] = t
  }
}

function swap32(a: Array32): void {
  const x = new Uint8Array(a.buffer, a.byteOffset, a.length * 4)
  for (let i = 0, end = x.length; i < end; i += 4) {
    let t = x[i]
    x[i] = x[i + 3]
    x[i + 3] = t
    t = x[i + 1]
    x[i + 1] = x[i + 2]
    x[i + 2] = t
  }
}

function swap64(a: Array64): void {
  const x = new Uint8Array(a.buffer, a.byteOffset, a.length * 8)
  for (let i = 0, end = x.length; i < end; i += 8) {
    let t = x[i]
    x[i] = x[i + 7]
    x[i + 7] = t
    t = x[i + 1]
    x[i + 1] = x[i + 6]
    x[i + 6] = t
    t = x[i + 2]
    x[i + 2] = x[i + 5]
    x[i + 5] = t
    t = x[i + 3]
    x[i + 3] = x[i + 4]
    x[i + 4] = t
  }
}

export function swap(array: TypedArray): void {
  switch (array.BYTES_PER_ELEMENT) {
    case 2:
      swap16(array as Array16)
      break
    case 4:
      swap32(array as Array32)
      break
    case 8:
      swap64(array as Array64)
      break
  }
}
