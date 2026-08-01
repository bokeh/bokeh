import type {ID} from "../core/types"
import {isString} from "../core/util/types"
import type {Header} from "./message"
import {Message} from "./message"

export type Fragment = string | ArrayBufferLike

export class Receiver {
  message: Message<unknown> | null = null

  protected _header: Header | null = null
  protected _content: unknown = null
  protected _buffer_ids: ID[] = []
  protected _buffers: Map<ID, ArrayBuffer> = new Map()
  protected _current_consumer: (fragment: Fragment) => void = this._ENVELOPE

  consume(fragment: Fragment): void {
    try {
      this._current_consumer(fragment)
    } catch (error) {
      this._reset()
      throw error
    }
  }

  protected _reset(): void {
    this._header = null
    this._content = null
    this._buffer_ids = []
    this._buffers = new Map()
    this._current_consumer = this._ENVELOPE
  }

  _ENVELOPE(fragment: Fragment): void {
    this._assume_text(fragment)
    this.message = null
    const {header, content, buffers} = Message.decode(fragment)
    if (new Set(buffers).size != buffers.length) {
      throw new Error("Expected buffer ids to be unique")
    }

    if (buffers.length == 0) {
      this.message = new Message(header, content)
    } else {
      this._header = header
      this._content = content
      this._buffer_ids = buffers
      this._current_consumer = this._BUFFER_PAYLOAD
    }
  }

  _BUFFER_PAYLOAD(fragment: Fragment): void {
    this._assume_binary(fragment)
    const id = this._buffer_ids[this._buffers.size]
    this._buffers.set(id, fragment)
    if (this._buffers.size == this._buffer_ids.length) {
      this.message = new Message(this._header!, this._content, this._buffers)
      this._reset()
    }
  }

  private _assume_text(fragment: Fragment): asserts fragment is string {
    if (!isString(fragment)) {
      throw new Error("Expected text fragment but received binary fragment")
    }
  }

  private _assume_binary(fragment: Fragment): asserts fragment is ArrayBuffer {
    if (!(fragment instanceof ArrayBuffer)) {
      throw new Error("Expected binary fragment but received text fragment")
    }
  }
}
