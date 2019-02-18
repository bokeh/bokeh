import {WebDataSource} from "./web_data_source"
import {HTTPMethod} from "core/enums"
import {logger} from "core/logging"
import * as p from "core/properties"

export namespace ServerSentDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = WebDataSource.Props & {
    content_type: p.Property<string>
    http_headers: p.Property<{[key: string]: string}>
    max_size: p.Property<number>
    method: p.Property<HTTPMethod>
    if_modified: p.Property<boolean>
  }
}

export interface ServerSentDataSource extends ServerSentDataSource.Attrs {}

export class ServerSentDataSource extends WebDataSource {
  properties: ServerSentDataSource.Props

  constructor(attrs?: Partial<ServerSentDataSource.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'ServerSentDataSource'

    this.define<ServerSentDataSource.Props>({
      content_type: [ p.String,     'text/event-stream' ],
      http_headers: [ p.Any,         {}                 ],
      max_size:     [ p.Number                          ],
      method:       [ p.HTTPMethod,  'GET'              ], // TODO (bev)  enum?
      if_modified:  [ p.Boolean,     false              ],
    })
  }

  protected initialized: boolean = false

  destroy(): void {
    super.destroy()
  }

  setup(): void {
    if (!this.initialized) {
      this.initialized = true
      const source = new EventSource(this.data_url)
      source.onmessage = (event) => {
        this.load_data(JSON.parse(event.data), this.mode, this.max_size)
      }
    }
  }

  do_error(xhr: XMLHttpRequest): void {
    logger.error(`Failed to fetch JSON from ${this.data_url} with code ${xhr.status}`)
  }
}
ServerSentDataSource.initClass()
