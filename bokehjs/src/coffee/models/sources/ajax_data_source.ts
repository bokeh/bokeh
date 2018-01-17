/* XXX: partial */
import {RemoteDataSource} from "./remote_data_source"
import {logger} from "core/logging"
import * as p from "core/properties"

export type UpdateMode = "replace" | "append"
export type HTTPMethod = "POST" | "GET"

export class AjaxDataSource extends RemoteDataSource {

  mode: UpdateMode
  content_type: string
  http_headers: {[key: string]: string}
  max_size: number
  method: HTTPMethod
  if_modified: boolean

  static initClass() {
    this.prototype.type = 'AjaxDataSource'

    this.define({
      mode:         [ p.String, 'replace'          ],
      content_type: [ p.String, 'application/json' ],
      http_headers: [ p.Any,    {}                 ], // TODO (bev)
      max_size:     [ p.Number                     ],
      method:       [ p.String, 'POST'             ], // TODO (bev)  enum?
      if_modified:  [ p.Bool,   false              ],
    })
  }

  destroy(): void {
    if (this.interval != null)
      return clearInterval(this.interval)
    super.destroy()
  }

  setup(): void {
    if (this.initialized == null) {
      this.initialized = true
      this.get_data(this.mode)
      if (this.polling_interval) {
        this.interval = setInterval(this.get_data, this.polling_interval,
                                    this.mode, this.max_size, this.if_modified)
      }
    }
  }

  get_data(mode: UpdateMode, max_size: number = 0, _if_modified: boolean = false): void {
    const xhr = new XMLHttpRequest()
    xhr.open(this.method, this.data_url, true)
    xhr.withCredentials = false
    xhr.setRequestHeader("Content-Type", this.content_type)

    const http_headers = this.http_headers
    for (const name in http_headers) {
      const value = http_headers[name]
      xhr.setRequestHeader(name, value)
    }

    // TODO: if_modified
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        switch (mode) {
          case "replace": {
            this.data = data
            break
          }
          case "append": {
            const original_data = this.data
            for (const column of this.columns()) {
              data[column] = original_data[column].concat(data[column]).slice(-max_size)
            }
            this.data = data
            break
          }
        }
      }
    })
    xhr.addEventListener("error", () => {
      logger.error(`Failed to fetch JSON from ${this.data_url} with code ${xhr.status}`)
    })
    xhr.send()
  }
}
AjaxDataSource.initClass()
