import type {NDDataType} from "../types"

import {gunzipSync, gzipSync} from "fflate"

export function b64encode(data: Uint8Array): string {
  const chars = Array.from(data).map((b) => String.fromCharCode(b))
  return btoa(chars.join(""))
}

export function b64decode(data: string): Uint8Array {
  const binary_string = atob(data)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0, end = len; i < end; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes
}

export function buffer_to_base64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  // we do not want the result to be different depending on mtime, since that is
  // irrelevant and also makes things harder to test, so set mtime=0 here
  const compressed = gzipSync(bytes, {mtime: 0})
  return b64encode(compressed)
}

export function base64_to_buffer(base64: string): ArrayBuffer {
  const bytes = b64decode(base64)
  return gunzipSync(bytes).buffer
}

// NOTE: swap{16,32,64} assume byteOffset == 0

function swap16(buffer: ArrayBuffer): void {
  const x = new Uint8Array(buffer)
  for (let i = 0, end = x.length; i < end; i += 2) {
    const t = x[i]
    x[i] = x[i + 1]
    x[i + 1] = t
  }
}

function swap32(buffer: ArrayBuffer): void {
  const x = new Uint8Array(buffer)
  for (let i = 0, end = x.length; i < end; i += 4) {
    let t = x[i]
    x[i] = x[i + 3]
    x[i + 3] = t
    t = x[i + 1]
    x[i + 1] = x[i + 2]
    x[i + 2] = t
  }
}

function swap64(buffer: ArrayBuffer): void {
  const x = new Uint8Array(buffer)
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

export function swap(buffer: ArrayBuffer, dtype: NDDataType): void {
  switch (dtype) {
    case "uint16":
    case "int16":
      swap16(buffer)
      break
    case "uint32":
    case "int32":
    case "float32":
      swap32(buffer)
      break
    case "float64":
      swap64(buffer)
      break
    case "object":
    case "uint8":
    case "int8":
    case "bool":
      break
  }
}
