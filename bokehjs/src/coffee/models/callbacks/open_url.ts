/* XXX: partial */
import {Model} from "../../model";
import * as p from "core/properties";
import {get_indices} from "core/util/selection";
import {replace_placeholders} from "core/util/templating"

export class OpenURL extends Model {
  static initClass() {
    this.prototype.type = 'OpenURL';

    this.define({
      url: [ p.String, 'http://' ] // TODO (bev) better type
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
