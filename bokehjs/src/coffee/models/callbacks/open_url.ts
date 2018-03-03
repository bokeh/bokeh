import {Callback} from "./callback"
import * as p from "core/properties"
import {get_indices} from "core/util/selection"
import {replace_placeholders} from "core/util/templating"

export namespace OpenURL {
  export interface Attrs extends Callback.Attrs {
    url: string
  }
}

export interface OpenURL extends OpenURL.Attrs {}

export class OpenURL extends Callback {

  constructor(attrs?: Partial<OpenURL.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'OpenURL'

    this.define({
      url: [ p.String, 'http://' ],
    })
  }

  execute(_cb_obj: any, cb_data: {[key: string]: any}): any {
    for (const i of get_indices(cb_data.source)) {
      const url = replace_placeholders(this.url, cb_data.source, i)
      window.open(url)
    }
    return null
  }
}
OpenURL.initClass()
