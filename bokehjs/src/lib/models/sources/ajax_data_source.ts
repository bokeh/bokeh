import {WebDataSource} from "./web_data_source"
import type {Dict} from "core/types"
import type {UpdateMode} from "core/enums"
import {HTTPMethod} from "core/enums"
import {logger} from "core/logging"
import type * as p from "core/properties"
import {entries} from "core/util/object"

export namespace AjaxDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = WebDataSource.Props & {
    polling_interval: p.Property<number | null>
    content_type: p.Property<string>
    http_headers: p.Property<Dict<string>>
    method: p.Property<HTTPMethod>
    if_modified: p.Property<boolean>
  }
}

export interface AjaxDataSource extends AjaxDataSource.Attrs {}

export class AjaxDataSource extends WebDataSource {
  declare properties: AjaxDataSource.Props

  constructor(attrs?: Partial<AjaxDataSource.Attrs>) {
    super(attrs)
  }

  static {
    this.define<AjaxDataSource.Props>(({Bool, Int, Str, Dict, Nullable}) => ({
      polling_interval: [ Nullable(Int), null ],
      content_type:     [ Str, "application/json" ],
      http_headers:     [ Dict(Str), {} ],
      method:           [ HTTPMethod, "POST" ],
      if_modified:      [ Bool, false ],
    }))
  }

  // TODO don't use initializers until https://github.com/bokeh/bokeh/issues/13732 is fixed
  protected interval?: number
  protected initialized?: boolean
  protected last_fetch_time?: Date

  override destroy(): void {
    if (this.interval != null) {
      clearInterval(this.interval)
    }
    super.destroy()
  }

  setup(): void {
    if (this.initialized !== true) {
      this.initialized = true
      this.get_data(this.mode)
      if (this.polling_interval != null) {
        const callback = () => this.get_data(this.mode, this.max_size, this.if_modified)
        this.interval = setInterval(callback, this.polling_interval)
      }
    }
  }

  get_data(mode: UpdateMode, max_size: number | null = null, if_modified: boolean = false): void {
    const xhr = this.prepare_request()

    xhr.addEventListener("load", () => this.do_load(xhr, mode, max_size ?? undefined))
    xhr.addEventListener("error", () => this.do_error(xhr))

    if (if_modified && this.last_fetch_time != null) {
      xhr.setRequestHeader("If-Modified-Since", this.last_fetch_time.toUTCString())
    }

    xhr.send()
  }

  prepare_request(): XMLHttpRequest {
    const xhr = new XMLHttpRequest()
    xhr.open(this.method, this.data_url, true)
    xhr.withCredentials = false
    xhr.setRequestHeader("Content-Type", this.content_type)

    for (const [name, value] of entries(this.http_headers)) {
      xhr.setRequestHeader(name, value)
    }

    return xhr
  }

  async do_load(xhr: XMLHttpRequest, mode: UpdateMode, max_size?: number): Promise<void> {
    if (xhr.status == 200) {
      const raw_data = JSON.parse(xhr.responseText)
      this.last_fetch_time = new Date()
      await this.load_data(raw_data, mode, max_size)
    }
  }

  do_error(xhr: XMLHttpRequest): void {
    logger.error(`Failed to fetch JSON from ${this.data_url} with code ${xhr.status}`)
  }
}
