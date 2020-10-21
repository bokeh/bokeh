import {Message} from "protocol/message"
import {isString} from "core/util/types"

export type Fragment = string | ArrayBuffer

export class Receiver {
  message: Message | null = null

  protected _partial: Message | null = null

  protected _fragments: Fragment[] = []

  protected _buf_header: string | null = null

  protected _current_consumer: (fragment: Fragment) => void = this._HEADER

  consume(fragment: Fragment): void {
    this._current_consumer(fragment)
  }

  _HEADER(fragment: Fragment): void {
    this._assume_text(fragment)
    this.message = null
    this._partial = null
    this._fragments = [fragment]
    this._buf_header = null
    this._current_consumer = this._METADATA
  }

  _METADATA(fragment: Fragment): void {
    this._assume_text(fragment)
    this._fragments.push(fragment)
    this._current_consumer = this._CONTENT
  }

  _CONTENT(fragment: Fragment): void {
    this._assume_text(fragment)
    this._fragments.push(fragment)
    const [header_json, metadata_json, content_json] =
      this._fragments.slice(0, 3) as [string, string, string]
    this._partial = Message.assemble(header_json, metadata_json, content_json)
    this._check_complete()
  }

  _BUFFER_HEADER(fragment: Fragment): void {
    this._assume_text(fragment)
    this._buf_header = fragment
    this._current_consumer = this._BUFFER_PAYLOAD
  }

  _BUFFER_PAYLOAD(fragment: Fragment): void {
    this._assume_binary(fragment)
    this._partial!.assemble_buffer(this._buf_header!, fragment)
    this._check_complete()
  }

  private _assume_text(fragment: Fragment): asserts fragment is string {
    if (!isString(fragment))
      throw new Error("Expected text fragment but received binary fragment")
  }

  private _assume_binary(fragment: Fragment): asserts fragment is ArrayBuffer {
    if (!(fragment instanceof ArrayBuffer))
      throw new Error("Expected binary fragment but received text fragment")
  }

  private _check_complete(): void {
    if (this._partial!.complete()) {
      this.message = this._partial
      this._current_consumer = this._HEADER
    } else
      this._current_consumer = this._BUFFER_HEADER
  }
}
