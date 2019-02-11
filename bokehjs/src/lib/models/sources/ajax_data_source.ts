import {RemoteDataSource} from "./remote_data_source"
import {CallbackLike1} from "../callbacks/callback"
import {UpdateMode, HTTPMethod} from "core/enums"
import {Data} from "core/types"
import {logger} from "core/logging"
import * as p from "core/properties"

export namespace AjaxDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = RemoteDataSource.Props & {
    mode: p.Property<UpdateMode>
    content_type: p.Property<string>
    adapter: p.Property<CallbackLike1<AjaxDataSource, {response: Data}, Data> | null>
    http_headers: p.Property<{[key: string]: string}>
    max_size: p.Property<number>
    method: p.Property<HTTPMethod>
    if_modified: p.Property<boolean>
  }
}

export interface AjaxDataSource extends AjaxDataSource.Attrs {}

export class AjaxDataSource extends RemoteDataSource {
  properties: AjaxDataSource.Props

  constructor(attrs?: Partial<AjaxDataSource.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'AjaxDataSource'

    this.define<AjaxDataSource.Props>({
      mode:         [ p.UpdateMode, 'replace'          ],
      content_type: [ p.String,     'application/json' ],
      adapter:      [ p.Any,        null               ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
      http_headers: [ p.Any,         {}                ],
      max_size:     [ p.Number                         ],
      method:       [ p.HTTPMethod,  'POST'            ], // TODO (bev)  enum?
      if_modified:  [ p.Boolean,     false             ],
    })
  }

  protected interval: number
  protected initialized: boolean = false

  destroy(): void {
    if (this.interval != null)
      clearInterval(this.interval)
    super.destroy()
  }

  setup(): void {
    if (!this.initialized) {
      this.initialized = true
      this.get_data(this.mode)
      if (this.polling_interval) {
        const callback = () => this.get_data(this.mode, this.max_size, this.if_modified)
        this.interval = setInterval(callback, this.polling_interval)
      }
    }
  }

  get_data(mode: UpdateMode, max_size: number = 0, _if_modified: boolean = false): void {
    const xhr = this.prepare_request()

    // TODO: if_modified
    xhr.addEventListener("load", () => this.do_load(xhr, mode, max_size))
    xhr.addEventListener("error", () => this.do_error(xhr))

    xhr.send()
  }

  prepare_request(): XMLHttpRequest {
    const xhr = new XMLHttpRequest()
    xhr.open(this.method, this.data_url, true)
    xhr.withCredentials = false
    xhr.setRequestHeader("Content-Type", this.content_type)

    const http_headers = this.http_headers
    for (const name in http_headers) {
      const value = http_headers[name]
      xhr.setRequestHeader(name, value)
    }

    return xhr
  }

  do_load(xhr: XMLHttpRequest, mode: UpdateMode, max_size: number): void {
    if (xhr.status === 200) {
      const raw_data = JSON.parse(xhr.responseText)

      const {adapter} = this
      let data: Data
      if (adapter != null)
        data = adapter.execute(this, {response: raw_data})
      else
        data = raw_data

      switch (mode) {
        case "replace": {
          this.data = data
          break
        }
        case "append": {
          const original_data = this.data
          for (const column of this.columns()) {
            // XXX: support typed arrays
            const old_col = Array.from(original_data[column])
            const new_col = Array.from(data[column])
            data[column] = old_col.concat(new_col).slice(-max_size)
          }
          this.data = data
          break
        }
      }
    }
  }

  do_error(xhr: XMLHttpRequest): void {
    logger.error(`Failed to fetch JSON from ${this.data_url} with code ${xhr.status}`)
  }
}
AjaxDataSource.initClass()
