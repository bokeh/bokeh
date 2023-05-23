import {buffer_to_base64} from "../util/buffer"
import type {Comparator, Equatable} from "../util/eq"
import {equals} from "../util/eq"

export class Buffer implements Equatable {
  constructor(readonly buffer: ArrayBuffer) {}

  to_base64(): string {
    return buffer_to_base64(this.buffer)
  }

  [equals](that: Buffer, cmp: Comparator): boolean {
    return cmp.eq(this.buffer, that.buffer)
  }
}

export class Base64Buffer extends Buffer {
  toJSON(): string {
    return this.to_base64()
  }
}
