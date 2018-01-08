/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Model} from "../../model";
import * as hittest from "core/hittest";
import * as p from "core/properties";
import {isFunction} from "core/util/types"
;

export class DataSource extends Model {
  static initClass() {
    this.prototype.type = 'DataSource';


    selected: hittest.HitTestResult
    ;

    this.define({
        selected: [ p.Any, hittest.create_hit_test_result() ], // TODO (bev)
        callback: [ p.Any                                   ] // TODO: p.Either(p.Instance(Callback), p.Function) ]
      });
  }

  initialize(options) {
    super.initialize(options);
    return this.connect(this.properties.selected.change, () => {
      const { callback } = this;
      if (callback != null) {
        if (isFunction(callback)) {
          return callback(this);
        } else {
          return callback.execute(this);
        }
      }
    });
  }
}
DataSource.initClass();
