import {WebDataSource} from "./web_data_source"
import {UpdateMode, HTTPMethod} from "core/enums"
import {logger} from "core/logging"
import * as p from "core/properties"
import {entries} from "core/util/object"

export namespace AjaxDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = WebDataSource.Props & {
    polling_interval: p.Property<number>
    content_type: p.Property<string>
    http_headers: p.Property<{[key: string]: string}>
    method: p.Property<HTTPMethod>
    if_modified: p.Property<boolean>
  }
}

export interface AjaxDataSource extends AjaxDataSource.Attrs {}

export class AjaxDataSource extends WebDataSource {
  properties: AjaxDataSource.Props

  constructor(attrs?: Partial<AjaxDataSource.Attrs>) {
    super(attrs)
  }

  static init_AjaxDataSource(): void {
    this.define<AjaxDataSource.Props>({
      polling_interval: [ p.Number ],
      content_type: [ p.String,     'application/json' ],
      http_headers: [ p.Any,         {}                ],
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
    for (const [name, value] of entries(http_headers)) {
      xhr.setRequestHeader(name, value)
    }

    return xhr
  }

  do_load(xhr: XMLHttpRequest, mode: UpdateMode, max_size: number): void {
    if (xhr.status === 200) {
      const raw_data = JSON.parse(xhr.responseText)
      this.load_data(raw_data, mode, max_size)
    }
  }

  do_error(xhr: XMLHttpRequest): void {
    logger.error(`Failed to fetch JSON from ${this.data_url} with code ${xhr.status}`)
  }
}
