import {Callback} from "./callback"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {replace_placeholders} from "core/util/templating"
import * as p from "core/properties"

export namespace OpenURL {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Callback.Props & {
    url: p.Property<string>
  }
}

export interface OpenURL extends OpenURL.Attrs {}

export class OpenURL extends Callback {
  properties: OpenURL.Props

  constructor(attrs?: Partial<OpenURL.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'OpenURL'

    this.define<OpenURL.Props>({
      url: [ p.String, 'http://' ],
    })
  }

  execute(_cb_obj: unknown, {source}: {source: ColumnarDataSource}): void {
    const open_url = (i: number) => {
      const url = replace_placeholders(this.url, source, i)
      window.open(url)
    }

    const {selected} = source

    for (const i of selected.indices)
      open_url(i)

    for (const i of selected.line_indices)
      open_url(i)

    // TODO: multiline_indices: {[key: string]: number[]}
  }
}
OpenURL.initClass()
