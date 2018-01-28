/* XXX: partial */
import {Model} from "../../model";
import * as p from "core/properties";
import {get_indices} from "core/util/selection";
import {replace_placeholders} from "core/util/templating"

export namespace OpenURL {
  export interface Attrs extends Model.Attrs {
    url: string
  }

  export interface Opts extends Model.Opts {}
}

export interface OpenURL extends OpenURL.Attrs {}

export class OpenURL extends Model {

  constructor(attrs?: Partial<OpenURL.Attrs>, opts?: OpenURL.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'OpenURL';

    this.define({
      url: [ p.String, 'http://' ], // TODO (bev) better type
    });
  }

  execute(_cb_obj, cb_data) {
    for (const i of get_indices(cb_data.source)) {
      const url = replace_placeholders(this.url, cb_data.source, i);
      window.open(url);
    }
    return null;
  }
}
OpenURL.initClass();
