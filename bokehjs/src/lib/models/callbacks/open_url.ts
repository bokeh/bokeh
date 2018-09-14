import {Callback} from "./callback"
import * as p from "core/properties"
import {get_indices} from "core/util/selection"
import {replace_placeholders} from "core/util/templating"

export namespace OpenURL {
  export interface Attrs extends Callback.Attrs {
    url: string
  }

  export interface Props extends Callback.Props {}
}

export interface OpenURL extends OpenURL.Attrs {}

export class OpenURL extends Callback {

  properties: OpenURL.Props

  constructor(attrs?: Partial<OpenURL.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'OpenURL'

    this.define({
      url: [ p.String, 'http://' ],
    })
  }

  execute(_cb_obj: unknown, cb_data: {[key: string]: unknown} = {}): void {
    for (const i of get_indices(cb_data.source)) {
      const url = replace_placeholders(this.url, (cb_data as any).source, i) // XXX
      window.open(url)
    }
  }
}
OpenURL.initClass()
