import {WebDataSource} from "./web_data_source"
import * as p from "core/properties"

export namespace ServerSentDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = WebDataSource.Props & {
  }
}

export interface ServerSentDataSource extends ServerSentDataSource.Attrs {}

export class ServerSentDataSource extends WebDataSource {
  properties: ServerSentDataSource.Props

  constructor(attrs?: Partial<ServerSentDataSource.Attrs>) {
    super(attrs)
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
}
