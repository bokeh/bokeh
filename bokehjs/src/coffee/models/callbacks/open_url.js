/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Model} from "../../model";
import * as p from "core/properties";
import {get_indices} from "core/util/selection";
import {replace_placeholders} from "core/util/templating"
;

export class OpenURL extends Model {
  static initClass() {
    this.prototype.type = 'OpenURL';

    this.define({
      url: [ p.String, 'http://' ] // TODO (bev) better type
    });
  }

  execute(cb_obj, cb_data) {
    for (let i of Array.from(get_indices(cb_data.source))) {
      const url = replace_placeholders(this.url, cb_data.source, i);
      window.open(url);
    }
    return null;
  }
}
OpenURL.initClass();
